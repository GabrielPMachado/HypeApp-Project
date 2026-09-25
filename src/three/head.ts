import { CircleGeometry, DoubleSide, Group, Material, MeshPhysicalMaterial, Object3D, RingGeometry, SphereGeometry, TorusGeometry, Vector3 } from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { darken, lighten, rosy } from "@/data/character";
import { Kit, rad, seeded, tube, Z_AXIS } from "@/three/kit";

// Cabeça, rosto e cabelo. Tudo aqui vive no grupo kit.head, em coordenadas do
// modelo "sem reduzir": o grupo é encolhido em torno do pescoço (HEAD_SCALE)
// pra acertar a proporção com o corpo.

export const HEAD_C = new Vector3(0, 1.5, 0);
export const HEAD_R = new Vector3(0.335, 0.31, 0.325);
export const NECK_TOP = 1.22;
export const HEAD_SCALE = 0.9;

// Forma da cabeça: uma esfera achatada e depois moldada — maxilar mais
// estreito com queixo pequeno, bochechas cheias logo abaixo do meio e o alto
// levemente afunilado. Recebe um ponto da esfera unitária.
function headMap(u: Vector3): Vector3 {
  const y = u.y;
  const below = Math.max(0, -y);
  const jaw = 1 - 0.13 * Math.pow(below, 2);
  const cheeks = 1 + 0.06 * Math.exp(-Math.pow((y + 0.35) / 0.3, 2));
  const crown = 1 - 0.06 * Math.pow(Math.max(0, y), 2);
  const sx = jaw * cheeks * crown;
  const sz = 1 - 0.06 * Math.pow(below, 2);
  return new Vector3(u.x * HEAD_R.x * sx, y * HEAD_R.y * (y < 0 ? 1.04 : 1), u.z * HEAD_R.z * sz);
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

  // Pescoço (fora do grupo da cabeça, que encolhe)
  kit.mesh(kit.root, new SphereGeometry(1, 24, 16), kit.skin(darken(colors.skin, 0.1)), 0, 1.16, 0).scale.set(0.08, 0.12, 0.078);

  // Orelhas
  for (const side of [-1, 1]) {
    const ear = stuck(kit, side * rad(89), rad(-6), 0.002);
    const outer = kit.mesh(ear, new SphereGeometry(1, 20, 16), skin);
    outer.scale.set(0.02, 0.05, 0.04);
    outer.position.x = side * 0.006;
    const inner = kit.mesh(ear, new SphereGeometry(1, 16, 12), kit.skin(darken(colors.skin, 0.18)));
    inner.scale.set(0.009, 0.03, 0.024);
    inner.position.set(side * 0.02, 0, 0.002);
  }

  buildNose(kit, colors.skin);

  // Bochechas coradas
  const blush = rosy(colors.skin, 0.62);
  for (const side of [-1, 1]) {
    const cheek = stuck(kit, side * rad(36), rad(-15), 0.002);
    kit.mesh(cheek, new CircleGeometry(0.075, 32), kit.soft(blush, 0.4));
  }

  // Sobrancelhas: seguem a curva do rosto, mais grossas perto do nariz.
  const browMaterial = kit.std(colors.brow, 0.85);
  for (const side of [-1, 1]) {
    const points: [number, number][] = [];
    for (let i = 0; i <= 5; i++) {
      const t = i / 5;
      points.push([side * (9 + 30 * t), 12.6 + 3.4 * Math.sin(Math.PI * t * 0.85) - 1.4 * t * t]);
    }
    kit.mesh(kit.head, tube(surfacePath(points, 0.004), (t) => 0.0105 * (1 - t) + 0.004 * t, 0, 1, 8, 18), browMaterial);
  }

  const winkRight = mood === "md-wink";
  const laugh = mood === "md-laugh";
  for (const side of [-1, 1] as const) {
    if (laugh || (winkRight && side === 1)) closedEye(kit, side);
    else openEye(kit, side, colors, mood === "md-cool" ? 0.024 : 0.031);
  }
  buildMouth(kit, colors.skin, mood);
}

