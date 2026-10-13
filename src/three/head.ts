import {
  BufferGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { darken, lighten, rosy } from "@/data/character";
import { Kit, rad, tube, Z_AXIS } from "@/three/kit";

// Crânio e rosto, no estilo de personagem de render 3D: cabeça redonda com
// bochechas cheias, olhos grandes e brilhantes, nariz de botão e sorriso
// pequeno. Tudo vive no grupo kit.head, em coordenadas do modelo "sem reduzir":
// o grupo é encolhido em torno do pescoço (HEAD_SCALE) pra acertar a proporção
// com o corpo. O cabelo fica em hair.ts, os acessórios em accessories.ts.

export const HEAD_C = new Vector3(0, 1.5, 0);
export const HEAD_R = new Vector3(0.345, 0.315, 0.335);
// Cabeça com ~1/6,5 da altura (a de um desenho teria 1/3): é o que mais pesa pra o
// boneco parecer gente e não brinquedo.
export const HEAD_SCALE = 0.44;
// Altura do queixo no mundo; a cabeça é posicionada pra o queixo cair aqui.
export const CHIN_Y = 1.54;
const CHIN_LOCAL_Y = HEAD_C.y - HEAD_R.y * 1.05;
export const HEAD_OFFSET_Y = CHIN_Y - HEAD_SCALE * CHIN_LOCAL_Y;

// Forma da cabeça: uma esfera moldada — bochechas cheias logo abaixo do meio,
// queixo pequeno e arredondado, alto levemente afunilado. Recebe um ponto da
// esfera unitária.
export function headMap(u: Vector3): Vector3 {
  const y = u.y;
  const below = Math.max(0, -y);
  const jaw = 1 - 0.1 * Math.pow(below, 2);
  const cheeks = 1 + 0.075 * Math.exp(-Math.pow((y + 0.3) / 0.32, 2));
  const crown = 1 - 0.05 * Math.pow(Math.max(0, y), 2);
  const sx = jaw * cheeks * crown;
  const sz = 1 - 0.05 * Math.pow(below, 2);
  return new Vector3(u.x * HEAD_R.x * sx, y * HEAD_R.y * (y < 0 ? 1.05 : 1), u.z * HEAD_R.z * sz);
}

const dirOf = (theta: number, phi: number) =>
  new Vector3(Math.sin(theta) * Math.cos(phi), Math.sin(phi), Math.cos(theta) * Math.cos(phi));

// Ponto na superfície da cabeça a (theta) radianos pro lado e (phi) pra cima,
// mais o vetor normal ali. lift afasta o ponto pra fora da superfície.
export function surface(theta: number, phi: number, lift = 0) {
  const e = 1e-3;
  const at = (t: number, p: number) => headMap(dirOf(t, p));
  const pos = at(theta, phi);
  const dTheta = at(theta + e, phi).sub(at(theta - e, phi));
  const dPhi = at(theta, phi + e).sub(at(theta, phi - e));
  const normal = new Vector3().crossVectors(dTheta, dPhi).normalize();
  if (normal.dot(dirOf(theta, phi)) < 0) normal.negate();
  return { pos: pos.add(normal.clone().multiplyScalar(lift)).add(HEAD_C), normal };
}

// Cola o objeto na cabeça, com o +z dele apontando pra fora da superfície.
function stick(object: Object3D, theta: number, phi: number, lift = 0, roll = 0): Object3D {
  const { pos, normal } = surface(theta, phi, lift);
  object.position.copy(pos);
  object.quaternion.setFromUnitVectors(Z_AXIS, normal);
  if (roll) object.rotateZ(roll);
  return object;
}

export function stuck(kit: Kit, theta: number, phi: number, lift = 0, roll = 0): Group {
  const group = new Group();
  stick(group, theta, phi, lift, roll);
  kit.head.add(group);
  return group;
}

// Pontos da superfície ao longo de uma linha (theta, phi em graus).
function surfacePath(points: [number, number][], lift: number): Vector3[] {
  return points.map(([theta, phi]) => surface(rad(theta), rad(Math.min(phi, 84)), lift).pos);
}

export interface FaceColors {
  skin: string;
  iris: string;
  brow: string;
}

export function buildHead(kit: Kit, colors: FaceColors, mood: string) {
  // Crânio: esfera moldada pelo headMap (as normais saem da malha já unida,
  // senão aparece uma emenda de sombra na costura).
  const sphere = new SphereGeometry(1, 72, 56);
  sphere.deleteAttribute("uv");
  sphere.deleteAttribute("normal");
  const skull = mergeVertices(sphere, 1e-4);
  const position = skull.getAttribute("position");
  const v = new Vector3();
  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i).normalize();
    const p = headMap(v);
    position.setXYZ(i, p.x + HEAD_C.x, p.y + HEAD_C.y, p.z + HEAD_C.z);
  }
  skull.computeVertexNormals();
  const skin = kit.skin(colors.skin);
  kit.mesh(kit.head, skull, skin);

  // Pescoço (fora do grupo da cabeça, que encolhe): do ombro ao queixo.
  kit.mesh(kit.root, new CylinderGeometry(0.05, 0.06, 0.2, 28), kit.skin(darken(colors.skin, 0.08)), 0, 1.47, 0);

  // Orelhas
  for (const side of [-1, 1]) {
    const ear = stuck(kit, side * rad(89), rad(-7), 0.002);
    const outer = kit.mesh(ear, new SphereGeometry(1, 20, 16), skin);
    outer.scale.set(0.022, 0.056, 0.045);
    outer.position.x = side * 0.007;
    const inner = kit.mesh(ear, new SphereGeometry(1, 16, 12), kit.skin(darken(colors.skin, 0.18)));
    inner.scale.set(0.01, 0.033, 0.026);
    inner.position.set(side * 0.022, 0, 0.002);
  }

  buildNose(kit, colors.skin);

  // Sombras de oclusão fingidas: dão profundidade sem custo (em volta dos
  // olhos, sob o lábio, e a sombra do queixo no pescoço).
  const shadow = darken(colors.skin, 0.55);
  for (const side of [-1, 1]) {
    kit.mesh(stuck(kit, side * rad(25.5), rad(-5), 0.0015), new CircleGeometry(0.13, 32), kit.soft(shadow, 0.11));
  }
  kit.mesh(stuck(kit, 0, rad(-40), 0.002), new CircleGeometry(0.04, 24), kit.soft(shadow, 0.18));
  const neckShadow = kit.mesh(kit.root, new CircleGeometry(0.07, 32), kit.soft("#000000", 0.3), 0, 1.49, 0.048);
  neckShadow.scale.set(1.1, 0.9, 1);

  // Bochechas coradas
  const blush = rosy(colors.skin, 0.7);
  for (const side of [-1, 1]) {
    const cheek = stuck(kit, side * rad(35), rad(-17), 0.002);
    kit.mesh(cheek, new CircleGeometry(0.09, 32), kit.soft(blush, 0.5));
  }

  // Sobrancelhas: finas e arqueadas, seguem a curva do rosto.
  const browMaterial = kit.std(colors.brow, 0.85);
  for (const side of [-1, 1]) {
    const points: [number, number][] = [];
    for (let i = 0; i <= 5; i++) {
      const t = i / 5;
      points.push([side * (12 + 28 * t), 15.2 + 3.6 * Math.sin(Math.PI * t * 0.9) - 1.4 * t * t]);
    }
    kit.mesh(kit.head, tube(surfacePath(points, 0.004), (t) => 0.0078 * (1 - t) + 0.003 * t, 0, 1, 8, 18), browMaterial);
  }

  const closedRight = mood === "md-wink";
  const laugh = mood === "md-laugh";
  for (const side of [-1, 1] as const) {
    if (laugh || (closedRight && side === 1)) closedEye(kit, side);
    else openEye(kit, side, colors, mood === "md-cool");
  }
  buildMouth(kit, colors.skin, mood);
}

