import { BufferGeometry, Color, DoubleSide, Material, MeshPhysicalMaterial, SphereGeometry, Vector3 } from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { darken, lighten } from "@/data/character";
import { HEAD_C, headMap, surface } from "@/three/head";
import { Kit, rad, seeded } from "@/three/kit";
import { blob, mergeParts, ribbon } from "@/three/ribbon";

// Cabelo: centenas de mechas achatadas, sobrepostas em camadas e fundidas numa
// malha só (ribbon.ts), sobre um couro cabeludo escuro. Cada mecha nasce no
// redemoinho do alto da cabeça e desce até a linha do cabelo; a cor vai de
// escura na raiz a clara na ponta, o que cria as sombras entre as mechas e dá
// volume. O mesmo gerador faz os estilos: muda o redemoinho, a linha do cabelo,
// o comprimento e o quanto as mechas levantam.

export const NATURAL_HAIR = ["hc-black", "hc-brown", "hc-blond", "hc-red", "hc-gray"];

const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const wrap = (deg: number) => ((((deg + 180) % 360) + 360) % 360) - 180;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Altura (phi, em graus) da linha do cabelo em cada ângulo em volta da cabeça:
// alta na testa, desce nas têmporas, e termina na nuca em `nape`.
function hairlinePhi(theta: number, nape: number): number {
  const a = Math.abs(wrap(theta));
  return 34 - 20 * smooth(40, 100, a) - (14 - nape) * smooth(100, 175, a);
}

interface Palette {
  root: Color;
  mid: Color;
  tip: Color;
}

function paletteOf(hex: string): Palette {
  const base = new Color(hex);
  return {
    root: base.clone().multiplyScalar(0.42),
    mid: base.clone(),
    tip: base.clone().lerp(new Color("#FFFFFF"), 0.14),
  };
}

// Cor ao longo da mecha (t: 0 raiz, 1 ponta), com um leve sorteio de brilho.
function lockColor(palette: Palette, jitter: number): (t: number) => Color {
  const c = new Color();
  return (t) => {
    c.copy(palette.root).lerp(palette.mid, clamp(t * 1.9, 0, 1)).lerp(palette.tip, clamp((t - 0.55) * 1.8, 0, 1));
    return c.multiplyScalar(jitter);
  };
}

interface Lock {
  from: [number, number];
  to: [number, number];
  lift: number;
  bulge: number;
  width: number;
  thick: number;
  swirl?: number;
  // Depois de chegar na linha do cabelo, a mecha continua caindo (cabelo comprido).
  drop?: number;
  dropOut?: number;
}

function lockGeometry(palette: Palette, rand: () => number, l: Lock): BufferGeometry {
  const n = 9;
  const points: Vector3[] = [];
  const normals: Vector3[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    // Gira em volta da cabeça logo no começo (perto do topo o caminho é curto) e
    // depois desce reto pelo meridiano, como o cabelo de verdade.
    const eTheta = 1 - Math.pow(1 - Math.min(1, t * 2.2), 2);
    const ePhi = t * t * (3 - 2 * t) * 0.3 + t * 0.7;
    const theta = lerp(l.from[0], l.to[0], eTheta) + (l.swirl ?? 0) * Math.sin(Math.PI * t);
    const phi = clamp(lerp(l.from[1], l.to[1], ePhi), -40, 84);
    const s = surface(rad(theta), rad(phi), l.lift + l.bulge * (0.35 + 0.65 * Math.sin(Math.PI * Math.pow(t, 0.8))));
    points.push(s.pos);
    normals.push(s.normal);
  }
  if (l.drop) {
    const last = points[points.length - 1];
    const out = new Vector3(last.x - HEAD_C.x, 0, last.z - HEAD_C.z).normalize();
    for (let k = 1; k <= 4; k++) {
      const u = k / 4;
      points.push(last.clone().add(new Vector3(0, -l.drop * u, 0)).addScaledVector(out, (l.dropOut ?? 0.03) * u * u));
      normals.push(out.clone());
    }
  }
  const color = lockColor(palette, 0.88 + rand() * 0.26);
  return ribbon(points, normals, {
    width: (t) => l.width * (0.55 + 0.45 * Math.pow(Math.sin(Math.PI * Math.min(t, 0.999)), 0.45)) * (1 - 0.45 * Math.pow(t, 5)),
    thick: (t) => l.thick * (0.7 + 0.3 * Math.sin(Math.PI * t)) * (1 - 0.35 * Math.pow(t, 4)),
    color,
    radial: 8,
    segments: l.drop ? 18 : 12,
  });
}

