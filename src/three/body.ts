import {
  CatmullRomCurve3,
  CircleGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Material,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

import { BOTTOM_COLORS, darken, DEFAULT_LOOK, lighten, SHOE_COLORS, TOP_COLORS } from "@/data/character";
import { Kit, rad, revolve, roundEnd, roundStart, tube, wrinkle, Z_AXIS } from "@/three/kit";

// Corpo: braços e mãos, roupa de cima, calça e calçado. O boneco tem ~1,8 de
// altura, pés em y=0, olhando pra +z.

// ---- Braços ----
// Com casaco (que tem bolso) a mão some no bolso da frente, como no boneco de
// referência; nas demais roupas os braços caem soltos ao lado do corpo, com as
// mãos aparecendo.
type Pose = "pockets" | "relaxed";

const POCKET_TOPS = ["tp-puffer"];

function armPoints(side: -1 | 1, pose: Pose): Vector3[] {
  return pose === "pockets"
    ? [
        new Vector3(side * 0.2, 1.07, 0),
        new Vector3(side * 0.315, 0.99, -0.005),
        new Vector3(side * 0.352, 0.86, 0.02),
        new Vector3(side * 0.3, 0.74, 0.085),
        new Vector3(side * 0.205, 0.69, 0.125),
      ]
    : [
        new Vector3(side * 0.215, 1.07, 0),
        new Vector3(side * 0.302, 1.0, -0.005),
        new Vector3(side * 0.335, 0.86, 0),
        new Vector3(side * 0.342, 0.74, 0.015),
        new Vector3(side * 0.34, 0.66, 0.03),
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

// Mão: palma alongada e polegar, pendurada no pulso.
function buildHand(kit: Kit, skin: string, at: Vector3, side: -1 | 1) {
  const material = kit.skin(skin);
  const hand = new Group();
  hand.position.copy(at);
  kit.root.add(hand);
  const palm = kit.mesh(hand, new SphereGeometry(1, 20, 16), material, 0, -0.058, 0.004);
  palm.scale.set(0.034, 0.068, 0.024);
  const thumb = kit.mesh(hand, new SphereGeometry(1, 14, 10), material, side * -0.028, -0.04, 0.012);
  thumb.scale.set(0.011, 0.032, 0.012);
  thumb.rotation.z = side * rad(-10);
}

function buildArms(kit: Kit, skin: string, sleeve: Sleeve, pose: Pose) {
  const skinMat = kit.skin(skin);
  const cloth = kit.std(sleeve.color, sleeve.roughness ?? 0.72);
  for (const side of [-1, 1] as const) {
    const points = armPoints(side, pose);
    const end = points[points.length - 1];
    if (sleeve.reach < 1) {
      kit.mesh(kit.root, tube(points, (t) => 0.052 * (1 - t * 0.16)), skinMat);
    }
    const bump = (t: number) =>
      sleeve.puffy ? 1 + 0.1 * Math.pow(Math.abs(Math.sin(t * Math.PI * 4.4)), 0.55) : 1 + 0.03 * Math.sin(t * Math.PI);
    kit.mesh(kit.root, tube(points, (t) => sleeve.radius * bump(t) * (1.04 - t * 0.2), 0, sleeve.reach, 22, 56), cloth);
    if (sleeve.reach >= 1) {
      kit.mesh(kit.root, new SphereGeometry(sleeve.radius * 1.02, 24, 18), cloth, points[0].x * 1.02, points[0].y, points[0].z);
    }

    if (sleeve.reach >= 1 && sleeve.cuff && pose === "relaxed") {
      const cuff = kit.std(sleeve.cuff, 0.85);
      kit.mesh(kit.root, tube(points, (t) => sleeve.radius * 0.78 * (1.04 - t * 0.2), 0.9, 1, 20, 8), cuff);
      kit.mesh(kit.root, new SphereGeometry(sleeve.radius * 0.66, 20, 14), cuff, end.x, end.y, end.z);
    } else if (sleeve.reach < 1) {
      // barra da manga curta: um anel de tecido perpendicular ao braço
      const curve = new CatmullRomCurve3(points, false, "catmullrom", 0.5);
      const p = curve.getPointAt(sleeve.reach);
      const hem = kit.mesh(kit.root, new TorusGeometry(sleeve.radius * 0.93, sleeve.radius * 0.1, 10, 28), cloth, p.x, p.y, p.z);
      hem.quaternion.setFromUnitVectors(Z_AXIS, curve.getTangentAt(sleeve.reach).normalize());
    }
    if (pose === "relaxed") buildHand(kit, skin, end, side);
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
    if (style.puffy) {
      return half * (1 + 0.05 * (1 - u)) * roundEnd(u, 0.8) * roundStart(u, 0.05) + 0.02 * Math.pow(Math.abs(Math.sin(u * Math.PI * 4)), 0.5) * roundEnd(u, 0.85);
    }
    // cintura levemente marcada, peito cheio e ombros que descem até o pescoço
    const waist = 1 - 0.07 * Math.exp(-Math.pow((u - 0.3) / 0.2, 2));
    const chest = 1 + 0.05 * Math.exp(-Math.pow((u - 0.68) / 0.18, 2));
    const slope = u > 0.86 ? 1 - 0.5 * Math.pow((u - 0.86) / 0.14, 1.6) : 1;
    return half * (1 + 0.04 * (1 - u)) * waist * chest * slope * roundStart(u, 0.05);
  }, height);
  if (!style.puffy) wrinkle(geometry, 0.0035, half * 40);
  const torso = kit.mesh(kit.root, geometry, kit.std(style.color, style.roughness ?? 0.72), 0, hem, 0);
  torso.scale.set(1, 1, 0.78);
  return torso;
}

function buildTop(kit: Kit, id: string, skin: string) {
  const color = TOP_COLORS[id] ?? TOP_COLORS[DEFAULT_LOOK.top];
  const dark = darken(color, 0.4);
  const pose: Pose = POCKET_TOPS.includes(id) ? "pockets" : "relaxed";
  const bar = (w: number, h: number, d: number, material: Material, x: number, y: number, z: number, roll = 0) => {
    const mesh = kit.mesh(kit.root, new RoundedBoxGeometry(w, h, d, 3, Math.min(w, h, d) * 0.3), material, x, y, z);
    mesh.rotation.z = roll;
    return mesh;
  };

  switch (id) {
    case "tp-puffer": {
      buildTorso(kit, { color, half: 0.285, hem: 0.58, height: 0.6, puffy: true, roughness: 0.55 });
      buildArms(kit, skin, { color, radius: 0.074, reach: 1, puffy: true, cuff: "#B9B4AE", roughness: 0.55 }, pose);
      // gola alta de tricô e capuz de pelo em volta do pescoço (em V na frente)
      const knit = kit.mesh(kit.root, new TorusGeometry(0.1, 0.04, 14, 36), kit.std("#D8D1C7", 0.9), 0, 1.13, 0);
      knit.rotation.x = Math.PI / 2;
      const fur = kit.std("#F2E8D8", 1);
      for (const side of [-1, 1]) {
        for (let i = 0; i <= 6; i++) {
          const t = i / 6;
          const x = side * (0.185 - t * 0.17);
          const y = 1.17 - Math.pow(t, 1.2) * 0.15;
          const z = t * 0.2;
          kit.mesh(kit.root, new SphereGeometry(0.052 - t * 0.011, 16, 12), fur, x, y, z);
        }
      }
      for (let i = 0; i < 7; i++) {
        const angle = rad(-112 + i * 37);
        kit.mesh(kit.root, new SphereGeometry(0.05, 14, 10), fur, Math.sin(angle) * 0.185, 1.17, -Math.cos(angle) * 0.1 - 0.02);
      }
      // zíper, botões de pressão e bolsos
      bar(0.014, 0.4, 0.02, kit.std(dark, 0.6), 0, 0.85, 0.25);
      [0.98, 0.86, 0.74].forEach((y) => kit.mesh(kit.root, new SphereGeometry(0.02, 14, 10), kit.gloss("#6E3418", 0.35, 0.6), 0, y, 0.252));
      for (const side of [-1, 1]) {
        bar(0.02, 0.15, 0.03, kit.std(dark, 0.6), side * 0.16, 0.76, 0.225, side * -0.35);
      }
      // remendo na manga
      bar(0.05, 0.075, 0.025, kit.std("#2A2626", 0.7), 0.4, 1.0, 0.03);
      break;
    }
    case "tp-hoodie-blue": {
      buildTorso(kit, { color, half: 0.27, hem: 0.6, height: 0.58 });
      buildArms(kit, skin, { color, radius: 0.075, reach: 1, cuff: darken(color, 0.22) }, pose);
      const hood = kit.mesh(kit.root, new TorusGeometry(0.16, 0.065, 16, 32), kit.std(darken(color, 0.28), 0.8), 0, 1.13, -0.06);
      hood.rotation.x = rad(60);
      bar(0.34, 0.14, 0.05, kit.std(darken(color, 0.06), 0.72), 0, 0.8, 0.205);
      for (const side of [-1, 1]) {
        kit.mesh(kit.root, new CylinderGeometry(0.008, 0.008, 0.2, 8), kit.std("#F2F2F7", 0.6), side * 0.05, 1.03, 0.2);
      }
      break;
    }
    case "tp-jacket": {
      buildTorso(kit, { color, half: 0.265, hem: 0.6, height: 0.58 });
      buildArms(kit, skin, { color, radius: 0.076, reach: 1, cuff: "#34343E" }, pose);
      kit.mesh(kit.root, new CylinderGeometry(0.271, 0.271, 0.04, 44, 1, true), kit.std("#34343E", 0.8), 0, 0.625, 0).scale.set(1, 1, 0.78);
      const collar = kit.mesh(kit.root, new TorusGeometry(0.115, 0.03, 12, 32), kit.std("#3C3C46", 0.7), 0, 1.14, 0.0);
      collar.rotation.x = Math.PI / 2;
      bar(0.014, 0.44, 0.02, kit.gloss("#B0B0BC", 0.3, 0.6), 0, 0.9, 0.205);
      break;
    }
    case "tp-shirt":
      buildTorso(kit, { color, half: 0.262, hem: 0.6, height: 0.58 });
      buildArms(kit, skin, { color, radius: 0.072, reach: 1, cuff: "#E3E3EA" }, pose);
      bar(0.14, 0.05, 0.05, kit.std("#FFFFFF", 0.7), 0, 1.13, 0.14, 0.4);
      [1.02, 0.92, 0.82, 0.72].forEach((y) => kit.mesh(kit.root, new SphereGeometry(0.014, 10, 8), kit.std("#B5B5BF", 0.4), 0, y, 0.205));
      break;
    case "tp-blazer":
    case "tp-tux": {
      const tux = id === "tp-tux";
      buildTorso(kit, { color, half: 0.265, hem: 0.6, height: 0.58 });
      buildArms(kit, skin, { color, radius: 0.076, reach: 1, cuff: "#F2F2F7" }, pose);
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
      buildArms(kit, skin, { color, radius: 0.074, reach: 0.36 }, pose);
  }
}

// ---- Calças ----
// Perna: afina no tornozelo, panturrilha e joelho sutis, coxa cheia, com
// dobras suaves no tecido. Vai de y=0.2 (tornozelo) até 0.64 (sob a barra).
function legGeometry(side: number) {
  // raio ao longo da perna: [posição 0..1 do tornozelo ao quadril, raio]
  const stops: [number, number][] = [[0, 0.084], [0.12, 0.088], [0.28, 0.097], [0.5, 0.09], [0.75, 0.102], [1, 0.112]];
  const profile = (u: number) => {
    for (let i = 1; i < stops.length; i++) {
      if (u <= stops[i][0]) {
        const t = (u - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]);
        const eased = t * t * (3 - 2 * t);
        return stops[i - 1][1] + (stops[i][1] - stops[i - 1][1]) * eased;
      }
    }
    return stops[stops.length - 1][1];
  };
  return wrinkle(revolve(profile, 0.44, 40, 32), 0.003, side * 3, 30);
}

function buildBottom(kit: Kit, id: string, skin: string) {
  const color = BOTTOM_COLORS[id] ?? BOTTOM_COLORS[DEFAULT_LOOK.bottom];
  const cloth = kit.std(color, 0.8);
  const skinMat = kit.skin(skin);

  for (const side of [-1, 1]) {
    const x = side * 0.105;
    if (id === "bt-shorts") {
      kit.mesh(kit.root, new CylinderGeometry(0.108, 0.118, 0.27, 28), cloth, x, 0.47, 0);
      kit.mesh(kit.root, new CylinderGeometry(0.062, 0.052, 0.3, 24), skinMat, x, 0.27, 0);
      const hem = kit.mesh(kit.root, new TorusGeometry(0.118, 0.009, 8, 28), kit.std(darken(color, 0.15), 0.8), x, 0.335, 0);
      hem.rotation.x = Math.PI / 2;
      continue;
    }
    kit.mesh(kit.root, legGeometry(side), cloth, x, 0.2, 0);
    if (id === "bt-cargo") {
      kit.mesh(kit.root, new RoundedBoxGeometry(0.03, 0.1, 0.085, 2, 0.01), kit.std(darken(color, 0.12), 0.85), side * 0.205, 0.42, 0.01);
    }
    if (id === "bt-jeans") {
      // barra dobrada mostrando o avesso mais claro
      kit.mesh(kit.root, new CylinderGeometry(0.099, 0.095, 0.075, 28), kit.std(lighten(color, 0.42), 0.85), x, 0.235, 0);
      const edge = kit.mesh(kit.root, new TorusGeometry(0.099, 0.01, 8, 28), kit.std(darken(color, 0.1), 0.85), x, 0.272, 0);
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

    const width = dress ? 0.14 : 0.16;
    const length = dress ? 0.29 : boots ? 0.27 : 0.28;
    const height = boots ? 0.115 : dress ? 0.08 : 0.088;
    kit.mesh(shoe, new RoundedBoxGeometry(width, height, length, 5, height * 0.42), upper, 0, 0.035 + height / 2, 0.05);
    // biqueira
    const toe = kit.mesh(shoe, new SphereGeometry(1, 24, 16), boots ? kit.std(darken(color, 0.15), 0.65) : upper, 0, 0.08, 0.17);
    toe.scale.set(width * 0.5, height * 0.6, dress ? 0.1 : 0.075);
    // solado
    kit.mesh(shoe, new RoundedBoxGeometry(width + 0.012, boots ? 0.042 : 0.046, length + 0.012, 3, 0.02), kit.std(soleColor, 0.75), 0, 0.02, 0.05);
    if (boots) {
      kit.mesh(shoe, new CylinderGeometry(0.086, 0.094, 0.08, 28), upper, 0, 0.19, -0.012);
      const collar = kit.mesh(shoe, new TorusGeometry(0.089, 0.011, 8, 28), trim, 0, 0.23, -0.012);
      collar.rotation.x = Math.PI / 2;
      for (let i = 0; i < 3; i++) {
        const lace = kit.mesh(shoe, new CylinderGeometry(0.0045, 0.0045, 0.05, 6), trim, 0, 0.17 + i * 0.026, 0.083 - i * 0.004);
        lace.rotation.z = Math.PI / 2;
      }
    } else {
      // cano baixo do tênis/sapato + faixa lateral
      kit.mesh(shoe, new CylinderGeometry(0.078, 0.084, 0.06, 24), upper, 0, 0.18, -0.02);
      kit.mesh(shoe, new RoundedBoxGeometry(0.01, 0.048, 0.12, 2, 0.004), trim, side * 0.082, 0.095, 0.05);
    }
  }
}

// Sombra suave no chão.
function buildFloorShadow(kit: Kit) {
  const shadow = kit.mesh(kit.root, new CircleGeometry(0.6, 40), kit.soft("#000000", 0.55), 0, 0.003, 0.03);
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(1, 0.75, 1);
}

export function buildBody(kit: Kit, look: { top: string; bottom: string; shoes: string }, skin: string) {
  buildFloorShadow(kit);
  buildShoes(kit, look.shoes);
  buildBottom(kit, look.bottom, skin);
  buildTop(kit, look.top, skin);
}
