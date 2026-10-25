import * as THREE from 'three';
import type { Kind } from '../domain/participants';

// Hand-built low-poly models: no downloaded assets, so the bundle stays small and licence-free.
// Every model stands on y = 0 and faces +x, its direction of travel.

const materials = new Map<string, THREE.Material>();
interface Finish { rough?: number; metal?: number; opacity?: number; side?: THREE.Side }

function mat(color: number, { rough = 0.85, metal = 0, opacity = 1, side = THREE.FrontSide }: Finish = {}): THREE.Material {
  const key = `${color}-${rough}-${metal}-${opacity}-${side}`;
  let m = materials.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color, roughness: rough, metalness: metal, flatShading: true,
      transparent: opacity < 1, opacity, side,
    });
    materials.set(key, m);
  }
  return m;
}

type Material = THREE.Material | number;
const asMat = (m: Material) => (typeof m === 'number' ? mat(m) : m);

function part(geo: THREE.BufferGeometry, m: Material, x: number, y: number, z: number, rot: [number, number, number] = [0, 0, 0]) {
  const mesh = new THREE.Mesh(geo, asMat(m));
  mesh.position.set(x, y, z);
  mesh.rotation.set(...rot);
  return mesh;
}

/** A round bar from point a to point b, e.g. a bicycle tube or a leg. */
function rod(a: [number, number, number], b: [number, number, number], r: number, m: Material) {
  const from = new THREE.Vector3(...a);
  const to = new THREE.Vector3(...b);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, from.distanceTo(to), 8), asMat(m));
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
  return mesh;
}

const group = (...children: THREE.Object3D[]) => new THREE.Group().add(...children);
const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const ball = (r: number, detail = 12) => new THREE.SphereGeometry(r, detail, Math.max(6, detail / 1.5));

const C = {
  bark: 0x6b4423, leaf: 0x3f8f3a, leafDark: 0x2f6f2c, leafLight: 0x5aa845, pine: 0x2f6e38,
  rock: 0x7b7266, rockDark: 0x5f574d, snow: 0xf4f6f8, asphalt: 0x3a3d40, paint: 0xf2f2f2,
  water: 0x3d8fd1, deepWater: 0x1d5c9e, sand: 0xe0cc95,
  skin: 0xe9b38f, hair: 0x4a2f1b, shirt: 0xd9483b, jeans: 0x34508c, shoe: 0x2b2b2b,
  dog: 0xb07a43, dogDark: 0x6e4724, black: 0x151515, white: 0xfafafa,
  horse: 0x7a4b2a, mane: 0x2e1d12,
  carRed: 0xc62828, glass: 0x9fc6dd, tyre: 0x1c1c1c, chrome: 0xc8ccd0, lamp: 0xfff3b0,
  planeBody: 0xeef1f4, planeBlue: 0x1f5fae, sail: 0xfbf8ef, boatRed: 0xb3261e, bikeBlue: 0x1565c0,
};

function tree() {
  return group(
    part(new THREE.CylinderGeometry(0.1, 0.16, 1.1, 7), C.bark, 0, 0.55, 0),
    part(new THREE.IcosahedronGeometry(0.75, 1), C.leaf, 0, 1.5, 0),
    part(new THREE.IcosahedronGeometry(0.5, 1), C.leafLight, 0.35, 1.85, 0.15),
    part(new THREE.IcosahedronGeometry(0.5, 1), C.leafDark, -0.3, 1.75, -0.2),
  );
}

function pine(scale: number) {
  const g = group(
    part(new THREE.CylinderGeometry(0.08, 0.12, 0.6, 6), C.bark, 0, 0.3, 0),
    part(new THREE.ConeGeometry(0.75, 1.1, 7), C.pine, 0, 1.0, 0),
    part(new THREE.ConeGeometry(0.58, 0.95, 7), C.pine, 0, 1.55, 0),
    part(new THREE.ConeGeometry(0.4, 0.8, 7), C.pine, 0, 2.05, 0),
  );
  g.scale.setScalar(scale);
  return g;
}

function forest() {
  const g = new THREE.Group();
  const spots: [number, number, number][] = [
    [0, 0, 1.2], [1.6, 0.6, 1], [-1.4, 0.9, 0.9], [0.7, -1.6, 1.1], [-0.9, -1.3, 0.85], [2.2, -1.1, 0.8], [-2.3, -0.3, 1],
  ];
  for (const [x, z, s] of spots) g.add(pine(s)).children.at(-1)!.position.set(x, 0, z);
  return g;
}