// Couro cabeludo: parte do crânio acima da linha do cabelo, na cor da raiz, pra
// não aparecer pele entre as mechas. floor dá a altura (phi, em graus) onde ele
// termina em cada ângulo em volta da cabeça.
function scalp(kit: Kit, material: Material, floor: (theta: number) => number, grow = 1.018): void {
  const sphere = new SphereGeometry(1, 72, 54);
  sphere.deleteAttribute("uv");
  sphere.deleteAttribute("normal");
  const shell = mergeVertices(sphere, 1e-4);
  const position = shell.getAttribute("position");
  const index = shell.getIndex();
  if (!index) throw new Error("couro cabeludo sem índice");

  const above = (i: number) => {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const theta = (Math.atan2(x, z) * 180) / Math.PI;
    const phi = (Math.asin(clamp(y, -1, 1)) * 180) / Math.PI;
    return phi >= floor(theta) - 1;
  };
  const kept: number[] = [];
  for (let i = 0; i < index.count; i += 3) {
    const t0 = index.getX(i);
    const t1 = index.getX(i + 1);
    const t2 = index.getX(i + 2);
    if (above(t0) && above(t1) && above(t2)) kept.push(t0, t1, t2);
  }
  shell.setIndex(kept);

  const v = new Vector3();
  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i).normalize();
    const p = headMap(v).multiplyScalar(grow);
    position.setXYZ(i, p.x + HEAD_C.x, p.y + HEAD_C.y, p.z + HEAD_C.z);
  }
  shell.computeVertexNormals();
  kit.mesh(kit.head, shell, material);
}

function hairMaterial(kit: Kit, color: string): MeshPhysicalMaterial {
  return kit.track(
    new MeshPhysicalMaterial({
      vertexColors: true,
      roughness: 0.4,
      metalness: 0,
      clearcoat: 0.3,
      clearcoatRoughness: 0.42,
      sheen: 0.9,
      sheenRoughness: 0.45,
      sheenColor: new Color(lighten(color, 0.4)),
      side: DoubleSide,
    }),
  );
}

interface Style {
  whorl: [number, number];
  nape: number;
  // Quanto as mechas da frente deslizam de lado (graus), formando a franja.
  sweep: number;
  count: number;
  outer: number;
  width: number;
  // Cabelo comprido: até onde as mechas de trás e dos lados caem.
  drop?: number;
  // Mechas da frente que levantam (topete).
  quiff?: boolean;
}

const SHORT: Style = { whorl: [32, 76], nape: -20, sweep: -16, count: 140, outer: 60, width: 0.064 };
const STYLES: Record<string, Style> = {
  "hs-short": SHORT,
  "hs-bun": { ...SHORT, count: 110, outer: 36 },
  "hs-quiff": { ...SHORT, whorl: [-8, 70], sweep: 8, quiff: true },
  "hs-long": { whorl: [26, 78], nape: -30, sweep: -14, count: 150, outer: 60, width: 0.068, drop: 0.36 },
};

