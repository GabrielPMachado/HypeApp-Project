import {
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  CircleGeometry,
  ConeGeometry,
  CylinderGeometry,
  DataTexture,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  LatheGeometry,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  RGBAFormat,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

import {
  BOTTOM_COLORS,
  darken,
  DEFAULT_LOOK,
  EYE_COLORS,
  HAIR_COLORS,
  lighten,
  rosy,
  SHOE_COLORS,
  SKIN_COLORS,
  TOP_COLORS,
  type Look,
} from "@/data/character";

// Modelo 3D do personagem: geometria procedural (esferas, cilindros, tubos)
// montada a partir do mesmo Look do avatar 2D, com luz e sombra de verdade —
// a versão "boneco 3D" do perfil, que gira. Só depende do three (nada de DOM),
// então roda igual no celular (expo-gl) e no navegador (galeria de testes).
//
// Unidades: o boneco tem ~1,9 de altura, pés em y=0, olhando pra +z. A cabeça
// grande fica centrada em (0, 1.5, 0).

const rad = (deg: number) => (deg * Math.PI) / 180;
const Z_AXIS = new Vector3(0, 0, 1);

export interface CharacterModel {
  root: Group;
  dispose(): void;
}

// Disco com borda esmaecida (alfa em degradê), usado no blush e na sombra do
// chão. É um DataTexture — sem canvas, funciona igual no celular.
export function softDiscTexture(size = 64): DataTexture {
  const data = new Uint8Array(size * size * 4);
  const c = (size - 1) / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.min(1, Math.hypot(x - c, y - c) / c);
      const a = 1 - d;
      const i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = 255;
      data[i + 3] = Math.round(a * a * (3 - 2 * a) * 255);
    }
  }
  const texture = new DataTexture(data, size, size, RGBAFormat);
  texture.needsUpdate = true;
  return texture;
}

// Guarda o que foi criado pra liberar de uma vez quando o look muda.
class Kit {
  readonly root = new Group();
  private readonly geometries: BufferGeometry[] = [];
  private readonly materials = new Map<string, Material>();
  private layer = 0;
  private softTexture: DataTexture | null = null;

  std(color: string, roughness = 0.7): MeshStandardMaterial {
    const key = `s|${color}|${roughness}`;
    let material = this.materials.get(key) as MeshStandardMaterial | undefined;
    if (!material) {
      material = new MeshStandardMaterial({ color, roughness, metalness: 0 });
      this.materials.set(key, material);
    }
    return material;
  }

  // Brilho de verniz (couro envernizado, ouro, lentes): tem reflexo das luzes
  // mesmo sem mapa de ambiente.
  gloss(color: string, roughness = 0.28, clearcoat = 0.9): MeshPhysicalMaterial {
    const key = `g|${color}|${roughness}|${clearcoat}`;
    let material = this.materials.get(key) as MeshPhysicalMaterial | undefined;
    if (!material) {
      material = new MeshPhysicalMaterial({ color, roughness, metalness: 0.15, clearcoat, clearcoatRoughness: 0.18 });
      this.materials.set(key, material);
    }
    return material;
  }

  // Cor chapada sem luz (detalhes do rosto: pupila, reflexo). Cada uso vira
  // uma camada com polygonOffset próprio, senão brigam por profundidade com a
  // superfície embaixo.
  decal(color: string, opacity = 1): MeshBasicMaterial {
    this.layer += 1;
    const material = new MeshBasicMaterial({
      color,
      transparent: opacity < 1,
      opacity,
      depthWrite: opacity >= 1,
      polygonOffset: true,
      polygonOffsetFactor: -this.layer,
      polygonOffsetUnits: -this.layer,
      side: DoubleSide,
    });
    this.materials.set(`d|${this.layer}`, material);
    return material;
  }

  // Mancha suave e translúcida (círculo com borda esmaecida).
  soft(color: string, opacity: number): MeshBasicMaterial {
    this.softTexture ??= softDiscTexture();
    this.layer += 1;
    const material = new MeshBasicMaterial({
      color,
      map: this.softTexture,
      transparent: true,
      opacity,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -this.layer,
      polygonOffsetUnits: -this.layer,
      side: DoubleSide,
    });
    this.materials.set(`t|${this.layer}`, material);
    return material;
  }