function mountain() {
  return group(
    part(new THREE.ConeGeometry(4, 5, 7), C.rock, 0, 2.5, 0),
    part(new THREE.ConeGeometry(2.6, 3.4, 6), C.rockDark, 2.3, 1.7, 1.2),
    part(new THREE.ConeGeometry(1.2, 1.5, 7), C.snow, 0, 4.27, 0),
    part(new THREE.ConeGeometry(0.68, 0.88, 6), C.snow, 2.3, 2.98, 1.2),
  );
}

function road() {
  const g = group(
    part(box(12, 0.04, 1.6), C.asphalt, 0, 0.02, 0),
    part(box(12, 0.012, 0.06), C.paint, 0, 0.046, 0.72),
    part(box(12, 0.012, 0.06), C.paint, 0, 0.046, -0.72),
  );
  for (let x = -5.25; x <= 5.25; x += 1.5) g.add(part(box(0.8, 0.012, 0.08), C.paint, x, 0.046, 0));
  return g;
}

const waterMat = (color: number) => mat(color, { rough: 0.15, metal: 0.1 });

function lake() {
  return group(
    part(new THREE.CylinderGeometry(3.4, 3.5, 0.03, 40), C.sand, 0, 0.015, 0),
    part(new THREE.CylinderGeometry(3, 3, 0.04, 40), waterMat(C.water), 0, 0.03, 0),
  );
}

function sea() {
  return group(
    part(box(20, 0.04, 8), waterMat(C.deepWater), 0, 0.02, 0),
    part(box(20, 0.03, 1.4), C.sand, 0, 0.015, 4.7),
  );
}

function river() {
  return group(
    part(box(2, 0.03, 16), C.sand, 0, 0.015, 0),
    part(box(1.4, 0.04, 16), waterMat(C.water), 0, 0.025, 0),
  );
}

function sun() {
  const glow = new THREE.MeshBasicMaterial({ color: 0xffd34d, toneMapped: false });
  const halo = new THREE.MeshBasicMaterial({ color: 0xfff1b8, transparent: true, opacity: 0.25 });
  return group(new THREE.Mesh(ball(1.5, 24), glow), new THREE.Mesh(ball(2.2, 24), halo));
}

function human() {
  const hairCap = new THREE.SphereGeometry(0.165, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  return group(
    part(box(0.2, 0.08, 0.12), C.shoe, 0.04, 0.04, 0.1),
    part(box(0.2, 0.08, 0.12), C.shoe, 0.04, 0.04, -0.1),
    rod([0, 0.08, 0.1], [0, 0.85, 0.1], 0.075, C.jeans),
    rod([0, 0.08, -0.1], [0, 0.85, -0.1], 0.075, C.jeans),
    part(box(0.26, 0.6, 0.44), C.shirt, 0, 1.13, 0),
    rod([0, 1.38, 0.27], [0.05, 0.85, 0.3], 0.06, C.shirt),
    rod([0, 1.38, -0.27], [0.05, 0.85, -0.3], 0.06, C.shirt),
    part(ball(0.065, 8), C.skin, 0.05, 0.8, 0.3),
    part(ball(0.065, 8), C.skin, 0.05, 0.8, -0.3),
    part(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 8), C.skin, 0, 1.47, 0),
    part(ball(0.16), C.skin, 0, 1.62, 0),
    part(hairCap, C.hair, -0.02, 1.64, 0),
    part(ball(0.022, 6), C.black, 0.15, 1.65, 0.06),
    part(ball(0.022, 6), C.black, 0.15, 1.65, -0.06),
  );
}

function dog() {
  const legs = [[0.28, 0.11], [0.28, -0.11], [-0.28, 0.11], [-0.28, -0.11]].map(([x, z]) =>
    rod([x, 0, z], [x, 0.36, z], 0.05, C.dog));
  return group(
    ...legs,
    part(box(0.8, 0.32, 0.3), C.dog, 0, 0.48, 0),
    part(box(0.3, 0.28, 0.26), C.dog, 0.5, 0.68, 0),
    part(box(0.18, 0.13, 0.16), C.dogDark, 0.7, 0.62, 0),
    part(box(0.05, 0.05, 0.07), C.black, 0.8, 0.66, 0),
    part(box(0.07, 0.16, 0.05), C.dogDark, 0.45, 0.86, 0.1, [0.3, 0, 0]),
    part(box(0.07, 0.16, 0.05), C.dogDark, 0.45, 0.86, -0.1, [-0.3, 0, 0]),
    part(ball(0.025, 6), C.black, 0.64, 0.74, 0.08),
    part(ball(0.025, 6), C.black, 0.64, 0.74, -0.08),
    rod([-0.38, 0.55, 0], [-0.6, 0.78, 0], 0.035, C.dog),
  );
}