function buildNose(kit: Kit, skinColor: string) {
  const skin = kit.skin(lighten(skinColor, 0.02));
  // ponta e asas bem sobrepostas (mesmo material) fundem num nariz só; a luz
  // é que separa as partes.
  const tip = kit.mesh(stuck(kit, 0, rad(-12.5), 0.01), new SphereGeometry(1, 24, 18), skin);
  tip.scale.set(0.024, 0.02, 0.024);
  for (const side of [-1, 1]) {
    const wing = kit.mesh(stuck(kit, side * rad(3.6), rad(-13.4), 0.002), new SphereGeometry(1, 16, 12), skin);
    wing.scale.set(0.015, 0.013, 0.015);
  }
  const bridge = kit.mesh(stuck(kit, 0, rad(-7.5), 0.003), new SphereGeometry(1, 20, 16), skin);
  bridge.scale.set(0.013, 0.032, 0.011);
  // sombrinha logo abaixo da ponta
  kit.mesh(stuck(kit, 0, rad(-16.2), 0.003), new CircleGeometry(0.022, 24), kit.soft(darken(skinColor, 0.5), 0.34));
}

function openEye(kit: Kit, side: -1 | 1, colors: FaceColors, lidInner: number) {
  const eye = stuck(kit, side * rad(24), rad(-4), 0);
  const sclera = kit.mesh(eye, new SphereGeometry(1, 32, 24), kit.std("#EFEAE6", 0.35));
  sclera.scale.set(0.054, 0.044, 0.011);
  sclera.position.z = -0.001;

  const iris = colors.iris;
  const disc = (radius: number, color: string, z: number, opacity = 1, x = 0, y = 0) => {
    const mesh = kit.mesh(eye, new CircleGeometry(radius, 40), kit.decal(color, opacity));
    mesh.position.set(x, y, z);
    return mesh;
  };
  const front = 0.0104;
  disc(0.0365, darken(iris, 0.6), front);
  disc(0.032, iris, front + 0.0004);
  disc(0.021, lighten(iris, 0.35), front + 0.0008, 0.5, 0, -0.008);
  disc(0.0155, "#0F0C0F", front + 0.0012);
  disc(0.0095, "#FFFFFF", front + 0.0016, 1, 0.012, 0.013);
  disc(0.0042, "#FFFFFF", front + 0.0016, 0.85, -0.011, -0.012);

  // Pálpebra superior: um anel de pele em volta do olho que cobre um pedacinho
  // do topo da íris; os cantos ficam abertos (aparece o branco do olho).
  const lid = kit.mesh(eye, new RingGeometry(lidInner, 0.058, 40, 1, rad(28), rad(124)), kit.skinLayer(colors.skin));
  lid.position.set(0, -0.002, front + 0.0022);
  // Cílios: linha escura fina na borda da pálpebra, e uma linha suave embaixo.
  const lash = kit.mesh(eye, new TorusGeometry(lidInner + 0.002, 0.0046, 8, 32, rad(140)), kit.std("#1F1519", 0.6));
  lash.rotation.z = rad(90 - 70);
  lash.position.set(0, -0.002, front + 0.003);
  const under = kit.mesh(eye, new TorusGeometry(0.04, 0.002, 6, 24, rad(110)), kit.std(darken(colors.skin, 0.28), 0.8));
  under.rotation.z = rad(-90 - 55);
  under.position.set(0, -0.002, front + 0.002);

  // Vidro da córnea: um reflexo discreto das luzes sobre o olho
  const cornea = kit.mesh(eye, new SphereGeometry(1, 28, 20), kit.gloss("#FFFFFF", 0.05, 1));
  cornea.scale.set(0.04, 0.04, 0.014);
  cornea.position.z = 0.0075;
  const material = cornea.material as MeshPhysicalMaterial;
  material.transparent = true;
  material.opacity = 0.08;
  material.depthWrite = false;
}