function buildNose(kit: Kit, skinColor: string) {
  const skin = kit.skin(lighten(skinColor, 0.02));
  // Nariz de botão: ponta e asas pequenas, bem sobrepostas (mesmo material);
  // é a luz que separa as partes.
  const tip = kit.mesh(stuck(kit, 0, rad(-14.5), 0.009), new SphereGeometry(1, 24, 18), skin);
  tip.scale.set(0.022, 0.018, 0.021);
  for (const side of [-1, 1]) {
    const wing = kit.mesh(stuck(kit, side * rad(2), rad(-15), 0.001), new SphereGeometry(1, 16, 12), skin);
    wing.scale.set(0.011, 0.009, 0.011);
  }
  // sombrinha logo abaixo da ponta
  kit.mesh(stuck(kit, 0, rad(-17.6), 0.003), new CircleGeometry(0.02, 24), kit.soft(darken(skinColor, 0.5), 0.3));
}

// ---- Olhos ----
// Globo ocular de verdade (esfera branca), íris com degradê, reflexos, vidro da
// córnea e duas pálpebras de pele (calotas de esfera) que formam a abertura em
// amêndoa. O globo fica enterrado na cabeça e só uma fatia aparece.
const EYE_R = 0.079;
const EYE_OUT = 0.02;
const LID_R = EYE_R * 1.075;