function horse() {
  const legs = [[0.55, 0.16], [0.55, -0.16], [-0.55, 0.16], [-0.55, -0.16]].flatMap(([x, z]) => [
    rod([x, 0.08, z], [x, 1.05, z], 0.08, C.horse),
    part(box(0.16, 0.1, 0.16), C.black, x, 0.05, z),
  ]);
  return group(
    ...legs,
    part(box(1.45, 0.62, 0.5), C.horse, 0, 1.3, 0),
    rod([0.6, 1.45, 0], [0.95, 2.05, 0], 0.17, C.horse),
    part(box(0.55, 0.26, 0.26), C.horse, 1.12, 2.02, 0, [0, 0, -0.45]),
    part(box(0.12, 0.6, 0.08), C.mane, 0.72, 1.85, 0, [0, 0, -0.55]),
    part(box(0.06, 0.14, 0.06), C.horse, 0.98, 2.27, 0.07),
    part(box(0.06, 0.14, 0.06), C.horse, 0.98, 2.27, -0.07),
    part(ball(0.03, 6), C.black, 1.12, 2.1, 0.13),
    part(ball(0.03, 6), C.black, 1.12, 2.1, -0.13),
    rod([-0.72, 1.48, 0], [-0.95, 0.8, 0], 0.07, C.mane),
  );
}

function bird() {
  return group(
    part(ball(0.15).scale(1.4, 1, 1), C.carRed, 0, 0.22, 0),
    part(ball(0.09), C.carRed, 0.18, 0.32, 0),
    part(new THREE.ConeGeometry(0.03, 0.1, 6), 0xf2a33a, 0.3, 0.31, 0, [0, 0, -Math.PI / 2]),
    part(box(0.2, 0.02, 0.26), 0x8e1b1b, -0.02, 0.27, 0.17, [0.35, 0, 0]),
    part(box(0.2, 0.02, 0.26), 0x8e1b1b, -0.02, 0.27, -0.17, [-0.35, 0, 0]),
    part(box(0.16, 0.02, 0.1), 0x8e1b1b, -0.24, 0.24, 0, [0, 0, 0.3]),
    part(ball(0.018, 6), C.black, 0.24, 0.35, 0.055),
    part(ball(0.018, 6), C.black, 0.24, 0.35, -0.055),
    rod([0.02, 0.1, 0.04], [0.02, 0, 0.04], 0.01, 0xf2a33a),
    rod([0.02, 0.1, -0.04], [0.02, 0, -0.04], 0.01, 0xf2a33a),
  );
}

function fish() {
  return group(
    part(ball(0.18).scale(1.6, 1, 0.5), 0xff8f1f, 0, 0.2, 0),
    part(new THREE.ConeGeometry(0.14, 0.22, 4).scale(1, 1, 0.25), 0xf0701a, -0.36, 0.2, 0, [0, 0, -Math.PI / 2]),
    part(new THREE.ConeGeometry(0.06, 0.14, 4).scale(1, 1, 0.3), 0xf0701a, -0.02, 0.38, 0),
    part(ball(0.025, 6), C.black, 0.2, 0.24, 0.07),
    part(ball(0.025, 6), C.black, 0.2, 0.24, -0.07),
  );
}

function car() {
  const wheels = [[0.58, 0.45], [0.58, -0.45], [-0.58, 0.45], [-0.58, -0.45]].flatMap(([x, z]) => [
    part(new THREE.CylinderGeometry(0.22, 0.22, 0.16, 16), C.tyre, x, 0.22, z, [Math.PI / 2, 0, 0]),
    part(new THREE.CylinderGeometry(0.11, 0.11, 0.17, 10), C.chrome, x, 0.22, z, [Math.PI / 2, 0, 0]),
  ]);
  const paint = mat(C.carRed, { rough: 0.35, metal: 0.3 });
  return group(
    ...wheels,
    part(box(1.9, 0.42, 0.88), paint, 0, 0.45, 0),
    part(box(1.0, 0.36, 0.8), mat(C.glass, { rough: 0.1, metal: 0.2 }), -0.12, 0.83, 0),
    part(box(1.04, 0.05, 0.84), paint, -0.12, 1.03, 0),
    part(box(0.04, 0.1, 0.2), C.lamp, 0.96, 0.52, 0.28),
    part(box(0.04, 0.1, 0.2), C.lamp, 0.96, 0.52, -0.28),
    part(box(0.04, 0.08, 0.18), 0x7a0d0d, -0.96, 0.52, 0.3),
    part(box(0.04, 0.08, 0.18), 0x7a0d0d, -0.96, 0.52, -0.3),
    part(box(0.06, 0.08, 0.86), C.chrome, 0.96, 0.3, 0),
  );
}