function closedEye(kit: Kit, side: -1 | 1) {
  const eye = stuck(kit, side * rad(24), rad(-4), 0.004);
  const arc = kit.mesh(eye, new TorusGeometry(0.044, 0.006, 8, 24, rad(140)), kit.std("#1F1519", 0.6));
  arc.rotation.z = rad(90 - 70);
  arc.position.y = -0.012;
}

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
  const lip = rosy(skin, 0.68);
  const smirk = mood === "md-cool";
  const corner = mood === "md-laugh" ? 4.5 : smirk ? 1.4 : mood === "md-wink" ? 4 : 3.2;
  const asym = smirk ? 2.4 : 0;
  const phi0 = -29;

  if (mood === "md-laugh") {
    // boca aberta: fundo escuro, língua e dentes de cima
    const mouth = stuck(kit, 0, rad(phi0 + 1), 0.004);
    const open = kit.mesh(mouth, new CircleGeometry(0.058, 32, Math.PI, Math.PI), kit.decal("#4A1219"));
    open.position.y = 0.012;
    const tongue = kit.mesh(mouth, new CircleGeometry(0.032, 24, Math.PI, Math.PI), kit.decal("#D9646F"));
    tongue.position.set(0, -0.032, 0.0004);
    const teeth = kit.mesh(mouth, new CircleGeometry(0.052, 24, Math.PI * 1.07, Math.PI * 0.86), kit.decal("#F8F4F0"));
    teeth.scale.set(1, 0.32, 1);
    teeth.position.set(0, 0.012, 0.0006);
  }

  // lábio de cima, de baixo e a linha entre eles
  const upper: [number, number][] = mouthLine(12.5, phi0 + 1.7, corner * 0.7, asym * 0.6).map(([t, p], i) => [t, p - 1.2 * Math.abs(i - 3) * 0.28]);
  const lower: [number, number][] = mouthLine(10, phi0 - 1.9, corner * 0.4, asym * 0.4);
  const lineWidth = mood === "md-laugh" ? 0.0038 : 0.0045;
  kit.mesh(kit.head, tube(surfacePath(mouthLine(15, phi0, corner, asym), 0.004), (t) => lineWidth * (1 - 0.5 * Math.pow(2 * t - 1, 2)), 0, 1, 8, 20), kit.std(darken(lip, 0.42), 0.6));
  kit.mesh(kit.head, tube(surfacePath(upper, 0.0045), (t) => 0.003 + 0.0068 * Math.sin(Math.PI * t), 0, 1, 8, 18), kit.std(lip, 0.5));
  kit.mesh(kit.head, tube(surfacePath(lower, 0.0045), (t) => 0.003 + 0.0098 * Math.sin(Math.PI * t), 0, 1, 8, 18), kit.std(lighten(lip, 0.05), 0.42));
  // brilho do lábio de baixo
  kit.mesh(stuck(kit, 0, rad(phi0 - 2.6), 0.0115), new CircleGeometry(0.014, 16), kit.soft("#FFFFFF", 0.32));
}

// ---- Cabelo ----
export const NATURAL_HAIR = ["hc-black", "hc-brown", "hc-blond", "hc-red", "hc-gray"];

// Casco do cabelo: uma calota moldada pela mesma forma do crânio, inclinada
// pra trás pra linha do cabelo ficar mais alta na testa do que na nuca. Serve
// de fundo escuro pras mechas por cima.
function hairShell(kit: Kit, material: Material, thetaLen = 1.62, tilt = -0.66, grow = 1.05): void {
  const cap = new SphereGeometry(1, 56, 36, 0, Math.PI * 2, 0, thetaLen);
  cap.deleteAttribute("uv");
  cap.deleteAttribute("normal");
  cap.rotateX(tilt);
  const shell = mergeVertices(cap, 1e-4);
  const position = shell.getAttribute("position");
  const v = new Vector3();
  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i).normalize();
    const p = headMap(v).multiplyScalar(grow);
    position.setXYZ(i, p.x + HEAD_C.x, p.y + HEAD_C.y + 0.004, p.z + HEAD_C.z - 0.008);
  }
  shell.computeVertexNormals();
  kit.mesh(kit.head, shell, material);
}