  mesh(parent: Object3D, geometry: BufferGeometry, material: Material, x = 0, y = 0, z = 0): Mesh {
    this.geometries.push(geometry);
    const mesh = new Mesh(geometry, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  dispose() {
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.softTexture?.dispose();
  }
}

// ---- Cabeça e rosto ----
const HEAD_C = new Vector3(0, 1.5, 0);
const HEAD_R = new Vector3(0.335, 0.31, 0.325);

// Ponto na superfície da cabeça a (theta) graus pro lado e (phi) pra cima,
// mais o vetor normal ali. lift afasta o ponto pra fora da superfície.
function surface(theta: number, phi: number, lift = 0) {
  const dir = new Vector3(Math.sin(theta) * Math.cos(phi), Math.sin(phi), Math.cos(theta) * Math.cos(phi));
  const normal = new Vector3(dir.x / HEAD_R.x, dir.y / HEAD_R.y, dir.z / HEAD_R.z).normalize();
  const pos = new Vector3(HEAD_R.x * dir.x, HEAD_R.y * dir.y, HEAD_R.z * dir.z).add(normal.clone().multiplyScalar(lift)).add(HEAD_C);
  return { pos, normal };
}

// Cola o objeto na cabeça, com o +z dele apontando pra fora da superfície.
function stick(object: Object3D, theta: number, phi: number, lift = 0, roll = 0): Object3D {
  const { pos, normal } = surface(theta, phi, lift);
  object.position.copy(pos);
  object.quaternion.setFromUnitVectors(Z_AXIS, normal);
  if (roll) object.rotateZ(roll);
  return object;
}

function stuck(kit: Kit, theta: number, phi: number, lift = 0, roll = 0): Group {
  const group = new Group();
  stick(group, theta, phi, lift, roll);
  kit.root.add(group);
  return group;
}

interface FaceColors {
  skin: string;
  iris: string;
  brow: string;
}

function buildHead(kit: Kit, colors: FaceColors, mood: string) {
  const skin = kit.std(colors.skin, 0.56);
  const head = kit.mesh(kit.root, new SphereGeometry(1, 64, 48), skin, HEAD_C.x, HEAD_C.y, HEAD_C.z);
  head.scale.copy(HEAD_R);

  // Pescoço
  kit.mesh(kit.root, new CylinderGeometry(0.075, 0.085, 0.16, 24), kit.std(darken(colors.skin, 0.12), 0.6), 0, 1.2, 0);

  // Orelhas
  for (const side of [-1, 1]) {
    const ear = stuck(kit, side * rad(88), rad(-6), 0.004);
    const outer = kit.mesh(ear, new SphereGeometry(1, 20, 16), skin);
    outer.scale.set(0.028, 0.062, 0.05);
    outer.position.x = side * 0.008;
    const inner = kit.mesh(ear, new SphereGeometry(1, 16, 12), kit.std(darken(colors.skin, 0.2), 0.7));
    inner.scale.set(0.014, 0.036, 0.03);
    inner.position.set(side * 0.028, 0, 0);
  }

  // Nariz
  const nose = kit.mesh(stuck(kit, 0, rad(-14), 0.006), new SphereGeometry(1, 20, 16), kit.std(lighten(colors.skin, 0.06), 0.5));
  nose.scale.set(0.032, 0.027, 0.03);

  // Bochechas: três discos empilhados fingem o degradê do blush.
  const blush = rosy(colors.skin, 0.62);
  for (const side of [-1, 1]) {
    const cheek = stuck(kit, side * rad(37), rad(-18), 0.003);
    kit.mesh(cheek, new CircleGeometry(0.075, 32), kit.soft(blush, 0.5));
  }

  // Sobrancelhas
  const browMaterial = kit.std(colors.brow, 0.8);
  for (const side of [-1, 1]) {
    const brow = stuck(kit, side * rad(25), rad(15), 0.006, side * -0.1);
    const bar = kit.mesh(brow, new SphereGeometry(1, 16, 12), browMaterial);
    bar.scale.set(0.056, 0.011, 0.012);
  }

  const winkRight = mood === "md-wink";
  const laugh = mood === "md-laugh";
  for (const side of [-1, 1] as const) {
    if (laugh || (winkRight && side === 1)) closedEye(kit, side, laugh);
    else openEye(kit, side, colors, mood === "md-cool");
  }
  buildMouth(kit, colors.skin, mood);
}

function openEye(kit: Kit, side: -1 | 1, colors: FaceColors, halfLid: boolean) {
  const eye = stuck(kit, side * rad(25), rad(-3), 0);
  const sclera = kit.mesh(eye, new SphereGeometry(1, 32, 24), kit.std("#F6F3F1", 0.3));
  sclera.scale.set(0.068, 0.076, 0.016);
  sclera.position.z = -0.002;

  const iris = colors.iris;
  const disc = (radius: number, color: string, z: number, opacity = 1, x = 0, y = 0) => {
    const mesh = kit.mesh(eye, new CircleGeometry(radius, 40), kit.decal(color, opacity));
    mesh.position.set(x, y, z);
    return mesh;
  };
  const front = 0.0135;
  disc(0.055, darken(iris, 0.55), front);
  disc(0.049, iris, front + 0.0004);
  disc(0.032, lighten(iris, 0.35), front + 0.0008, 0.55, 0, -0.012);
  disc(0.025, "#141014", front + 0.0012);
  disc(0.0165, "#FFFFFF", front + 0.0016, 1, side * -0.019, 0.023);
  disc(0.0075, "#FFFFFF", front + 0.0016, 0.9, side * 0.017, -0.022);

  // Cílios: linha escura fina em cima do olho
  const lash = kit.mesh(eye, new TorusGeometry(0.066, 0.0055, 8, 32, rad(150)), kit.std("#1F1519", 0.6));
  lash.rotation.z = rad(90 - 75);
  lash.position.set(0, -0.004, 0.011);

  // Vidro da córnea: reflexo das luzes sobre o olho
  const cornea = kit.mesh(eye, new SphereGeometry(1, 28, 20), kit.gloss("#FFFFFF", 0.05, 1));
  cornea.scale.set(0.058, 0.064, 0.02);
  cornea.position.z = 0.006;
  (cornea.material as MeshPhysicalMaterial).transparent = true;
  (cornea.material as MeshPhysicalMaterial).opacity = 0.1;
  (cornea.material as MeshPhysicalMaterial).depthWrite = false;

  if (halfLid) {
    const lid = kit.mesh(eye, new CircleGeometry(0.066, 32, 0, Math.PI), kit.decal(colors.skin));
    lid.position.set(0, 0.002, front + 0.003);
    lid.scale.set(1, 0.82, 1);
  }
}

function closedEye(kit: Kit, side: -1 | 1, happy: boolean) {
  const eye = stuck(kit, side * rad(25), rad(-3), 0.004);
  const arc = kit.mesh(eye, new TorusGeometry(0.052, 0.0075, 8, 24, rad(150)), kit.std("#1F1519", 0.6));
  arc.rotation.z = happy ? rad(90 - 75) : rad(-90 - 75);
  arc.position.y = happy ? -0.012 : 0.012;
}

function buildMouth(kit: Kit, skin: string, mood: string) {
  const lip = rosy(skin, 0.72);
  const mouth = stuck(kit, 0, rad(-31), 0.004);
  if (mood === "md-laugh") {
    const open = kit.mesh(mouth, new CircleGeometry(0.07, 32, Math.PI, Math.PI), kit.decal("#54181F"));
    open.scale.set(1, 1.05, 1);
    open.position.y = 0.012;
    const tongue = kit.mesh(mouth, new CircleGeometry(0.036, 24, Math.PI, Math.PI), kit.decal("#E2707C"));
    tongue.position.set(0, -0.026, 0.0004);
    const teeth = kit.mesh(mouth, new CircleGeometry(0.06, 24, Math.PI * 1.08, Math.PI * 0.84), kit.decal("#FFFFFF"));
    teeth.scale.set(1, 0.36, 1);
    teeth.position.set(0, 0.012, 0.0006);
    return;
  }
  const arc = mood === "md-cool" ? rad(70) : mood === "md-wink" ? rad(110) : rad(100);
  const smile = kit.mesh(mouth, new TorusGeometry(0.062, 0.0115, 10, 28, arc), kit.std(lip, 0.45));
  smile.rotation.z = -Math.PI / 2 - arc / 2 + (mood === "md-cool" ? rad(12) : 0);
  smile.position.y = 0.05;
}

// ---- Cabelo ----
const NATURAL_HAIR = ["hc-black", "hc-brown", "hc-blond", "hc-red", "hc-gray"];

// Calota que cobre o alto da cabeça, inclinada pra trás pra a linha do cabelo
// ficar mais alta na testa do que na nuca.
function hairCap(kit: Kit, material: Material, thetaLen = 1.62, tilt = -0.58, grow = 1.05): Mesh {
  const geometry = new SphereGeometry(1, 56, 36, 0, Math.PI * 2, 0, thetaLen);
  const cap = kit.mesh(kit.root, geometry, material, HEAD_C.x, HEAD_C.y + 0.006, HEAD_C.z - 0.012);
  cap.scale.set(HEAD_R.x * grow, HEAD_R.y * (grow + 0.005), HEAD_R.z * (grow + 0.005));
  cap.rotation.x = tilt;
  return cap;
}

function lump(kit: Kit, material: Material, theta: number, phi: number, lift: number, sx: number, sy: number, sz: number, roll = 0) {
  const group = stuck(kit, rad(theta), rad(phi), lift, rad(roll));
  const mesh = kit.mesh(group, new SphereGeometry(1, 24, 18), material);
  mesh.scale.set(sx, sy, sz);
  return mesh;
}

// Mecha: cilindro fino que afina e termina redondo, saindo da cabeça.
function tuft(kit: Kit, material: Material, theta: number, phi: number, lift: number, radius: number, height: number, roll = 0, lean = 62) {
  const group = stuck(kit, rad(theta), rad(phi), lift, rad(roll));
  const lock = new Group();
  lock.rotation.x = rad(-lean);
  group.add(lock);
  kit.mesh(lock, new CylinderGeometry(radius * 0.32, radius, height, 14), material, 0, height / 2, 0);
  kit.mesh(lock, new SphereGeometry(radius * 0.34, 12, 10), material, 0, height, 0);
  return lock;
}

function buildHair(kit: Kit, style: string, color: string, covered: boolean) {
  if (style === "hs-bald") return;
  const hidesFront = covered;
  const hair = kit.std(color, 0.48);
  hair.side = DoubleSide;

  const fringe = () => {
    if (hidesFront) return;
    [[-46, 30, 0.1], [-26, 36, 0.12], [-4, 39, 0.13], [17, 37, 0.12], [37, 32, 0.1]].forEach(([theta, phi, size], i) => {
      lump(kit, hair, theta, phi, 0.02, size, size * 0.42, size * 0.5, -24 + i * 3);
    });
  };

  switch (style) {
    case "hs-long":
      hairCap(kit, hair);
      fringe();
      kit.mesh(kit.root, new SphereGeometry(1, 40, 28), hair, 0, 1.24, -0.12).scale.set(0.375, 0.56, 0.27);
      for (const side of [-1, 1]) {
        // mechas caindo dos lados do rosto, atrás das orelhas
        const strand = lump(kit, hair, side * 78, -14, 0.0, 0.075, 0.24, 0.1, 0);
        strand.position.y -= 0.06;
        strand.position.z -= 0.02;
      }
      break;
    case "hs-curly": {
      hairCap(kit, hair, 1.5, -0.5, 1.03);
      const curls: [number, number][] = [
        [-44, 33], [-22, 38], [0, 40], [22, 38], [44, 33],
        [-70, 20], [70, 20], [-100, 22], [100, 22], [-135, 24], [135, 24], [180, 26],
        [-38, 58], [0, 62], [38, 58], [-90, 52], [90, 52], [-140, 52], [140, 52], [180, 55],
        [-25, 80], [25, 80], [0, 86], [180, 80],
      ];
      curls.forEach(([theta, phi]) => {
        if (covered && phi > 45) return;
        lump(kit, hair, theta, phi, 0.045, 0.105, 0.105, 0.105);
      });
      break;
    }
    case "hs-bun":
      hairCap(kit, hair);
      fringe();
      if (!covered) kit.mesh(kit.root, new SphereGeometry(0.12, 32, 24), hair, 0, 1.86, -0.06);
      break;
    case "hs-buzz": {
      const buzz = kit.std(color, 0.9);
      buzz.side = DoubleSide;
      hairCap(kit, buzz, 1.55, -0.62, 1.012);
      break;
    }
    case "hs-mohawk": {
      for (let i = 0; i < (covered ? 0 : 9); i++) {
        const angle = rad(-58 + i * 14.5);
        const y = HEAD_C.y + Math.cos(angle) * 0.345;
        const z = Math.sin(angle) * 0.335;
        const blade = kit.mesh(kit.root, new SphereGeometry(1, 20, 16), hair, 0, y + 0.04, z);
        blade.scale.set(0.03, 0.115 - Math.abs(i - 4) * 0.008, 0.062);
        blade.rotation.x = -angle;
      }
      break;
    }
    case "hs-quiff":
      hairCap(kit, hair);
      fringe();
      if (!covered) {
        lump(kit, hair, 0, 52, 0.05, 0.16, 0.09, 0.2, 0).rotation.x = rad(-25);
        lump(kit, hair, -14, 60, 0.09, 0.1, 0.07, 0.15, 0);
        tuft(kit, hair, 12, 58, 0.03, 0.05, 0.14, 12, 40);
      }
      break;
    default:
      // hs-short: repartido de lado, com uns tufos no alto (como no boneco de referência)
      hairCap(kit, hair);
      fringe();
      if (!covered) {
        tuft(kit, hair, -30, 64, 0.02, 0.05, 0.11, -28, 30);
        tuft(kit, hair, 2, 70, 0.02, 0.055, 0.13, -6, 26);
        tuft(kit, hair, 32, 62, 0.02, 0.048, 0.1, 22, 32);
      }
  }
}

// ---- Acessórios ----
function buildAccessory(kit: Kit, id: string) {
  const frame = kit.std("#25252D", 0.4);
  switch (id) {
    case "ac-glasses":
    case "ac-shades": {
      const shades = id === "ac-shades";
      for (const side of [-1, 1]) {
        const lens = stuck(kit, side * rad(25), rad(-3), 0.046);
        if (shades) {
          const plate = kit.mesh(lens, new SphereGeometry(1, 28, 20), kit.gloss("#15151B", 0.25, 1));
          plate.scale.set(0.105, 0.078, 0.02);
        } else {
          kit.mesh(lens, new TorusGeometry(0.098, 0.009, 10, 40), frame);
          const glass = kit.mesh(lens, new CircleGeometry(0.096, 32), kit.decal("#CFE8FF", 0.16));
          glass.position.z = 0.001;
        }
      }
      const bridge = kit.mesh(kit.root, new CylinderGeometry(0.008, 0.008, 0.07, 8), frame, 0, 1.5, 0.35);
      bridge.rotation.z = Math.PI / 2;
      for (const side of [-1, 1]) {
        const arm = kit.mesh(kit.root, new CylinderGeometry(0.008, 0.008, 0.3, 8), frame, side * 0.325, 1.505, 0.19);
        arm.rotation.x = Math.PI / 2;
      }
      break;
    }
    case "ac-cap": {
      const red = kit.std("#C9594B", 0.6);
      red.side = DoubleSide;
      const dome = kit.mesh(kit.root, new SphereGeometry(1, 48, 30, 0, Math.PI * 2, 0, 1.62), red, 0, 1.51, -0.01);
      dome.scale.set(0.36, 0.34, 0.35);
      dome.rotation.x = -0.32;
      const brim = kit.mesh(kit.root, new CylinderGeometry(0.22, 0.22, 0.02, 36, 1, false, rad(-90), rad(180)), kit.std("#8E3B32", 0.6), 0, 1.655, 0.12);
      brim.rotation.x = rad(-6);
      brim.scale.set(1, 1, 1.6);
      kit.mesh(kit.root, new SphereGeometry(0.026, 16, 12), kit.std("#8E3B32", 0.6), 0, 1.86, 0.02);
      break;
    }
    case "ac-headphones": {
      const shell = kit.std("#454556", 0.45);
      const band = kit.mesh(kit.root, new TorusGeometry(0.385, 0.022, 12, 48, Math.PI), kit.std("#5F5F72", 0.4), 0, 1.5, 0);
      band.rotation.z = 0;
      for (const side of [-1, 1]) {
        const cup = kit.mesh(kit.root, new CylinderGeometry(0.1, 0.1, 0.075, 32), shell, side * 0.385, 1.49, 0);
        cup.rotation.z = Math.PI / 2;
        const ring = kit.mesh(kit.root, new TorusGeometry(0.075, 0.009, 8, 32), kit.std("#4FC3F7", 0.4), side * 0.425, 1.49, 0);
        ring.rotation.y = Math.PI / 2;
        (ring.material as MeshStandardMaterial).emissive.set("#4FC3F7").multiplyScalar(0.5);
      }
      break;
    }
    case "ac-fedora": {
      const felt = kit.std("#4A3B34", 0.75);
      const brim = kit.mesh(kit.root, new CylinderGeometry(0.44, 0.44, 0.016, 48), felt, 0, 1.68, 0);
      brim.scale.set(1, 1, 1.0);
      const crown = kit.mesh(kit.root, new CylinderGeometry(0.25, 0.28, 0.2, 40), kit.std("#5A4840", 0.75), 0, 1.78, 0);
      kit.mesh(kit.root, new SphereGeometry(0.25, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), kit.std("#5A4840", 0.75), 0, 1.88, 0).scale.set(1, 0.32, 1);
      kit.mesh(kit.root, new CylinderGeometry(0.285, 0.285, 0.045, 40), kit.std("#EDB84F", 0.5), 0, 1.72, 0);
      crown.receiveShadow = false;
      break;
    }
    case "ac-crown": {
      const gold = kit.gloss("#F2C24A", 0.3, 1);
      kit.mesh(kit.root, new CylinderGeometry(0.2, 0.22, 0.07, 40, 1, true), gold, 0, 1.84, 0).material = kit.gloss("#F2C24A", 0.3, 1);
      const ringMesh = kit.mesh(kit.root, new TorusGeometry(0.21, 0.02, 10, 40), gold, 0, 1.805, 0);
      ringMesh.rotation.x = Math.PI / 2;
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const spike = kit.mesh(kit.root, new ConeGeometry(0.045, 0.16, 12), gold, Math.sin(angle) * 0.21, 1.91, Math.cos(angle) * 0.21);
        spike.rotation.set(Math.cos(angle) * rad(8), 0, -Math.sin(angle) * rad(8));
        kit.mesh(kit.root, new SphereGeometry(0.03, 14, 10), kit.gloss(i % 2 ? "#5AA9E6" : "#D9485A", 0.15, 1), Math.sin(angle) * 0.21, 1.835, Math.cos(angle) * 0.218);
      }
      break;
    }
  }
}

// ---- Corpo ----
// Sólido de revolução (cintura/torso): raio em função de u (0 embaixo, 1 em
// cima), fechado no topo e na base.
function revolve(radius: (u: number) => number, height: number, steps = 48, segments = 44): LatheGeometry {
  const points: Vector2[] = [new Vector2(0.0001, 0)];
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    points.push(new Vector2(Math.max(0.0001, radius(u)), u * height));
  }
  points.push(new Vector2(0.0001, height));
  return new LatheGeometry(points, segments);
}