function irisGeometry(radius: number, maxAngle: number, iris: string): BufferGeometry {
  const geometry = new SphereGeometry(radius, 56, 22, 0, Math.PI * 2, 0, maxAngle);
  geometry.deleteAttribute("uv");
  const position = geometry.getAttribute("position");
  const base = new Color(iris);
  const inner = new Color(lighten(iris, 0.5));
  const rim = new Color(darken(iris, 0.62));
  const pupil = new Color("#0A0708");
  const c = new Color();
  const colors: number[] = [];
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const q = Math.acos(Math.min(1, y / radius)) / maxAngle; // 0 centro, 1 borda
    if (q < 0.36) c.copy(pupil);
    else if (q < 0.44) c.copy(pupil).lerp(inner, (q - 0.36) / 0.08);
    else if (q < 0.72) c.copy(inner).lerp(base, (q - 0.44) / 0.28);
    else c.copy(base).lerp(rim, Math.pow((q - 0.72) / 0.28, 1.4));
    if (q > 0.44) c.multiplyScalar(1 + 0.12 * Math.sin(Math.atan2(z, x) * 26));
    colors.push(c.r, c.g, c.b);
  }
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.rotateX(Math.PI / 2); // polo +Y -> +Z (a íris olha pra frente)
  return geometry;
}

// Calota de pele em volta do globo. `upward` = pálpebra de cima; o eixo da
// calota é inclinado pra frente (tilt), o que faz a borda da pálpebra aparecer
// curva vista de frente.
function lidGeometry(angle: number, tilt: number, upward: boolean): BufferGeometry {
  const geometry = new SphereGeometry(LID_R, 48, 24, 0, Math.PI * 2, 0, angle);
  geometry.deleteAttribute("uv");
  if (!upward) geometry.rotateX(Math.PI);
  geometry.rotateX(upward ? tilt : -tilt);
  return geometry;
}

// Anel fino na borda da pálpebra (cílios em cima, linha suave embaixo).
function lidEdge(kit: Kit, eye: Group, angle: number, tilt: number, upward: boolean, thickness: number, material: MeshStandardMaterial) {
  const ring = new Group();
  const axis = new Vector3(0, upward ? Math.cos(tilt) : -Math.cos(tilt), Math.sin(tilt));
  ring.quaternion.setFromUnitVectors(Z_AXIS, axis);
  ring.position.copy(axis).multiplyScalar(LID_R * Math.cos(angle));
  kit.mesh(ring, new TorusGeometry(LID_R * Math.sin(angle), thickness, 8, 72), material);
  eye.add(ring);
}

function placeOnSphere(kit: Kit, eye: Group, dir: Vector3, radius: number, size: number, opacity = 1) {
  const disc = kit.mesh(eye, new CircleGeometry(size, 24), kit.decal("#FFFFFF", opacity));
  const d = dir.clone().normalize();
  disc.position.copy(d).multiplyScalar(EYE_R * 1.012);
  disc.quaternion.setFromUnitVectors(Z_AXIS, d);
  disc.scale.setScalar(radius);
}

function openEye(kit: Kit, side: -1 | 1, colors: FaceColors, halfLid: boolean) {
  const rig = stuck(kit, side * rad(25.5), rad(-5), 0, side * rad(4));
  const eye = new Group();
  eye.position.z = EYE_OUT - EYE_R;
  rig.add(eye);

  kit.mesh(eye, new SphereGeometry(EYE_R, 40, 30), kit.std("#F5F0EC", 0.2));
  const irisMaterial = kit.track(new MeshStandardMaterial({ vertexColors: true, roughness: 0.28, metalness: 0 }));
  kit.mesh(eye, irisGeometry(EYE_R * 1.004, rad(28), colors.iris), irisMaterial);

  // Reflexos: um grande no alto (de onde vem a luz) e um pequeno embaixo.
  placeOnSphere(kit, eye, new Vector3(-0.2, 0.22, 0.95), 1, 0.0125);
  placeOnSphere(kit, eye, new Vector3(0.2, -0.22, 0.95), 1, 0.0058, 0.85);

  // Vidro da córnea: reflexo discreto das luzes por cima de tudo, dá o brilho molhado.
  const cornea = kit.mesh(
    eye,
    new SphereGeometry(EYE_R * 1.02, 40, 30),
    kit.track(new MeshPhysicalMaterial({ color: "#FFFFFF", roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, transparent: true, opacity: 0.1, depthWrite: false })),
  );
  cornea.renderOrder = 2;

  // Pálpebras: a de cima cobre um pedaço do topo da íris, a de baixo encosta embaixo.
  const upperAngle = rad(halfLid ? 54 : 44);
  const upperTilt = rad(18);
  const lowerAngle = rad(47);
  const lowerTilt = rad(10);
  const lidMaterial = kit.skin(colors.skin);
  kit.mesh(eye, lidGeometry(upperAngle, upperTilt, true), lidMaterial);
  kit.mesh(eye, lidGeometry(lowerAngle, lowerTilt, false), lidMaterial);
  lidEdge(kit, eye, upperAngle, upperTilt, true, 0.0042, kit.std("#1B1316", 0.6));
  lidEdge(kit, eye, lowerAngle, lowerTilt, false, 0.0016, kit.std(darken(colors.skin, 0.2), 0.8));
}

