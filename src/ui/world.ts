import * as THREE from 'three';
import type { Frame } from '../domain/film';
import type { Kind, Participant, Vec3 } from '../domain/participants';

const LOOK: Record<Kind, { color: number; make: () => THREE.BufferGeometry; lift: number }> = {
  tree: { color: 0x2e7d32, make: () => new THREE.ConeGeometry(0.8, 2.5, 8), lift: 1.25 },
  forest: { color: 0x1b5e20, make: () => new THREE.ConeGeometry(2.5, 3, 6), lift: 1.5 },
  mountain: { color: 0x8d8174, make: () => new THREE.ConeGeometry(4, 6, 5), lift: 3 },
  road: { color: 0x555555, make: () => new THREE.BoxGeometry(12, 0.05, 1.5), lift: 0.03 },
  lake: { color: 0x4fa3d9, make: () => new THREE.CylinderGeometry(3, 3, 0.05, 24), lift: 0.03 },
  sea: { color: 0x1e5aa8, make: () => new THREE.BoxGeometry(20, 0.05, 8), lift: 0.03 },
  river: { color: 0x5ab4e6, make: () => new THREE.BoxGeometry(1.2, 0.05, 16), lift: 0.03 },
  sun: { color: 0xffd34d, make: () => new THREE.SphereGeometry(1.5, 16, 16), lift: 15 },
  human: { color: 0xe0a070, make: () => new THREE.CapsuleGeometry(0.3, 1, 4, 8), lift: 0.8 },
  dog: { color: 0x8b5a2b, make: () => new THREE.BoxGeometry(0.9, 0.5, 0.4), lift: 0.25 },
  bird: { color: 0xe53935, make: () => new THREE.SphereGeometry(0.25, 8, 8), lift: 0.25 },
  fish: { color: 0xff9800, make: () => new THREE.SphereGeometry(0.3, 8, 6), lift: 0.1 },
  horse: { color: 0x5d4037, make: () => new THREE.BoxGeometry(1.6, 1, 0.5), lift: 0.9 },
  car: { color: 0xd32f2f, make: () => new THREE.BoxGeometry(1.8, 0.7, 1), lift: 0.35 },
  plane: { color: 0xeceff1, make: () => new THREE.BoxGeometry(2.5, 0.3, 2.5), lift: 0.15 },
  boat: { color: 0xfafafa, make: () => new THREE.BoxGeometry(1.6, 0.5, 0.7), lift: 0.25 },
  bicycle: { color: 0x1565c0, make: () => new THREE.TorusGeometry(0.35, 0.06, 6, 16), lift: 0.4 },
};

const CLEAR_SKY = new THREE.Color(0x9fd3f5);
const RAIN_SKY = new THREE.Color(0x7d8794);

/** Renders participants in a 3D space. Knows nothing about the story rules. */
export class World {
  private renderer = new THREE.WebGLRenderer({ antialias: true });
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
  private meshes = new Map<string, THREE.Mesh>();
  private raycaster = new THREE.Raycaster();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private drag?: { mesh: THREE.Mesh; offsetX: number; offsetZ: number };

  /** Called when the child lets go of a participant they dragged to a new place. */
  onDragEnd?: (id: string, position: Vec3) => void;

  constructor(private host: HTMLElement) {
    this.scene.background = CLEAR_SKY.clone();
    this.camera.position.set(14, 14, 22);
    this.camera.lookAt(0, 0, 0);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x445533, 1.2));
    const sunlight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunlight.position.set(10, 20, 5);
    this.scene.add(sunlight);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshLambertMaterial({ color: 0x9ccc65 }));
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);
    host.appendChild(this.renderer.domElement);
    new ResizeObserver(() => this.resize()).observe(host);
    this.resize();
    this.enableDragging(this.renderer.domElement);
  }

  /** Shows the storyboard as placed, before any film exists. */
  showParticipants(participants: Participant[]) {
    for (const p of participants) {
      const mesh = this.meshFor(p.id, p.kind);
      this.moveTo(mesh, p.kind, p.position);
      mesh.visible = true;
    }
    this.scene.background = CLEAR_SKY;
    this.render();
  }

  /**
   * Where a participant appears on the page, in CSS pixels, or where it would appear at
   * another spot `at` on the ground. Used to automate dragging.
   */
  screenPositionOf(id: string, at?: { x: number; z: number }): { x: number; y: number } | undefined {
    const mesh = this.meshes.get(id);
    if (!mesh) return undefined;
    const point = at ? new THREE.Vector3(at.x, mesh.position.y, at.z) : mesh.position.clone();
    const p = point.project(this.camera);
    const rect = this.renderer.domElement.getBoundingClientRect();
    return { x: rect.left + ((p.x + 1) / 2) * rect.width, y: rect.top + ((1 - p.y) / 2) * rect.height };
  }

  private enableDragging(canvas: HTMLCanvasElement) {
    canvas.style.touchAction = 'none';

    canvas.addEventListener('pointerdown', (e) => {
      const mesh = this.meshUnder(e);
      const ground = mesh && this.groundUnder(e);
      if (!mesh || !ground) return;
      this.drag = { mesh, offsetX: mesh.position.x - ground.x, offsetZ: mesh.position.z - ground.z };
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!this.drag) {
        canvas.style.cursor = this.meshUnder(e) ? 'grab' : '';
        return;
      }
      const ground = this.groundUnder(e);
      if (!ground) return;
      this.drag.mesh.position.x = Math.round(ground.x + this.drag.offsetX);
      this.drag.mesh.position.z = Math.round(ground.z + this.drag.offsetZ);
      this.render();
    });

    const release = () => {
      if (!this.drag) return;
      const { mesh } = this.drag;
      this.drag = undefined;
      canvas.style.cursor = 'grab';
      const { id, kind } = mesh.userData as { id: string; kind: Kind };
      this.onDragEnd?.(id, { x: mesh.position.x, y: mesh.position.y - LOOK[kind].lift, z: mesh.position.z });
    };
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
  }

  private pointAt(e: PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
  }

  private meshUnder(e: PointerEvent): THREE.Mesh | undefined {
    this.pointAt(e);
    const visible = [...this.meshes.values()].filter((m) => m.visible);
    return this.raycaster.intersectObjects(visible, false)[0]?.object as THREE.Mesh | undefined;
  }

  private groundUnder(e: PointerEvent): THREE.Vector3 | null {
    this.pointAt(e);
    return this.raycaster.ray.intersectPlane(this.groundPlane, new THREE.Vector3());
  }

  showFrame(frame: Frame) {
    for (const actor of frame.actors) {
      const mesh = this.meshFor(actor.id, actor.kind);
      this.moveTo(mesh, actor.kind, actor.position);
      mesh.visible = actor.visible;
    }
    this.scene.background = frame.weather === 'rain' ? RAIN_SKY : CLEAR_SKY;
    this.render();
  }

  private meshFor(id: string, kind: Kind): THREE.Mesh {
    let mesh = this.meshes.get(id);
    if (!mesh) {
      const look = LOOK[kind];
      mesh = new THREE.Mesh(look.make(), new THREE.MeshLambertMaterial({ color: look.color }));
      mesh.userData = { id, kind };
      this.meshes.set(id, mesh);
      this.scene.add(mesh);
    }
    return mesh;
  }

  private moveTo(mesh: THREE.Mesh, kind: Kind, p: { x: number; y: number; z: number }) {
    mesh.position.set(p.x, p.y + LOOK[kind].lift, p.z);
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