const roundEnd = (u: number, from: number) => (u > from ? Math.sqrt(Math.max(0, 1 - Math.pow((u - from) / (1 - from), 2) * 0.96)) : 1);
const roundStart = (u: number, to: number) => (u < to ? Math.sqrt(Math.max(0, 1 - Math.pow((to - u) / to, 2) * 0.9)) : 1);

// Tubo com raio variável ao longo de uma curva — braços e mangas.
function tube(points: Vector3[], radius: (t: number) => number, t0 = 0, t1 = 1, radial = 20, segments = 40): BufferGeometry {
  const curve = new CatmullRomCurve3(points, false, "catmullrom", 0.5);
  const frames = curve.computeFrenetFrames(segments, false);
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = t0 + (t1 - t0) * (i / segments);
    const p = curve.getPointAt(t);
    const n = frames.normals[i];
    const b = frames.binormals[i];
    const r = radius(t);
    for (let j = 0; j <= radial; j++) {
      const angle = (j / radial) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      positions.push(p.x + r * (cos * n.x + sin * b.x), p.y + r * (cos * n.y + sin * b.y), p.z + r * (cos * n.z + sin * b.z));
    }
  }
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const b = a + radial + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// Linha central do braço: ombro → cotovelo pra fora → punho no bolso da frente.
function armPoints(side: -1 | 1): Vector3[] {
  return [
    new Vector3(side * 0.19, 1.08, 0),
    new Vector3(side * 0.33, 1.0, -0.005),
    new Vector3(side * 0.385, 0.87, 0.02),
    new Vector3(side * 0.345, 0.75, 0.1),
    new Vector3(side * 0.26, 0.7, 0.16),
  ];
}