// Olho fechado (sorriso de olhos): uma linha curva escura sobre a pele.
function closedEye(kit: Kit, side: -1 | 1) {
  const points: [number, number][] = [];
  for (let i = 0; i <= 8; i++) {
    const u = (i / 8) * 2 - 1;
    points.push([side * 25.5 + u * 9.5, -4 + 4.2 * (1 - u * u)]);
  }
  kit.mesh(kit.head, tube(surfacePath(points, 0.005), (t) => 0.0062 * (1 - 0.55 * Math.pow(2 * t - 1, 2)), 0, 1, 8, 24), kit.std("#1B1316", 0.6));
}

// ---- Boca ----
// Caminho da boca: theta de -max a +max, com os cantos subindo (sorriso).
function mouthLine(max: number, phi0: number, corner: number, asym = 0): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i <= 6; i++) {
    const u = (i / 6) * 2 - 1;
    points.push([u * max, phi0 + corner * u * u + asym * u]);
  }
  return points;
}

function buildMouth(kit: Kit, skin: string, mood: string) {
  const lip = rosy(skin, 0.5);
  const smirk = mood === "md-cool";
  const corner = mood === "md-laugh" ? 5 : smirk ? 1.6 : mood === "md-wink" ? 4.4 : 3.6;
  const asym = smirk ? 2.6 : 0;
  const phi0 = -31;

  if (mood === "md-laugh") {
    // boca aberta: fundo escuro, língua e dentes de cima
    const mouth = stuck(kit, 0, rad(phi0 + 1), 0.004);
    const open = kit.mesh(mouth, new CircleGeometry(0.05, 32, Math.PI, Math.PI), kit.decal("#4A1219"));
    open.position.y = 0.012;
    const tongue = kit.mesh(mouth, new CircleGeometry(0.028, 24, Math.PI, Math.PI), kit.decal("#D9646F"));
    tongue.position.set(0, -0.028, 0.0004);
    const teeth = kit.mesh(mouth, new CircleGeometry(0.045, 24, Math.PI * 1.07, Math.PI * 0.86), kit.decal("#F8F4F0"));
    teeth.scale.set(1, 0.32, 1);
    teeth.position.set(0, 0.011, 0.0006);
  }

  // lábio de cima, de baixo e a linha entre eles
  const upper = mouthLine(8, phi0 + 1.5, corner * 0.7, asym * 0.6);
  const lower = mouthLine(6.6, phi0 - 1.7, corner * 0.4, asym * 0.4);
  const lineWidth = mood === "md-laugh" ? 0.0036 : 0.0042;
  kit.mesh(kit.head, tube(surfacePath(mouthLine(9.6, phi0, corner, asym), 0.004), (t) => lineWidth * (1 - 0.5 * Math.pow(2 * t - 1, 2)), 0, 1, 8, 20), kit.std(darken(lip, 0.42), 0.6));
  kit.mesh(kit.head, tube(surfacePath(upper, 0.0045), (t) => 0.0028 + 0.0058 * Math.sin(Math.PI * t), 0, 1, 8, 18), kit.std(lip, 0.5));
  kit.mesh(kit.head, tube(surfacePath(lower, 0.0045), (t) => 0.0028 + 0.0082 * Math.sin(Math.PI * t), 0, 1, 8, 18), kit.std(lighten(lip, 0.05), 0.42));
  // brilho do lábio de baixo
  kit.mesh(stuck(kit, 0, rad(phi0 - 2.4), 0.0105), new CircleGeometry(0.012, 16), kit.soft("#FFFFFF", 0.34));
}