function buildLocks(kit: Kit, color: string, style: Style, covered: boolean) {
  const palette = paletteOf(color);
  const rand = seeded(17);
  const parts: BufferGeometry[] = [];

  const swept = (theta: number) => theta + style.sweep * (1 - smooth(30, 90, Math.abs(wrap(theta))));
  const place = (layer: number, i: number, total: number): Lock | null => {
    const theta = wrap(-180 + (360 * (i + rand() * 0.9)) / total);
    if (covered && Math.abs(theta) < 70) return null;
    const targetTheta = swept(theta);
    const hairline = hairlinePhi(targetTheta, style.nape);
    const rootTheta = covered ? targetTheta : style.whorl[0] + (rand() - 0.5) * 20;
    const rootPhi = covered ? 56 : style.whorl[1] + (rand() - 0.5) * 6;
    const back = Math.abs(theta) > 100;
    const side = Math.abs(theta) > 60;
    const dropBase = style.drop ? (back ? style.drop : side ? style.drop * 0.78 : 0) : 0;
    return {
      from: [rootTheta, rootPhi],
      to: [rootTheta + wrap(targetTheta - rootTheta), hairline + (rand() - 0.5) * 3 - layer * 0],
      lift: 0.012 + layer * 0.014 + rand() * 0.006,
      bulge: 0.016 + layer * 0.01 + rand() * 0.014,
      width: style.width * (layer ? 0.85 : 1) * (0.85 + rand() * 0.3),
      thick: 0.02 - layer * 0.003,
      swirl: (rand() - 0.5) * 12,
      drop: dropBase ? dropBase * (0.85 + rand() * 0.3) : undefined,
      dropOut: 0.03 + rand() * 0.03,
    };
  };

  for (let i = 0; i < style.count; i++) {
    const lock = place(0, i, style.count);
    if (lock) parts.push(lockGeometry(palette, rand, lock));
  }
  for (let i = 0; i < style.outer; i++) {
    const lock = place(1, i, style.outer);
    if (!lock || (lock.drop && Math.abs(lock.to[0]) > 100)) continue;
    parts.push(lockGeometry(palette, rand, lock));
  }

  if (!covered) {
    // Mechas que levantam no redemoinho (como no boneco de referência), ou o
    // topete inteiro no estilo "quiff".
    const tufts = style.quiff ? 7 : 5;
    for (let k = 0; k < tufts; k++) {
      const base = surface(rad(style.whorl[0] + (k - tufts / 2) * 5), rad(style.whorl[1] + 2), 0.012);
      const lean = new Vector3(Math.cos(rad(style.whorl[0])), 0, -Math.sin(rad(style.whorl[0]))).multiplyScalar(style.quiff ? -1 : 1);
      const height = style.quiff ? 0.1 + rand() * 0.05 : 0.07 + rand() * 0.05;
      const points = [
        base.pos,
        base.pos.clone().addScaledVector(base.normal, height * 0.45).addScaledVector(lean, 0.015),
        base.pos.clone().addScaledVector(base.normal, height * 0.85).addScaledVector(lean, 0.05 + rand() * 0.03),
        base.pos.clone().addScaledVector(base.normal, height * 0.9).addScaledVector(lean, 0.1 + rand() * 0.04),
      ];
      parts.push(
        ribbon(points, points.map(() => lean.clone().cross(base.normal).normalize()), {
          width: (t) => (0.034 - 0.026 * t) * (0.8 + rand() * 0.3),
          thick: (t) => 0.017 * (1 - 0.6 * t),
          color: lockColor(palette, 0.95 + rand() * 0.15),
          radial: 8,
          segments: 10,
        }),
      );
    }
  }

  const merged = mergeParts(parts);
  kit.mesh(kit.head, merged, hairMaterial(kit, color));
}