interface Sleeve {
  color: string;
  radius: number;
  // Até que ponto do braço vai a manga (0..1); 1 = manga comprida.
  reach: number;
  puffy?: boolean;
  cuff?: string;
  roughness?: number;
}

function buildArms(kit: Kit, skin: string, sleeve: Sleeve) {
  const skinMat = kit.std(skin, 0.58);
  const cloth = kit.std(sleeve.color, sleeve.roughness ?? 0.72);
  for (const side of [-1, 1] as const) {
    const points = armPoints(side);
    if (sleeve.reach < 1) {
      kit.mesh(kit.root, tube(points, (t) => 0.056 * (1 - t * 0.12)), skinMat);
      const hand = kit.mesh(kit.root, new SphereGeometry(0.066, 20, 16), skinMat, points[4].x, points[4].y, points[4].z);
      hand.scale.set(1, 0.9, 1.05);
    }
    const bump = (t: number) => (sleeve.puffy ? 1 + 0.11 * Math.pow(Math.abs(Math.sin(t * Math.PI * 4.4)), 0.55) : 1 + 0.03 * Math.sin(t * Math.PI));
    kit.mesh(kit.root, tube(points, (t) => sleeve.radius * bump(t) * (1 - t * 0.14), 0, sleeve.reach, 22, 56), cloth);
    kit.mesh(kit.root, new SphereGeometry(sleeve.radius * 1.02, 24, 18), cloth, points[0].x * 1.02, points[0].y, points[0].z);
    if (sleeve.reach >= 1 && sleeve.cuff) {
      const cuff = kit.std(sleeve.cuff, 0.85);
      kit.mesh(kit.root, tube(points, (t) => sleeve.radius * 0.8 * (1 - t * 0.14), 0.9, 1, 20, 8), cuff);
      const end = points[4];
      kit.mesh(kit.root, new SphereGeometry(sleeve.radius * 0.8 * 0.86, 20, 14), cuff, end.x, end.y, end.z);
    } else if (sleeve.reach < 1) {
      // barra da manga curta
      const curve = new CatmullRomCurve3(points, false, "catmullrom", 0.5);
      const p = curve.getPointAt(sleeve.reach);
      kit.mesh(kit.root, new SphereGeometry(sleeve.radius * 0.9, 20, 14), cloth, p.x, p.y, p.z);
    }
  }
}