interface StrandOptions {
  lift?: number;
  bulge?: number;
  r0?: number;
  r1?: number;
  wiggle?: number;
  // Segue reto pra baixo depois do fim do caminho (cabelo comprido).
  drop?: number;
}

// Uma mecha: um tubo fino que sai perto do topo da cabeça e desce pela
// superfície até a linha do cabelo, afinando na ponta.
function strand(kit: Kit, material: Material, from: [number, number], to: [number, number], o: StrandOptions = {}) {
  const n = 7;
  const points: Vector3[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const theta = from[0] + (to[0] - from[0]) * t + (o.wiggle ?? 0) * Math.sin(t * Math.PI * 2);
    const phi = Math.min(84, from[1] + (to[1] - from[1]) * t);
    points.push(surface(rad(theta), rad(phi), (o.lift ?? 0.012) + (o.bulge ?? 0.016) * Math.sin(Math.PI * t)).pos);
  }
  if (o.drop) {
    const last = points[points.length - 1];
    for (let k = 1; k <= 3; k++) {
      points.push(new Vector3(last.x * (1 + 0.06 * k), last.y - (o.drop * k) / 3, last.z * (1 + 0.02 * k)));
    }
  }
  const r0 = o.r0 ?? 0.02;
  const r1 = o.r1 ?? 0.004;
  kit.mesh(kit.head, tube(points, (t) => r0 + (r1 - r0) * Math.pow(t, 0.8), 0, 1, 8, o.drop ? 22 : 16), material);
}

// Mechas espalhadas em leque a partir de um redemoinho no alto da cabeça,
// varrendo a testa na diagonal (repartido de lado).
function fringeStrands(kit: Kit, mats: Material[], covered: boolean) {
  const rand = seeded(11);
  let index = 0;
  const pick = () => mats[index++ % mats.length];
  const crown = (): [number, number] => [34 + (rand() - 0.5) * 18, 72 + rand() * 6];

  if (!covered) {
    for (let k = 0; k <= 11; k++) {
      const theta = -78 + 11.5 * k;
      const hairline = 30 + 5 * Math.sin(k * 0.8 + 0.4) - (Math.abs(theta) > 44 ? 8 : 0);
      strand(kit, pick(), crown(), [theta, hairline], {
        lift: 0.016,
        bulge: 0.028 + rand() * 0.016,
        r0: 0.026 + rand() * 0.008,
        r1: 0.005,
        wiggle: 6 + (rand() - 0.5) * 6,
      });
    }
  }
  for (const side of [-1, 1]) {
    for (let j = 0; j < 4; j++) {
      strand(kit, pick(), crown(), [side * (72 + 15 * j), 16 - 4 * j + rand() * 4], { lift: 0.016, bulge: 0.022, r0: 0.026 });
    }
  }
  for (let k = 0; k < 6; k++) {
    strand(kit, pick(), crown(), [130 + 20 * k, 26 - 3 * k], { lift: 0.016, bulge: 0.02, r0: 0.026 });
  }
}