function buildCurly(kit: Kit, color: string, covered: boolean) {
  const palette = paletteOf(color);
  const rand = seeded(29);
  const parts: BufferGeometry[] = [];
  const c = new Color();
  let placed = 0;
  for (let attempt = 0; attempt < 700 && placed < 150; attempt++) {
    // direção uniforme sobre a esfera, só na região do cabelo
    const y = rand() * 2 - 1;
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(1 - y * y);
    const d = new Vector3(Math.sin(a) * r, y, Math.cos(a) * r);
    const theta = (Math.atan2(d.x, d.z) * 180) / Math.PI;
    const phi = (Math.asin(d.y) * 180) / Math.PI;
    if (phi < hairlinePhi(theta, -6) + 3 || (covered && phi > 45)) continue;
    const size = 0.048 + rand() * 0.022;
    const center = headMap(d).add(HEAD_C).addScaledVector(d, 0.036 + rand() * 0.012);
    const jitter = 0.86 + rand() * 0.28;
    parts.push(
      blob(center, new Vector3(size, size, size), d, (v) => {
        c.copy(palette.root).lerp(palette.mid, clamp((v + 1) * 0.5 * 1.5, 0, 1)).lerp(palette.tip, clamp((v - 0.3) * 0.6, 0, 1) * 0.6);
        return c.multiplyScalar(jitter);
      }, [12, 9]),
    );
    placed += 1;
  }
  const dark = kit.std(darken(color, 0.4), 0.8);
  dark.side = DoubleSide;
  scalp(kit, dark, (theta) => hairlinePhi(theta, -6), 1.03);
  kit.mesh(kit.head, mergeParts(parts), hairMaterial(kit, color));
}

function buildMohawk(kit: Kit, color: string, covered: boolean) {
  const dark = kit.std(darken(color, 0.3), 0.85);
  dark.side = DoubleSide;
  scalp(kit, dark, () => 40, 1.02);
  if (covered) return;
  const palette = paletteOf(color);
  const rand = seeded(31);
  const parts: BufferGeometry[] = [];
  const c = new Color();
  for (let i = 0; i < 18; i++) {
    const s = i / 17;
    const p = rad(50 + 125 * s); // ângulo a partir da frente, por cima, até a nuca
    const dir = new Vector3(0, Math.sin(p), Math.cos(p));
    const center = headMap(dir).add(HEAD_C).addScaledVector(dir, 0.075);
    const height = 0.1 + 0.07 * Math.sin(Math.PI * s);
    parts.push(
      blob(center, new Vector3(0.032, height, 0.05), dir, (v) => {
        c.copy(palette.root).lerp(palette.mid, clamp((v + 1) * 0.5 * 1.6, 0, 1)).lerp(palette.tip, clamp(v, 0, 1) * 0.5);
        return c.multiplyScalar(0.92 + rand() * 0.16);
      }, [14, 10]),
    );
  }
  kit.mesh(kit.head, mergeParts(parts), hairMaterial(kit, color));
}

export function buildHair(kit: Kit, style: string, color: string, covered: boolean) {
  if (style === "hs-bald") return;

  if (style === "hs-curly") return buildCurly(kit, color, covered);
  if (style === "hs-mohawk") return buildMohawk(kit, color, covered);

  const dark = kit.std(darken(color, 0.32), 0.8);
  dark.side = DoubleSide;
  if (style === "hs-buzz") {
    const stubble = kit.std(darken(color, 0.1), 0.95);
    stubble.side = DoubleSide;
    scalp(kit, stubble, (theta) => hairlinePhi(theta, -14), 1.014);
    return;
  }

  const config = STYLES[style] ?? SHORT;
  scalp(kit, dark, (theta) => hairlinePhi(theta, config.nape));
  buildLocks(kit, color, config, covered);

  if (style === "hs-bun" && !covered) {
    // coque: bola de cabelo no alto, com a mesma cor em degradê
    const palette = paletteOf(color);
    const c = new Color();
    const bun = blob(new Vector3(0, 1.86, -0.05), new Vector3(0.115, 0.1, 0.115), new Vector3(0, 1, 0), (v) => {
      c.copy(palette.root).lerp(palette.mid, clamp((v + 1) * 0.5 * 1.5, 0, 1));
      return c;
    }, [24, 16]);
    kit.mesh(kit.head, bun, hairMaterial(kit, color));
  }
}