interface TopStyle {
  color: string;
  half: number; // meia-largura do torso
  hem: number; // altura da barra
  height: number;
  puffy?: boolean;
  roughness?: number;
}

function buildTorso(kit: Kit, style: TopStyle) {
  const { half, hem, height } = style;
  const geometry = revolve((u) => {
    let r = half * (1 + 0.05 * (1 - u)) * roundEnd(u, 0.8) * roundStart(u, 0.05);
    if (style.puffy) r += 0.02 * Math.pow(Math.abs(Math.sin(u * Math.PI * 4)), 0.5) * roundEnd(u, 0.85);
    return r;
  }, height);
  const torso = kit.mesh(kit.root, geometry, kit.std(style.color, style.roughness ?? 0.72), 0, hem, 0);
  torso.scale.set(1, 1, 0.78);
  return torso;
}

function buildTop(kit: Kit, id: string, skin: string) {
  const color = TOP_COLORS[id] ?? TOP_COLORS[DEFAULT_LOOK.top];
  const dark = darken(color, 0.4);
  const bar = (w: number, h: number, d: number, material: Material, x: number, y: number, z: number, roll = 0) => {
    const mesh = kit.mesh(kit.root, new RoundedBoxGeometry(w, h, d, 3, Math.min(w, h, d) * 0.3), material, x, y, z);
    mesh.rotation.z = roll;
    return mesh;
  };

  switch (id) {
    case "tp-puffer": {
      buildTorso(kit, { color, half: 0.285, hem: 0.58, height: 0.6, puffy: true, roughness: 0.55 });
      buildArms(kit, skin, { color, radius: 0.074, reach: 1, puffy: true, cuff: "#B9B4AE", roughness: 0.55 });
      // gola alta de tricô e capuz de pelo em volta do pescoço (em V na frente)
      const knit = kit.mesh(kit.root, new TorusGeometry(0.1, 0.042, 14, 36), kit.std("#D8D1C7", 0.9), 0, 1.15, 0);
      knit.rotation.x = Math.PI / 2;
      const fur = kit.std("#F2E8D8", 1);
      for (const side of [-1, 1]) {
        for (let i = 0; i <= 6; i++) {
          const t = i / 6;
          const x = side * (0.185 - t * 0.17);
          const y = 1.185 - Math.pow(t, 1.2) * 0.15;
          const z = 0.0 + t * 0.2;
          kit.mesh(kit.root, new SphereGeometry(0.056 - t * 0.012, 16, 12), fur, x, y, z);
        }
      }
      for (let i = 0; i < 7; i++) {
        const angle = rad(-112 + i * 37);
        kit.mesh(kit.root, new SphereGeometry(0.055, 14, 10), fur, Math.sin(angle) * 0.185, 1.185, -Math.cos(angle) * 0.1 - 0.02);
      }
      // zíper, botões de pressão e bolsos
      bar(0.014, 0.4, 0.02, kit.std(dark, 0.6), 0, 0.85, 0.25);
      [0.98, 0.86, 0.74].forEach((y) => kit.mesh(kit.root, new SphereGeometry(0.022, 14, 10), kit.gloss("#6E3418", 0.35, 0.6), 0, y, 0.252));
      for (const side of [-1, 1]) {
        bar(0.02, 0.15, 0.03, kit.std(dark, 0.6), side * 0.16, 0.76, 0.225, side * -0.35);
      }
      // remendo na manga
      bar(0.05, 0.075, 0.025, kit.std("#2A2626", 0.7), 0.4, 1.0, 0.03);
      break;
    }
    case "tp-hoodie-blue": {
      buildTorso(kit, { color, half: 0.27, hem: 0.6, height: 0.58 });
      buildArms(kit, skin, { color, radius: 0.075, reach: 1, cuff: darken(color, 0.22) });
      const hood = kit.mesh(kit.root, new TorusGeometry(0.16, 0.065, 16, 32), kit.std(darken(color, 0.28), 0.8), 0, 1.15, -0.06);
      hood.rotation.x = rad(60);
      bar(0.34, 0.14, 0.05, kit.std(darken(color, 0.06), 0.72), 0, 0.8, 0.205);
      for (const side of [-1, 1]) {
        kit.mesh(kit.root, new CylinderGeometry(0.008, 0.008, 0.2, 8), kit.std("#F2F2F7", 0.6), side * 0.05, 1.03, 0.2);
      }
      break;
    }
    case "tp-jacket": {
      buildTorso(kit, { color, half: 0.265, hem: 0.6, height: 0.58 });
      buildArms(kit, skin, { color, radius: 0.076, reach: 1, cuff: "#34343E" });
      kit.mesh(kit.root, new CylinderGeometry(0.271, 0.271, 0.04, 44, 1, true), kit.std("#34343E", 0.8), 0, 0.625, 0).scale.set(1, 1, 0.78);
      const collar = kit.mesh(kit.root, new TorusGeometry(0.115, 0.03, 12, 32), kit.std("#3C3C46", 0.7), 0, 1.15, 0.0);
      collar.rotation.x = Math.PI / 2;
      bar(0.014, 0.44, 0.02, kit.gloss("#B0B0BC", 0.3, 0.6), 0, 0.9, 0.205);
      break;
    }
    case "tp-shirt":
      buildTorso(kit, { color, half: 0.262, hem: 0.6, height: 0.58 });
      buildArms(kit, skin, { color, radius: 0.072, reach: 1, cuff: "#E3E3EA" });
      bar(0.14, 0.05, 0.05, kit.std("#FFFFFF", 0.7), 0, 1.14, 0.14, 0.4);
      [1.02, 0.92, 0.82, 0.72].forEach((y) => kit.mesh(kit.root, new SphereGeometry(0.014, 10, 8), kit.std("#B5B5BF", 0.4), 0, y, 0.205));
      break;
    case "tp-blazer":
    case "tp-tux": {
      const tux = id === "tp-tux";
      buildTorso(kit, { color, half: 0.265, hem: 0.6, height: 0.58 });
      buildArms(kit, skin, { color, radius: 0.076, reach: 1, cuff: "#F2F2F7" });
      bar(0.13, 0.46, 0.03, kit.std("#F6F6FA", 0.7), 0, 0.92, 0.198);
      const lapel = kit.std(tux ? "#2E2E38" : "#3A4E78", tux ? 0.35 : 0.75);
      for (const side of [-1, 1]) bar(0.075, 0.24, 0.035, lapel, side * 0.095, 1.0, 0.205, side * 0.36);
      if (tux) {
        const bow = kit.gloss("#BC3F50", 0.4, 0.5);
        for (const side of [-1, 1]) {
          const wing = kit.mesh(kit.root, new ConeGeometry(0.05, 0.085, 4), bow, side * 0.05, 1.05, 0.215);
          wing.rotation.z = side * -Math.PI / 2;
        }
        kit.mesh(kit.root, new SphereGeometry(0.024, 14, 10), kit.gloss("#8E2E3A", 0.4, 0.5), 0, 1.05, 0.215);
      } else {
        bar(0.045, 0.012, 0.02, kit.std("#F2F2F7", 0.7), 0.1, 0.9, 0.222);
        kit.mesh(kit.root, new SphereGeometry(0.014, 10, 8), kit.std("#8090B4", 0.4), 0, 0.82, 0.222);
      }
      break;
    }
    default:
      // Camisetas
      buildTorso(kit, { color, half: 0.262, hem: 0.6, height: 0.58 });
      buildArms(kit, skin, { color, radius: 0.074, reach: 0.27 });
  }
}