export function buildHair(kit: Kit, style: string, color: string, covered: boolean) {
  if (style === "hs-bald") return;
  const base = kit.std(darken(color, 0.16), 0.55);
  base.side = DoubleSide;
  const mats = [kit.std(color, 0.5), kit.std(lighten(color, 0.1), 0.45), kit.std(darken(color, 0.1), 0.55)];
  const rand = seeded(23);

  switch (style) {
    case "hs-long": {
      hairShell(kit, base, 1.7, -0.5, 1.045);
      fringeStrands(kit, mats, covered);
      // massa de cabelo caindo atrás da cabeça até as costas
      const back = kit.mesh(kit.head, new SphereGeometry(1, 40, 28), mats[2], 0, 1.23, -0.1);
      back.scale.set(0.372, 0.5, 0.27);
      // mechas grossas caindo dos dois lados do rosto
      for (const s of [-1, 1]) {
        strand(kit, mats[1], [s * 42, 72], [s * 86, 10], { lift: 0.022, bulge: 0.026, r0: 0.046, r1: 0.03, drop: 0.4 });
        strand(kit, mats[0], [s * 28, 74], [s * 78, 22], { lift: 0.03, bulge: 0.026, r0: 0.04, r1: 0.026, drop: 0.36 });
      }
      break;
    }
    case "hs-curly": {
      hairShell(kit, base, 1.5, -0.5, 1.03);
      const curls: [number, number][] = [
        [-44, 33], [-22, 38], [0, 40], [22, 38], [44, 33],
        [-70, 20], [70, 20], [-100, 22], [100, 22], [-135, 24], [135, 24], [180, 26],
        [-38, 58], [0, 62], [38, 58], [-90, 52], [90, 52], [-140, 52], [140, 52], [180, 55],
        [-25, 78], [25, 78], [0, 82], [180, 78],
      ];
      curls.forEach(([theta, phi], i) => {
        if (covered && phi > 45) return;
        const size = 0.085 + rand() * 0.02;
        const sphere = kit.mesh(kit.head, new SphereGeometry(size, 20, 16), mats[i % 3]);
        sphere.position.copy(surface(rad(theta), rad(phi), 0.04).pos);
      });
      break;
    }
    case "hs-bun":
      hairShell(kit, base);
      fringeStrands(kit, mats, covered);
      if (!covered) kit.mesh(kit.head, new SphereGeometry(0.11, 28, 20), mats[0], 0, 1.86, -0.05);
      break;
    case "hs-buzz": {
      const buzz = kit.std(color, 0.92);
      buzz.side = DoubleSide;
      hairShell(kit, buzz, 1.55, -0.62, 1.014);
      break;
    }
    case "hs-mohawk": {
      hairShell(kit, kit.std(darken(color, 0.25), 0.8), 0.9, -0.1, 1.02);
      if (covered) break;
      for (let i = 0; i < 10; i++) {
        const phi = 58 + 4 * i;
        const from = surface(0, rad(Math.min(phi, 82)), 0).pos;
        const back = surface(rad(180), rad(Math.max(20, 128 - phi - 20)), 0).pos;
        const t = i / 9;
        const pos = i < 5 ? from : back;
        const blade = kit.mesh(kit.head, new SphereGeometry(1, 20, 16), mats[i % 3], pos.x, pos.y + 0.045, pos.z);
        blade.scale.set(0.03, 0.11 - Math.abs(t - 0.5) * 0.04, 0.06);
      }
      break;
    }
    case "hs-quiff":
      hairShell(kit, base);
      fringeStrands(kit, mats, covered);
      if (!covered) {
        // topete: mechas grossas subindo e caindo pra frente
        for (let k = 0; k < 5; k++) {
          strand(kit, mats[k % 3], [-8 + k * 6, 66], [-16 + k * 9, 38], { lift: 0.03, bulge: 0.1, r0: 0.03, r1: 0.008 });
        }
      }
      break;
    default:
      // hs-short: repartido de lado, com uma mecha levantada (como no boneco de referência)
      hairShell(kit, base);
      fringeStrands(kit, mats, covered);
      if (!covered) {
        // mechas mais grossas no redemoinho, deitadas pro lado
        strand(kit, mats[0], [40, 74], [-30, 62], { lift: 0.03, bulge: 0.03, r0: 0.034, r1: 0.01 });
        strand(kit, mats[1], [44, 70], [-10, 56], { lift: 0.028, bulge: 0.03, r0: 0.032, r1: 0.01 });
      }
  }
}
