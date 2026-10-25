import * as THREE from 'three';
import type { Frame } from '../domain/film';
import type { Kind, Participant, Vec3 } from '../domain/participants';
import { buildModel, LIFT } from './models';

const CLEAR_SKY = new THREE.Color(0x9fd3f5);
const RAIN_SKY = new THREE.Color(0x7d8794);
const lift = (kind: Kind) => LIFT[kind] ?? 0;

/** Renders participants in a 3D space. Knows nothing about the story rules. */
export class World {
  private renderer = new THREE.WebGLRenderer({ antialias: true });
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
  private sunlight = new THREE.DirectionalLight(0xfff4e0, 2.2);
  private hemisphere = new THREE.HemisphereLight(0xcfe8ff, 0x4a6b2f, 1.1);
  private models = new Map<string, THREE.Object3D>();
  private raycaster = new THREE.Raycaster();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private drag?: { model: THREE.Object3D; offsetX: number; offsetZ: number };

  /** Called when the child lets go of a participant they dragged to a new place. */
  onDragEnd?: (id: string, position: Vec3) => void;

  constructor(private host: HTMLElement) {
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.scene.background = CLEAR_SKY.clone();
    this.scene.fog = new THREE.Fog(CLEAR_SKY.clone(), 45, 110);
    this.camera.position.set(14, 14, 22);
    this.camera.lookAt(0, 0, 0);

    this.scene.add(this.hemisphere);
    this.sunlight.position.set(12, 22, 8);
    this.sunlight.castShadow = true;
    this.sunlight.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sunlight.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 80 });
    this.sunlight.shadow.bias = -0.0005;
    this.scene.add(this.sunlight);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(150, 64),
      new THREE.MeshStandardMaterial({ color: 0x7fb24a, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    host.appendChild(this.renderer.domElement);
    new ResizeObserver(() => this.resize()).observe(host);
    this.resize();
    this.enableDragging(this.renderer.domElement);
  }

  /** Shows the storyboard as placed, before any film exists. */
  showParticipants(participants: Participant[]) {
    for (const p of participants) {
      const model = this.modelFor(p.id, p.kind);
      this.moveTo(model, p.kind, p.position, false);
      model.visible = true;
    }
    this.setWeather('clear');
    this.render();
  }

  showFrame(frame: Frame) {
    for (const actor of frame.actors) {
      const model = this.modelFor(actor.id, actor.kind);
      this.moveTo(model, actor.kind, actor.position, true);
      model.visible = actor.visible;
    }
    this.setWeather(frame.weather);
    this.render();
  }

  /**
   * Where a participant appears on the page, in CSS pixels, or where it would appear at
   * another spot `at` on the ground. Used to automate dragging.
   */
  screenPositionOf(id: string, at?: { x: number; z: number }): { x: number; y: number } | undefined {
    const model = this.models.get(id);
    if (!model) return undefined;
    // Aim at the middle of the model, not its feet, so a press always lands on it.
    const centre = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
    const point = at
      ? new THREE.Vector3(at.x + centre.x - model.position.x, centre.y, at.z + centre.z - model.position.z)
      : centre;
    const p = point.project(this.camera);
    const rect = this.renderer.domElement.getBoundingClientRect();
    return { x: rect.left + ((p.x + 1) / 2) * rect.width, y: rect.top + ((1 - p.y) / 2) * rect.height };
  }

  private setWeather(weather: Frame['weather']) {
    const sky = weather === 'rain' ? RAIN_SKY : CLEAR_SKY;
    (this.scene.background as THREE.Color).copy(sky);
    (this.scene.fog as THREE.Fog).color.copy(sky);
    (this.scene.fog as THREE.Fog).far = weather === 'rain' ? 70 : 110;
    this.sunlight.intensity = weather === 'rain' ? 0.6 : 2.2;
  }

  private enableDragging(canvas: HTMLCanvasElement) {
    canvas.style.touchAction = 'none';

    canvas.addEventListener('pointerdown', (e) => {
      const model = this.modelUnder(e);
      const ground = model && this.groundUnder(e);
      if (!model || !ground) return;
      this.drag = { model, offsetX: model.position.x - ground.x, offsetZ: model.position.z - ground.z };
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!this.drag) {
        canvas.style.cursor = this.modelUnder(e) ? 'grab' : '';
        return;
      }
      const ground = this.groundUnder(e);
      if (!ground) return;
      this.drag.model.position.x = Math.round(ground.x + this.drag.offsetX);
      this.drag.model.position.z = Math.round(ground.z + this.drag.offsetZ);
      this.render();
    });

    const release = () => {
      if (!this.drag) return;
      const { model } = this.drag;
      this.drag = undefined;
      canvas.style.cursor = 'grab';
      const { id, kind } = model.userData as { id: string; kind: Kind };
      this.onDragEnd?.(id, { x: model.position.x, y: model.position.y - lift(kind), z: model.position.z });
    };
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
  }

  private pointAt(e: PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
  }

  /** The participant under the pointer: the hit part's top-level model. */
  private modelUnder(e: PointerEvent): THREE.Object3D | undefined {
    this.pointAt(e);
    const visible = [...this.models.values()].filter((m) => m.visible);
    let hit: THREE.Object3D | null = this.raycaster.intersectObjects(visible, true)[0]?.object ?? null;
    while (hit && !hit.userData.id) hit = hit.parent;
    return hit ?? undefined;
  }

  private groundUnder(e: PointerEvent): THREE.Vector3 | null {
    this.pointAt(e);
    return this.raycaster.ray.intersectPlane(this.groundPlane, new THREE.Vector3());
  }

  private modelFor(id: string, kind: Kind): THREE.Object3D {
    let model = this.models.get(id);
    if (!model) {
      model = buildModel(kind);
      model.userData = { id, kind };
      this.models.set(id, model);
      this.scene.add(model);
    }
    return model;
  }

  /** Moves a model; during the film it also turns to face the way it is going. */
  private moveTo(model: THREE.Object3D, kind: Kind, p: Vec3, faceTravel: boolean) {
    const dx = p.x - model.position.x;
    const dz = p.z - model.position.z;
    if (faceTravel && Math.hypot(dx, dz) > 1e-6) model.rotation.y = Math.atan2(-dz, dx);
    model.position.set(p.x, p.y + lift(kind), p.z);
  }

  private resize() {
    const { clientWidth: w, clientHeight: h } = this.host;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.render();
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }
}