// ---- Calças ----
function buildBottom(kit: Kit, id: string, skin: string) {
  const color = BOTTOM_COLORS[id] ?? BOTTOM_COLORS[DEFAULT_LOOK.bottom];
  const cloth = kit.std(color, 0.8);
  const skinMat = kit.std(skin, 0.58);

  for (const side of [-1, 1]) {
    const x = side * 0.105;
    if (id === "bt-shorts") {
      kit.mesh(kit.root, new CylinderGeometry(0.105, 0.115, 0.27, 28), cloth, x, 0.47, 0);
      kit.mesh(kit.root, new CylinderGeometry(0.06, 0.055, 0.3, 24), skinMat, x, 0.27, 0);
      const hem = kit.mesh(kit.root, new TorusGeometry(0.115, 0.009, 8, 28), kit.std(darken(color, 0.15), 0.8), x, 0.335, 0);
      hem.rotation.x = Math.PI / 2;
      continue;
    }
    kit.mesh(kit.root, new CylinderGeometry(0.1, 0.086, 0.42, 28), cloth, x, 0.41, 0);
    if (id === "bt-cargo") {
      const pocket = kit.mesh(kit.root, new RoundedBoxGeometry(0.03, 0.1, 0.085, 2, 0.01), kit.std(darken(color, 0.12), 0.85), side * 0.2, 0.42, 0.01);
      pocket.rotation.z = 0;
    }
    if (id === "bt-jeans") {
      // barra dobrada mostrando o avesso mais claro
      kit.mesh(kit.root, new CylinderGeometry(0.098, 0.094, 0.075, 28), kit.std(lighten(color, 0.42), 0.85), x, 0.235, 0);
      const edge = kit.mesh(kit.root, new TorusGeometry(0.098, 0.01, 8, 28), kit.std(darken(color, 0.1), 0.85), x, 0.272, 0);
      edge.rotation.x = Math.PI / 2;
    }
  }
  // quadril, escondido sob a barra da roupa
  kit.mesh(kit.root, new CylinderGeometry(0.235, 0.22, 0.14, 40), cloth, 0, 0.6, 0).scale.set(1, 1, 0.78);
}