function plane() {
  const body = mat(C.planeBody, { rough: 0.4, metal: 0.3 });
  return group(
    part(new THREE.CylinderGeometry(0.27, 0.2, 3, 14), body, 0, 0.8, 0, [0, 0, Math.PI / 2]),
    part(new THREE.ConeGeometry(0.27, 0.45, 14), body, 1.72, 0.8, 0, [0, 0, -Math.PI / 2]),
    part(box(3.0, 0.04, 0.06), C.planeBlue, 0, 0.8, 0.27),
    part(box(3.0, 0.04, 0.06), C.planeBlue, 0, 0.8, -0.27),
    part(box(0.75, 0.07, 3.4), body, 0.15, 0.75, 0),
    part(box(0.45, 0.65, 0.05), C.planeBlue, -1.3, 1.2, 0, [0, 0, 0.3]),
    part(box(0.4, 0.05, 1.1), body, -1.35, 0.85, 0),
    part(box(0.38, 0.14, 0.4), mat(C.glass, { rough: 0.1 }), 0.95, 1.02, 0),
    part(box(0.04, 0.75, 0.1), C.black, 1.97, 0.8, 0),
    rod([0.5, 0.6, 0.35], [0.5, 0.15, 0.4], 0.03, C.chrome),
    rod([0.5, 0.6, -0.35], [0.5, 0.15, -0.4], 0.03, C.chrome),
    part(new THREE.CylinderGeometry(0.13, 0.13, 0.08, 12), C.tyre, 0.5, 0.13, 0.42, [Math.PI / 2, 0, 0]),
    part(new THREE.CylinderGeometry(0.13, 0.13, 0.08, 12), C.tyre, 0.5, 0.13, -0.42, [Math.PI / 2, 0, 0]),
    part(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 10), C.tyre, -1.3, 0.35, 0, [Math.PI / 2, 0, 0]),
  );
}

function boat() {
  const sail = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0, 1.25), new THREE.Vector2(-0.75, 0)]);
  return group(
    part(box(1.3, 0.36, 0.64), C.white, -0.15, 0.2, 0),
    part(new THREE.CylinderGeometry(0.37, 0.37, 0.36, 3), C.white, 0.68, 0.2, 0, [0, Math.PI / 2, 0]),
    part(box(1.32, 0.07, 0.66), C.boatRed, -0.15, 0.08, 0),
    part(box(0.5, 0.3, 0.46), C.white, -0.35, 0.53, 0),
    part(box(0.02, 0.12, 0.3), mat(C.glass, { rough: 0.1 }), -0.09, 0.56, 0),
    rod([0.15, 0.38, 0], [0.15, 1.75, 0], 0.025, C.bark),
    part(new THREE.ShapeGeometry(sail), mat(C.sail, { side: THREE.DoubleSide }), 0.13, 0.45, 0),
  );
}

function bicycle() {
  const rear: [number, number, number] = [-0.42, 0.33, 0];
  const front: [number, number, number] = [0.42, 0.33, 0];
  const crank: [number, number, number] = [-0.04, 0.3, 0];
  const seat: [number, number, number] = [-0.16, 0.78, 0];
  const head: [number, number, number] = [0.3, 0.8, 0];
  const frame = mat(C.bikeBlue, { rough: 0.4, metal: 0.4 });
  return group(
    part(new THREE.TorusGeometry(0.3, 0.03, 8, 24), C.tyre, ...rear),
    part(new THREE.TorusGeometry(0.3, 0.03, 8, 24), C.tyre, ...front),
    rod(rear, crank, 0.018, frame),
    rod(rear, seat, 0.018, frame),
    rod(crank, seat, 0.022, frame),
    rod(seat, head, 0.022, frame),
    rod(crank, head, 0.024, frame),
    rod(head, front, 0.02, C.chrome),
    rod([0.3, 0.8, 0], [0.28, 0.92, 0], 0.02, C.chrome),
    rod([0.28, 0.92, 0.22], [0.28, 0.92, -0.22], 0.016, C.chrome),
    part(box(0.2, 0.05, 0.1), C.black, -0.18, 0.84, 0),
    part(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 10), C.chrome, ...crank, [Math.PI / 2, 0, 0]),
  );
}

const BUILDERS: Record<Kind, () => THREE.Object3D> = {
  tree, forest, mountain, road, lake, sea, river, sun, human, dog, bird, fish, horse, car, plane, boat, bicycle,
};

/** Ground-level things that should not throw shadows onto the grass. */
const FLAT: ReadonlySet<Kind> = new Set(['road', 'lake', 'sea', 'river', 'sun']);

/** How high above its storyboard position a model is drawn. Only the sun floats. */
export const LIFT: Partial<Record<Kind, number>> = { sun: 9 };

export function buildModel(kind: Kind): THREE.Object3D {
  const model = BUILDERS[kind]();
  model.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = !FLAT.has(kind);
      o.receiveShadow = kind !== 'sun';
    }
  });
  return model;
}