// ---- Calçados ----
function buildShoes(kit: Kit, id: string) {
  const color = SHOE_COLORS[id] ?? SHOE_COLORS[DEFAULT_LOOK.shoes];
  const boots = id === "sh-boots";
  const dress = id === "sh-dress";
  const white = id === "sh-white";
  const upper = dress || id === "sh-gold" ? kit.gloss(color, 0.28, 1) : kit.std(color, boots ? 0.62 : 0.55);
  const soleColor = boots ? "#3A2A22" : dress ? "#0C0A0B" : white ? "#D9D9E0" : id === "sh-gold" ? "#B8862A" : "#EDEDF2";
  const trim = kit.std(white ? "#D24A4A" : id === "sh-gold" ? "#FFF3B8" : boots ? lighten(color, 0.4) : "#F1F1F5", 0.6);

  for (const side of [-1, 1]) {
    const shoe = new Group();
    shoe.position.set(side * 0.108, 0, 0);
    shoe.rotation.y = side * rad(5);
    kit.root.add(shoe);

    const width = dress ? 0.165 : 0.2;
    const length = dress ? 0.34 : boots ? 0.31 : 0.32;
    const height = boots ? 0.13 : dress ? 0.09 : 0.1;
    const body = kit.mesh(shoe, new RoundedBoxGeometry(width, height, length, 5, height * 0.42), upper, 0, 0.035 + height / 2, 0.06);
    body.scale.set(1, 1, 1);
    // biqueira
    const toe = kit.mesh(shoe, new SphereGeometry(1, 24, 16), boots ? kit.std(darken(color, 0.15), 0.65) : upper, 0, 0.085, 0.2);
    toe.scale.set(width * 0.5, height * 0.62, dress ? 0.11 : 0.085);
    // solado
    kit.mesh(shoe, new RoundedBoxGeometry(width + 0.014, boots ? 0.045 : 0.05, length + 0.014, 3, 0.02), kit.std(soleColor, 0.75), 0, 0.022, 0.06);
    if (boots) {
      kit.mesh(shoe, new CylinderGeometry(0.097, 0.107, 0.1, 28), upper, 0, 0.2, -0.01);
      const collar = kit.mesh(shoe, new TorusGeometry(0.102, 0.012, 8, 28), trim, 0, 0.245, -0.01);
      collar.rotation.x = Math.PI / 2;
      for (let i = 0; i < 3; i++) {
        const lace = kit.mesh(shoe, new CylinderGeometry(0.005, 0.005, 0.06, 6), trim, 0, 0.2 + i * 0.03 - 0.03, 0.098 - i * 0.004);
        lace.rotation.z = Math.PI / 2;
      }
    } else {
      // cano baixo do tênis/sapato + língua
      kit.mesh(shoe, new CylinderGeometry(0.085, 0.09, 0.07, 24), upper, 0, 0.19, -0.02);
      const stripe = kit.mesh(shoe, new RoundedBoxGeometry(0.012, 0.055, 0.14, 2, 0.005), trim, side * 0.098, 0.1, 0.06);
      stripe.rotation.z = 0;
    }
  }
}

// Sombra suave no chão: discos pretos translúcidos empilhados.
function buildFloorShadow(kit: Kit) {
  const shadow = kit.mesh(kit.root, new CircleGeometry(0.62, 40), kit.soft("#000000", 0.55), 0, 0.003, 0.03);
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(1, 0.75, 1);
}

const HIDES_FRONT_HAIR = ["ac-cap", "ac-fedora"];

export function buildCharacterModel(look: Look): CharacterModel {
  const kit = new Kit();
  const skin = SKIN_COLORS[look.skin] ?? SKIN_COLORS[DEFAULT_LOOK.skin];
  const hair = HAIR_COLORS[look.hairColor] ?? HAIR_COLORS[DEFAULT_LOOK.hairColor];
  const iris = EYE_COLORS[look.eyes] ?? EYE_COLORS[DEFAULT_LOOK.eyes];
  const brow = NATURAL_HAIR.includes(look.hairColor) ? darken(hair, 0.2) : "#3B2A22";

  buildFloorShadow(kit);
  buildShoes(kit, look.shoes);
  buildBottom(kit, look.bottom, skin);
  buildTop(kit, look.top, skin);
  buildHead(kit, { skin, iris, brow }, look.mood);
  buildHair(kit, look.hair, hair, HIDES_FRONT_HAIR.includes(look.accessory));
  buildAccessory(kit, look.accessory);

  return { root: kit.root, dispose: () => kit.dispose() };
}
