// Personagem do perfil (o "avatar" da gamificação): um boneco 3D estilizado de
// corpo inteiro — cabeça grande, jaqueta fofa, pernas curtas — mas com feições
// de render realista: sem contornos de desenho, tudo modelado por luz e
// sombra (gradientes, reflexos e sombras suaves feitas com transparência).
// Montado a partir de peças escolhidas pela pessoa (pele, olhos, cabelo, cor
// do cabelo, roupa, calça, calçado, acessório e expressão). Este arquivo é só
// dado e geometria pura — o desenho na tela fica em
// components/CharacterAvatar.tsx, e o preço/liberação de cada peça no
// storeCatalog.ts.
//
// Tudo desenhado numa tela 100x184: cabeça grande centrada em (50, 45), corpo
// de pé logo abaixo, sombra no chão em y≈180. Nas listas e botões pequenos só
// aparece o "busto" (AVATAR_VIEWS.bust), recortando a mesma figura.

export type LookSlot =
  | "skin"
  | "eyes"
  | "hair"
  | "hairColor"
  | "top"
  | "bottom"
  | "shoes"
  | "accessory"
  | "mood";

export type Look = Record<LookSlot, string>;

export const LOOK_SLOTS: LookSlot[] = [
  "skin",
  "eyes",
  "hair",
  "hairColor",
  "top",
  "bottom",
  "shoes",
  "accessory",
  "mood",
];

export const LOOK_SLOT_LABELS: Record<LookSlot, string> = {
  skin: "Pele",
  eyes: "Olhos",
  hair: "Cabelo",
  hairColor: "Cor do cabelo",
  top: "Roupa",
  bottom: "Calça",
  shoes: "Calçado",
  accessory: "Acessório",
  mood: "Expressão",
};

export const DEFAULT_LOOK: Look = {
  skin: "sk-2",
  eyes: "ey-brown",
  hair: "hs-short",
  hairColor: "hc-brown",
  top: "tp-puffer",
  bottom: "bt-jeans",
  shoes: "sh-boots",
  accessory: "ac-none",
  mood: "md-smile",
};

// Recortes da figura (viewBox): "full" é o corpo inteiro; os outros são
// quadrados que cabem num círculo — o busto pros avatares pequenos e um
// enquadramento por tipo de peça pra prévia nos cartões da loja.
export type AvatarView = "full" | "bust" | "top" | "bottom" | "shoes";

export const AVATAR_VIEWS: Record<AvatarView, { x: number; y: number; w: number; h: number }> = {
  full: { x: 0, y: 0, w: 100, h: 184 },
  bust: { x: 0, y: 0, w: 100, h: 100 },
  top: { x: 6, y: 66, w: 88, h: 88 },
  bottom: { x: 12, y: 112, w: 76, h: 76 },
  shoes: { x: 20, y: 128, w: 60, h: 60 },
};

export const SKIN_COLORS: Record<string, string> = {
  "sk-1": "#F6D9C6",
  "sk-2": "#ECBD98",
  "sk-3": "#D9A276",
  "sk-4": "#B97F55",
  "sk-5": "#8B5C3B",
  "sk-6": "#5E3D29",
};

export const EYE_COLORS: Record<string, string> = {
  "ey-brown": "#7B4A28",
  "ey-hazel": "#A97A32",
  "ey-green": "#3E9F6A",
  "ey-blue": "#3A86D6",
  "ey-gray": "#7C8B9D",
  "ey-violet": "#8A5BD6",
};

export const HAIR_COLORS: Record<string, string> = {
  "hc-black": "#2C2830",
  "hc-brown": "#6A4530",
  "hc-blond": "#DDB865",
  "hc-red": "#BA5230",
  "hc-gray": "#BDBFC8",
  "hc-blue": "#4A84FF",
  "hc-pink": "#F45FA0",
  "hc-purple": "#A272FF",
  "hc-green": "#3FE08A",
};

export const TOP_COLORS: Record<string, string> = {
  "tp-tee-black": "#35353F",
  "tp-tee-white": "#EEEEF3",
  "tp-tee-amber": "#EDB84F",
  "tp-hoodie-blue": "#3F73DE",
  "tp-puffer": "#E8672C",
  "tp-jacket": "#25252D",
  "tp-shirt": "#F2F2F7",
  "tp-blazer": "#2A3A5C",
  "tp-tux": "#18181E",
};

export const BOTTOM_COLORS: Record<string, string> = {
  "bt-jeans": "#3F6CA8",
  "bt-black": "#2C2C35",
  "bt-shorts": "#C8B187",
  "bt-cargo": "#6E7A50",
  "bt-slacks": "#383E58",
};

export const SHOE_COLORS: Record<string, string> = {
  "sh-boots": "#8B5A36",
  "sh-white": "#F1F1F5",
  "sh-black": "#2A2A32",
  "sh-red": "#D24A4A",
  "sh-dress": "#1E1A1C",
  "sh-gold": "#F0C24A",
};

// [posição de 0 a 1, cor, opacidade (padrão 1)] — a opacidade é o que permite
// sombras e brilhos com borda suave, sem filtro de desfoque.
type Stop = readonly [number, string, number?];

// Preenchimento em degradê (coordenadas de 0 a 1 sobre a própria forma).
export type Gradient =
  | { k: "radial"; cx: number; cy: number; r: number; stops: readonly Stop[] }
  | { k: "linear"; x1: number; y1: number; x2: number; y2: number; stops: readonly Stop[] };

export type Paint = string | Gradient;

export type Shape =
  | { t: "path"; d: string; fill?: Paint; stroke?: string; sw?: number; op?: number }
  | { t: "circle"; cx: number; cy: number; r: number; fill?: Paint; stroke?: string; sw?: number; op?: number }
  | { t: "ellipse"; cx: number; cy: number; rx: number; ry: number; fill?: Paint; stroke?: string; sw?: number; op?: number }
  | { t: "rect"; x: number; y: number; w: number; h: number; rx?: number; fill?: Paint; stroke?: string; sw?: number; op?: number };

const INK = "#1F1519";

function mix(hex: string, target: number, amount: number): string {
  const channel = (start: number) =>
    Math.round(parseInt(hex.slice(start, start + 2), 16) * (1 - amount) + target * amount)
      .toString(16)
      .padStart(2, "0");
  return `#${channel(1)}${channel(3)}${channel(5)}`;
}
export const darken = (hex: string, amount: number) => mix(hex, 0, amount);
export const lighten = (hex: string, amount: number) => mix(hex, 255, amount);

// Pele puxada pro rosado dos lábios.
export function rosy(skin: string, amount: number): string {
  const channel = (start: number, target: number) =>
    Math.round(parseInt(skin.slice(start, start + 2), 16) * (1 - amount) + target * amount)
      .toString(16)
      .padStart(2, "0");
  return `#${channel(1, 0xb4)}${channel(3, 0x52)}${channel(5, 0x5e)}`;
}

// Luz vindo de cima à esquerda: centro claro, borda inferior direita escura.
function volume(base: string, strength = 1): Gradient {
  return {
    k: "radial",
    cx: 0.36,
    cy: 0.3,
    r: 0.85,
    stops: [
      [0, lighten(base, 0.22 * strength)],
      [0.5, base],
      [1, darken(base, 0.28 * strength)],
    ],
  };
}

// Mancha suave (sombra/brilho/blush): centro na cor dada, borda transparente.
function soft(color: string, alpha: number): Gradient {
  return {
    k: "radial",
    cx: 0.5,
    cy: 0.5,
    r: 0.5,
    stops: [
      [0, color, alpha],
      [0.55, color, alpha * 0.45],
      [1, color, 0],
    ],
  };
}

const shine = (d: string, sw = 2.2, op = 0.3): Shape => ({ t: "path", d, stroke: "#FFFFFF", sw, op });
const strand = (d: string, color: string, sw = 1.1, op = 0.35): Shape => ({ t: "path", d, stroke: color, sw, op });

function hairBack(style: string, color: string): Shape[] {
  switch (style) {
    case "hs-long":
      return [
        { t: "path", d: "M21 50 C15 20 34 9 50 9 C66 9 85 20 79 50 L84 88 C70 99 30 99 16 88 Z", fill: volume(color) },
        strand("M27 56 C24 68 24 80 28 92", darken(color, 0.4), 1.4, 0.35),
        strand("M73 56 C76 68 76 80 72 92", darken(color, 0.4), 1.4, 0.35),
      ];
    case "hs-curly":
      return [
        { t: "circle", cx: 21, cy: 50, r: 9, fill: volume(color) },
        { t: "circle", cx: 79, cy: 50, r: 9, fill: volume(color) },
      ];
    default:
      return [];
  }
}

const FRINGE = "M22 52 C17 25 34 11 50 11 C66 11 83 25 78 52 C76 42 70 34 60 31 C52 37 40 37 33 30 C27 34 23 43 22 52 Z";

function hairStrands(color: string): Shape[] {
  return [
    strand("M50 12 C46 20 40 27 33 31", darken(color, 0.45), 1.2, 0.4),
    strand("M52 12 C55 20 62 26 71 32", darken(color, 0.45), 1.2, 0.4),
    strand("M43 13 C37 18 31 25 26 36", darken(color, 0.4), 1.1, 0.3),
    shine("M32 25 Q41 15 55 15", 2.4, 0.34),
    shine("M60 15 Q68 18 73 26", 1.6, 0.22),
  ];
}

function hairFront(style: string, color: string): Shape[] {
  switch (style) {
    case "hs-short":
    case "hs-long":
      return [{ t: "path", d: FRINGE, fill: volume(color) }, ...hairStrands(color)];
    case "hs-curly": {
      const puffs: [number, number, number][] = [
        [27, 34, 11],
        [36, 23, 12],
        [50, 18, 12.5],
        [64, 23, 12],
        [73, 34, 11],
      ];
      return [
        ...puffs.map(([cx, cy, r]): Shape => ({ t: "circle", cx, cy, r, fill: volume(color) })),
        shine("M30 27 Q34 21 40 19", 2, 0.32),
        shine("M47 12 Q52 10 57 12", 2, 0.32),
        shine("M66 17 Q71 19 73 24", 1.6, 0.22),
      ];
    }
    case "hs-bun":
      return [
        { t: "circle", cx: 50, cy: 8, r: 9, fill: volume(color) },
        { t: "path", d: FRINGE, fill: volume(color) },
        ...hairStrands(color),
        shine("M46 5 Q50 2.5 54 5", 1.6, 0.35),
      ];
    case "hs-buzz":
      return [
        { t: "path", d: "M24 47 C22 27 36 18 50 18 C64 18 78 27 76 47 C72 37 62 32 50 32 C38 32 28 37 24 47 Z", fill: color, op: 0.62 },
      ];
    case "hs-mohawk":
      return [
        { t: "path", d: "M42 32 L43 9 C45 0 55 0 57 9 L58 32 C54 27 46 27 42 32 Z", fill: volume(color) },
        shine("M47 9 L47 24", 2, 0.34),
      ];
    case "hs-quiff":
      return [
        { t: "path", d: "M22 50 C14 22 42 3 68 10 C82 14 83 34 78 50 C75 38 64 29 50 30 C38 31 27 38 22 50 Z", fill: volume(color) },
        strand("M32 30 C36 20 48 12 64 12", darken(color, 0.45), 1.2, 0.4),
        shine("M32 20 Q46 8 65 12", 2.6, 0.34),
      ];
    default:
      return [];
  }
}

const rnd = (n: number) => Math.round(n * 100) / 100;

type Pt = readonly [number, number];
type Quad = readonly [Pt, Pt, Pt];

// ---- Braços ----
// O braço é uma linha grossa em duas curvas (ombro → cotovelo → pulso), com o
// cotovelo pra fora e a mão enfiada no bolso, como no boneco de referência.
// u vai de 0 (ombro) a 2 (pulso); 1 é o cotovelo.
const ARM_UPPER: Quad = [[27, 87], [17, 96], [18, 110]];
const ARM_LOWER: Quad = [[18, 110], [18.6, 120], [31, 124]];

const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

function splitQuad(q: Quad, t: number): [Quad, Quad] {
  const a = lerp(q[0], q[1], t);
  const b = lerp(q[1], q[2], t);
  const m = lerp(a, b, t);
  return [[q[0], a, m], [m, b, q[2]]];
}

// Trecho [t0, t1] de uma curva quadrática.
function subQuad(q: Quad, t0: number, t1: number): Quad {
  const head = splitQuad(q, t1)[0];
  return t0 <= 0 ? head : splitQuad(head, t0 / t1)[1];
}

function armPath(side: -1 | 1, u0: number, u1: number, dx = 0, dy = 0): string {
  const at = (p: Pt) => `${rnd((side === -1 ? p[0] : 100 - p[0]) + dx)} ${rnd(p[1] + dy)}`;
  const parts: Quad[] = [];
  if (u0 < 1) parts.push(subQuad(ARM_UPPER, u0, Math.min(u1, 1)));
  if (u1 > 1) parts.push(subQuad(ARM_LOWER, Math.max(u0 - 1, 0), u1 - 1));
  return `M${at(parts[0][0])}` + parts.map((q) => ` Q${at(q[1])} ${at(q[2])}`).join("");
}

// Traço atravessando o braço em u (costura da manga, punho, gomo do casaco).
function armRing(side: -1 | 1, u: number, half: number, color: string, sw = 1, op = 1): Shape {
  const [q, t] = u < 1 ? [ARM_UPPER, u] : [ARM_LOWER, u - 1];
  const mt = 1 - t;
  const x = mt * mt * q[0][0] + 2 * mt * t * q[1][0] + t * t * q[2][0];
  const y = mt * mt * q[0][1] + 2 * mt * t * q[1][1] + t * t * q[2][1];
  let dx = 2 * mt * (q[1][0] - q[0][0]) + 2 * t * (q[2][0] - q[1][0]);
  const dy = 2 * mt * (q[1][1] - q[0][1]) + 2 * t * (q[2][1] - q[1][1]);
  if (side === 1) dx = -dx;
  const cx = side === -1 ? x : 100 - x;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * half;
  const ny = (dx / len) * half;
  return { t: "path", d: `M${rnd(cx - nx)} ${rnd(y - ny)} L${rnd(cx + nx)} ${rnd(y + ny)}`, stroke: color, sw, op };
}

// Um trecho do braço com volume: sombra no torso, cor base, brilho do lado da
// luz (cima-esquerda) e sombra do outro.
function limb(side: -1 | 1, u0: number, u1: number, color: string, width: number, castShadow = false): Shape[] {
  const shapes: Shape[] = [];
  if (castShadow) {
    shapes.push({ t: "path", d: armPath(side, u0, u1, 1.4, 2), stroke: "#000000", sw: width, op: 0.16 });
  }
  shapes.push(
    { t: "path", d: armPath(side, u0, u1), stroke: color, sw: width },
    { t: "path", d: armPath(side, u0, u1, -width * 0.2, -width * 0.2), stroke: lighten(color, 0.3), sw: width * 0.24, op: 0.4 },
    { t: "path", d: armPath(side, u0, u1, width * 0.26, width * 0.26), stroke: darken(color, 0.42), sw: width * 0.3, op: 0.34 },
  );
  return shapes;
}

const SIDES: (-1 | 1)[] = [-1, 1];

interface ArmSpec {
  color: string;
  // Até onde vai a manga: 0.62 = manga curta, 1.94 = manga comprida.
  reach: number;
  width: number;
  // Cor do punho (faixa perto do pulso), quando tem.
  cuff?: string;
  // Gomos horizontais (casaco acolchoado).
  quilt?: boolean;
}

function armShapes(skin: string, spec: ArmSpec): Shape[] {
  const shapes: Shape[] = [];
  const short = spec.reach < 1.2;
  for (const side of SIDES) {
    if (short) {
      shapes.push(...limb(side, 0, 2, skin, 10.5, true));
      // Mão fechada no fim do braço.
      const hx = side === -1 ? 31 : 69;
      shapes.push({ t: "circle", cx: hx, cy: 124.5, r: 5, fill: volume(skin, 0.7) });
    }
    shapes.push(...limb(side, 0, spec.reach, spec.color, spec.width, !short));
    if (spec.quilt) {
      for (const u of [0.32, 0.66, 1.3, 1.62]) {
        shapes.push(armRing(side, u, spec.width * 0.46, darken(spec.color, 0.42), 1.2, 0.5));
      }
    }
    if (spec.cuff) {
      shapes.push(...limb(side, spec.reach - 0.16, spec.reach, spec.cuff, spec.width * 0.78));
      shapes.push(armRing(side, spec.reach - 0.16, spec.width * 0.4, darken(spec.cuff, 0.35), 1, 0.5));
    }
    if (short) {
      shapes.push(armRing(side, spec.reach, spec.width * 0.47, darken(spec.color, 0.4), 1.1, 0.45));
    }
  }
  return shapes;
}

// ---- Roupas ----
interface TopParts {
  // Atrás do pescoço: corpo da roupa e o que fica atrás da cabeça.
  under: Shape[];
  // Na frente do pescoço: gola, botões, bolsos.
  over: Shape[];
  arms: Shape[];
}

const TORSO_SLIM =
  "M29 87 C29 79 39 76.5 50 76.5 C61 76.5 71 79 71 87 L72 124 C64 128 36 128 28 124 Z";
const TORSO_WIDE =
  "M23 90 C23 80 35 77 50 77 C65 77 77 80 77 90 L78.6 126 C67 130 33 130 21.4 126 Z";

// Gola do casaco: capuz com borda de pelo, que desce dos dois lados do rosto
// em V até o zíper, sobre uma gola alta de tricô. Devolve a gola de tricô (vai
// por cima do pescoço) e os tufos (por cima dela).
function furTrim(): { knit: Shape[]; fur: Shape[] } {
  const base = "#F2E8D8";
  const p0: Pt = [24, 78.6];
  const p1: Pt = [30, 92];
  const p2: Pt = [48.4, 93.4];
  const count = 9;
  const fur: Shape[] = [];
  for (const side of SIDES) {
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const mt = 1 - t;
      const x = mt * mt * p0[0] + 2 * mt * t * p1[0] + t * t * p2[0];
      const y = mt * mt * p0[1] + 2 * mt * t * p1[1] + t * t * p2[1];
      const r = 5.4 - t * 1.2;
      fur.push({ t: "circle", cx: rnd(side === -1 ? x : 100 - x), cy: rnd(y), r: rnd(r), fill: volume(i % 2 ? darken(base, 0.05) : base, 0.6) });
    }
  }
  const knit: Shape[] = [
    { t: "path", d: "M38.4 73 Q50 84 61.6 73 L60.4 90 Q50 96 39.6 90 Z", fill: volume("#D8D1C7", 0.7) },
    { t: "path", d: "M41 78 L40.6 90 M46 81 L45.6 93 M54 81 L54.4 93 M59 78 L59.4 90", stroke: darken("#D8D1C7", 0.3), sw: 0.9, op: 0.4 },
  ];
  return { knit, fur };
}

function topParts(id: string, skin: string): TopParts {
  const color = TOP_COLORS[id] ?? TOP_COLORS[DEFAULT_LOOK.top];
  const inside = darken(skin, 0.22);
  const hem = (y: number, dark = 0.4): Shape => ({
    t: "path",
    d: `M28.4 ${y} Q50 ${y + 5} 71.6 ${y}`,
    stroke: darken(color, dark),
    sw: 1.1,
    op: 0.32,
  });
  const bodyOf = (d: string, strength = 0.9): Shape => ({ t: "path", d, fill: volume(color, strength) });
  const shade: Shape = { t: "ellipse", cx: 50, cy: 126, rx: 21, ry: 5, fill: soft("#000000", 0.22) };
  const roundNeck: Shape = { t: "path", d: "M40 77.2 Q50 89 60 77.2 Z", fill: inside };
  const vNeck: Shape = { t: "path", d: "M43 77.2 L50 92 L57 77.2 Z", fill: inside };
  const glow = (cx: number, cy: number): Shape => ({ t: "ellipse", cx, cy, rx: 10, ry: 5, fill: soft("#FFFFFF", 0.26) });

  switch (id) {
    case "tp-puffer": {
      const trim = furTrim();
      const dark = darken(color, 0.42);
      const light = lighten(color, 0.4);
      const snap = (y: number): Shape[] => [
        { t: "circle", cx: 50, cy: y, r: 1.9, fill: "#6E3418" },
        { t: "circle", cx: 49.5, cy: y - 0.6, r: 0.7, fill: "#FFFFFF", op: 0.55 },
      ];
      return {
        under: [
          bodyOf(TORSO_WIDE, 1),
          shade,
          // gomos do acolchoado
          { t: "path", d: "M23 100 Q50 105 77 100", stroke: dark, sw: 1.4, op: 0.42 },
          { t: "path", d: "M22.4 111 Q50 116 77.6 111", stroke: dark, sw: 1.4, op: 0.42 },
          { t: "path", d: "M21.8 121 Q50 126 78.2 121", stroke: dark, sw: 1.4, op: 0.42 },
          { t: "path", d: "M25 93.5 Q50 98.5 75 93.5", stroke: light, sw: 1.6, op: 0.28 },
          { t: "path", d: "M23.6 105.6 Q50 110.6 76.4 105.6", stroke: light, sw: 1.6, op: 0.26 },
          { t: "path", d: "M22.6 116 Q50 121 77.4 116", stroke: light, sw: 1.6, op: 0.22 },
        ],
        over: [
          ...trim.knit,
          ...trim.fur,
          // zíper e botões de pressão
          { t: "path", d: "M50 94 L50 129", stroke: dark, sw: 1.2, op: 0.55 },
          ...snap(100),
          ...snap(110),
          ...snap(120),
          // bolsos de aba inclinada
          { t: "path", d: "M36 108 Q31.5 116 30 124", stroke: dark, sw: 1.6, op: 0.55 },
          { t: "path", d: "M64 108 Q68.5 116 70 124", stroke: dark, sw: 1.6, op: 0.55 },
          { t: "path", d: "M37.6 109 Q33 117 31.6 125", stroke: light, sw: 1, op: 0.3 },
        ],
        arms: [
          ...armShapes(skin, { color, reach: 1.94, width: 12.8, cuff: "#B9B4AE", quilt: true }),
          // remendo preto na manga, no ombro direito
          { t: "rect", x: 78.4, y: 94, w: 5, h: 7, rx: 1.3, fill: "#2A2626" },
          { t: "path", d: "M79.6 96.4 L82.2 96.4 M79.6 98.6 L82.2 98.6", stroke: "#C9C2BA", sw: 0.7, op: 0.7 },
        ],
      };
    }
    case "tp-hoodie-blue": {
      const dark = darken(color, 0.4);
      return {
        under: [
          { t: "path", d: "M24 90 C24 66 76 66 76 90 Z", fill: darken(color, 0.32) },
          bodyOf("M27 88 C27 79 38 76.5 50 76.5 C62 76.5 73 79 73 88 L74.6 125 C65 129 35 129 25.4 125 Z"),
          shade,
          glow(36, 92),
        ],
        over: [
          { t: "path", d: "M40 77.6 Q50 89 60 77.6 Z", fill: inside },
          // bolso canguru
          { t: "path", d: "M31 108 Q50 104 69 108 L72 124 Q50 128 28 124 Z", fill: volume(darken(color, 0.06), 0.8) },
          { t: "path", d: "M31 108 Q50 104 69 108", stroke: dark, sw: 1.2, op: 0.5 },
          { t: "path", d: "M38 114 L36 124 M62 114 L64 124", stroke: dark, sw: 1, op: 0.3 },
          // cordões
          { t: "path", d: "M45 84 L44 100", stroke: "#F2F2F7", sw: 1.8 },
          { t: "path", d: "M55 84 L56 100", stroke: "#F2F2F7", sw: 1.8 },
          { t: "circle", cx: 44, cy: 101, r: 1.4, fill: "#F2F2F7" },
          { t: "circle", cx: 56, cy: 101, r: 1.4, fill: "#F2F2F7" },
        ],
        arms: armShapes(skin, { color, reach: 1.94, width: 12.6, cuff: darken(color, 0.22) }),
      };
    }
    case "tp-jacket": {
      const rib = "#34343E";
      return {
        under: [
          bodyOf(TORSO_SLIM),
          shade,
          glow(38, 93),
          { t: "path", d: "M28.2 119 Q50 124 71.8 119 L72 124 C64 128 36 128 28 124 Z", fill: rib },
        ],
        over: [
          vNeck,
          { t: "path", d: "M50 92 L50 127", stroke: "#B0B0BC", sw: 1.4 },
          { t: "rect", x: 48.8, y: 98, w: 2.4, h: 4.6, rx: 1, fill: "#D9D9E2" },
          { t: "path", d: "M35 82 L45 77.6 L50 92 L39 96 Z", fill: volume("#3C3C46") },
          { t: "path", d: "M65 82 L55 77.6 L50 92 L61 96 Z", fill: volume("#3C3C46") },
          { t: "path", d: "M33 108 L39 107 M67 108 L61 107", stroke: "#B0B0BC", sw: 1.1, op: 0.55 },
        ],
        arms: armShapes(skin, { color, reach: 1.94, width: 12.6, cuff: rib }),
      };
    }
    case "tp-shirt": {
      const edge = "#CFCFD8";
      return {
        under: [bodyOf(TORSO_SLIM), shade, glow(38, 93)],
        over: [
          vNeck,
          { t: "path", d: "M40 77 L50 90 L37 95 Z", fill: "#FFFFFF" },
          { t: "path", d: "M60 77 L50 90 L63 95 Z", fill: "#FFFFFF" },
          { t: "path", d: "M40 77 L50 90 L37 95", stroke: edge, sw: 0.8 },
          { t: "path", d: "M60 77 L50 90 L63 95", stroke: edge, sw: 0.8 },
          { t: "path", d: "M50 91 L50 127", stroke: edge, sw: 0.9 },
          { t: "circle", cx: 50, cy: 99, r: 1.2, fill: "#B5B5BF" },
          { t: "circle", cx: 50, cy: 109, r: 1.2, fill: "#B5B5BF" },
          { t: "circle", cx: 50, cy: 119, r: 1.2, fill: "#B5B5BF" },
          hem(123, 0.25),
        ],
        arms: armShapes(skin, { color, reach: 1.94, width: 12.4, cuff: "#E3E3EA" }),
      };
    }
    case "tp-blazer": {
      const lapel = "#3A4E78";
      return {
        under: [bodyOf(TORSO_SLIM), shade, glow(38, 93)],
        over: [
          { t: "path", d: "M43 77.2 L50 128 L57 77.2 Z", fill: "#F2F2F7" },
          { t: "path", d: "M41 77 L29 93 L42 105 L50 96 Z", fill: volume(lapel) },
          { t: "path", d: "M59 77 L71 93 L58 105 L50 96 Z", fill: volume(lapel) },
          { t: "path", d: "M50 100 L50 128", stroke: darken(color, 0.4), sw: 1, op: 0.5 },
          { t: "circle", cx: 50, cy: 111, r: 1.4, fill: "#8090B4" },
          { t: "rect", x: 57, y: 105, w: 8, h: 1.8, rx: 0.9, fill: darken(color, 0.4), op: 0.5 },
          { t: "path", d: "M59 105 L60.4 101.6 L62.4 105 Z", fill: "#F2F2F7" },
        ],
        arms: armShapes(skin, { color, reach: 1.94, width: 12.6, cuff: "#F2F2F7" }),
      };
    }
    case "tp-tux":
      return {
        under: [bodyOf(TORSO_SLIM), shade, glow(38, 93)],
        over: [
          { t: "path", d: "M43 77.2 L50 128 L57 77.2 Z", fill: "#F6F6FA" },
          { t: "path", d: "M41 77 L30 93 L42 106 L50 97 Z", fill: volume("#2E2E38") },
          { t: "path", d: "M59 77 L70 93 L58 106 L50 97 Z", fill: volume("#2E2E38") },
          { t: "path", d: "M50 89 L41 85 L41 93 Z", fill: volume("#BC3F50") },
          { t: "path", d: "M50 89 L59 85 L59 93 Z", fill: volume("#BC3F50") },
          { t: "circle", cx: 50, cy: 89, r: 2.4, fill: "#8E2E3A" },
          { t: "circle", cx: 50, cy: 106, r: 1.3, fill: "#B5B5BF" },
        ],
        arms: armShapes(skin, { color, reach: 1.94, width: 12.6, cuff: "#F2F2F7" }),
      };
    default:
      // Camisetas
      return {
        under: [bodyOf(TORSO_SLIM), shade, glow(38, 93), hem(121)],
        over: [roundNeck, { t: "path", d: "M40 77.2 Q50 89 60 77.2", stroke: darken(color, 0.25), sw: 1.2, op: 0.5 }],
        arms: armShapes(skin, { color, reach: 0.62, width: 13 }),
      };
  }
}

// ---- Calças ----
// Duas pernas de y=126 (escondidas sob a barra da roupa) até o tornozelo em
// y=160. A perna esquerda é desenhada e a direita vem por espelho; o brilho
// fica sempre do lado esquerdo de cada perna (a luz vem de cima à esquerda).
const LEG_L = "M31 118 L50.4 118 L49.2 160 L32.2 160 Z";
const LEG_R = "M49.6 118 L69 118 L67.8 160 L50.8 160 Z";

const legFill = (color: string): Gradient => ({
  k: "linear",
  x1: 0,
  y1: 0,
  x2: 1,
  y2: 0,
  stops: [[0, lighten(color, 0.16)], [0.45, color], [1, darken(color, 0.32)]],
});

function bottomShapes(id: string, skin: string): Shape[] {
  const color = BOTTOM_COLORS[id] ?? BOTTOM_COLORS[DEFAULT_LOOK.bottom];
  const seam: Shape = { t: "path", d: "M50 128 L50 160", stroke: darken(color, 0.6), sw: 0.9, op: 0.4 };
  const thigh = (cx: number): Shape => ({ t: "ellipse", cx, cy: 140, rx: 4.6, ry: 12, fill: soft("#FFFFFF", 0.14) });
  const legs = (leftFill: Paint, rightFill: Paint): Shape[] => [
    { t: "path", d: LEG_L, fill: leftFill },
    { t: "path", d: LEG_R, fill: rightFill },
  ];
  const plain = legs(legFill(color), legFill(color));

  switch (id) {
    case "bt-shorts": {
      const legSkin = legFill(skin);
      const hemBand = (d: string): Shape => ({ t: "path", d, fill: legFill(darken(color, 0.1)) });
      return [
        { t: "path", d: "M32.2 138 L49.2 138 L48.6 160 L32.8 160 Z", fill: legSkin },
        { t: "path", d: "M50.8 138 L67.8 138 L67.2 160 L51.4 160 Z", fill: legSkin },
        { t: "path", d: "M30.4 126 L50.4 126 L49.6 146 L29.8 146 Z", fill: legFill(color) },
        { t: "path", d: "M49.6 126 L69.6 126 L70.2 146 L50.4 146 Z", fill: legFill(color) },
        hemBand("M29.8 143 L49.6 143 L49.4 146 L29.6 146 Z"),
        hemBand("M50.4 143 L70.4 143 L70.2 146 L50.6 146 Z"),
        { t: "path", d: "M31 145.4 L49.4 145.4", stroke: darken(color, 0.4), sw: 0.9, op: 0.35 },
        { t: "path", d: "M50.6 145.4 L69 145.4", stroke: darken(color, 0.4), sw: 0.9, op: 0.35 },
        seam,
      ];
    }
    case "bt-cargo":
      return [
        ...plain,
        thigh(38),
        thigh(57),
        // bolso lateral de carga
        { t: "path", d: "M31 138 L37.6 138 L37.6 148 L30.6 148 Z", fill: darken(color, 0.1), stroke: darken(color, 0.4), sw: 0.9 },
        { t: "path", d: "M31 141 L37.6 141", stroke: darken(color, 0.4), sw: 0.8, op: 0.6 },
        { t: "path", d: "M69 138 L62.4 138 L62.4 148 L69.4 148 Z", fill: darken(color, 0.16), stroke: darken(color, 0.45), sw: 0.9 },
        { t: "path", d: "M69 141 L62.4 141", stroke: darken(color, 0.45), sw: 0.8, op: 0.6 },
        seam,
        { t: "path", d: "M32.2 157.6 L49.2 157.6 M50.8 157.6 L67.8 157.6", stroke: darken(color, 0.4), sw: 1.1, op: 0.4 },
      ];
    case "bt-slacks":
      return [
        ...plain,
        // vinco do vinco de alfaiataria
        { t: "path", d: "M40.6 134 L40.4 158", stroke: lighten(color, 0.34), sw: 1, op: 0.45 },
        { t: "path", d: "M59.6 134 L59.4 158", stroke: lighten(color, 0.34), sw: 1, op: 0.35 },
        seam,
        { t: "path", d: "M32.2 158 L49.2 158 M50.8 158 L67.8 158", stroke: darken(color, 0.5), sw: 1.2, op: 0.4 },
      ];
    case "bt-black":
      return [...plain, thigh(38), thigh(57), seam, { t: "path", d: "M32.4 156 L49.2 156 M50.8 156 L67.6 156", stroke: darken(color, 0.5), sw: 1, op: 0.3 }];
    default: {
      // Jeans com a barra dobrada mostrando o avesso mais claro.
      const cuffColor = lighten(color, 0.42);
      const cuff = (d: string): Shape => ({ t: "path", d, fill: legFill(cuffColor) });
      return [
        ...plain,
        thigh(38),
        thigh(57),
        { t: "path", d: "M40.6 132 L40.2 150 M59.4 132 L59.8 150", stroke: lighten(color, 0.3), sw: 0.9, op: 0.28 },
        seam,
        cuff("M31.8 150 L50.4 150 L49.2 160 L32.2 160 Z"),
        cuff("M49.6 150 L68.2 150 L67.8 160 L50.8 160 Z"),
        { t: "path", d: "M31.8 150 L50.4 150 M49.6 150 L68.2 150", stroke: darken(color, 0.35), sw: 1.3, op: 0.55 },
        { t: "path", d: "M32.4 152.4 L50 152.4 M50 152.4 L67.6 152.4", stroke: lighten(cuffColor, 0.2), sw: 0.6, op: 0.6 },
        { t: "path", d: "M32.2 158.8 L49.2 158.8 M50.8 158.8 L67.8 158.8", stroke: darken(color, 0.3), sw: 1.4, op: 0.3 },
      ];
    }
  }
}

// ---- Calçados ----
function mirrorPath(d: string): string {
  return d.replace(/(-?\d*\.?\d+) (-?\d*\.?\d+)/g, (_match, x: string, y: string) => `${rnd(100 - Number(x))} ${y}`);
}

function mirrorShape(shape: Shape): Shape {
  switch (shape.t) {
    case "path":
      return { ...shape, d: mirrorPath(shape.d) };
    case "circle":
    case "ellipse":
      return { ...shape, cx: rnd(100 - shape.cx) };
    case "rect":
      return { ...shape, x: rnd(100 - shape.x - shape.w) };
  }
}

const shoeFill = (color: string): Gradient => ({
  k: "linear",
  x1: 0,
  y1: 0,
  x2: 1,
  y2: 1,
  stops: [[0, lighten(color, 0.22)], [0.55, color], [1, darken(color, 0.34)]],
});

// Sapato esquerdo (o direito vem por espelho): ponta pra esquerda, boca em y=158.
function leftShoe(id: string): Shape[] {
  const color = SHOE_COLORS[id] ?? SHOE_COLORS[DEFAULT_LOOK.shoes];
  const sole = (fill: string, d = "M25.4 173.4 C25.6 177.6 29 179.6 34 179.6 L44 179.6 C48.6 179.6 51.2 177.6 51.2 173.6 L51.2 176.4 C51.2 180 47.6 181.6 43 181.6 L33 181.6 C28 181.6 25 179.4 25.2 175.6 Z"): Shape => ({ t: "path", d, fill });

  switch (id) {
    case "sh-boots": {
      const dark = darken(color, 0.4);
      return [
        sole("#3A2A22"),
        { t: "path", d: "M32.2 158 L49 158 C50 165 51 171 51 174 C51 178.6 47.4 180 41.4 180 L31.4 180 C26 180 24.4 176 26.6 172.8 C29.2 169.6 31.6 167 32 163 Z", fill: shoeFill(color) },
        // biqueira e cano
        { t: "path", d: "M26.6 172.8 C29.6 170.6 34.6 170.4 38 172.6 C41 174.4 46 174 51 173.4 L51 175 C46 176 41 176.4 38 175 C33 173 29 174 25.8 176 Z", fill: darken(color, 0.16), op: 0.55 },
        { t: "path", d: "M32.2 158 L49 158", stroke: lighten(color, 0.4), sw: 2.2, op: 0.7 },
        // cadarço
        { t: "path", d: "M34 162 L47 162 M34.4 165.6 L47.4 165.6 M34.8 169 L47.8 169", stroke: lighten(color, 0.45), sw: 1, op: 0.75 },
        { t: "path", d: "M40.4 160 L40.6 170", stroke: dark, sw: 0.9, op: 0.5 },
        { t: "path", d: "M28.6 176.4 Q34 178.6 44 178.2", stroke: "#FFFFFF", sw: 1.1, op: 0.18 },
      ];
    }
    case "sh-dress": {
      return [
        sole("#0C0A0B"),
        { t: "path", d: "M32.6 158 L48.8 158 C49.6 164 50.4 168 50.6 171.6 C50.8 176.6 47.4 178.8 42.4 178.8 L33 178.8 C27.4 178.8 24.8 175.6 27 172.6 C29.6 169.2 31.8 166.4 32.2 162 Z", fill: shoeFill(color) },
        { t: "path", d: "M28.4 173.6 C31 171.4 36 171.4 39 173.4", stroke: "#FFFFFF", sw: 1.5, op: 0.42 },
        { t: "path", d: "M34 163 L47 163.6 M34.4 166.4 L47.4 167", stroke: "#0C0A0B", sw: 1, op: 0.7 },
        { t: "ellipse", cx: 33, cy: 175.4, rx: 4.4, ry: 1.2, fill: soft("#FFFFFF", 0.4) },
      ];
    }
    default: {
      // Tênis (branco, preto, vermelho, dourado)
      const white = id === "sh-white";
      const trim = white ? "#D24A4A" : id === "sh-gold" ? "#FFF3B8" : "#F1F1F5";
      const sole2 = white ? "#D9D9E0" : id === "sh-gold" ? "#B8862A" : "#EDEDF2";
      return [
        sole(sole2),
        { t: "path", d: "M32.4 158 L49 158 C49.8 164 50.6 169 50.8 172.6 C51 177 47.6 178.8 42 178.8 L32 178.8 C26.4 178.8 24.6 175.2 26.6 172.2 C29 169 31.6 167 32 162 Z", fill: shoeFill(color) },
        { t: "path", d: "M27.2 172.6 C30.4 169.4 36 169.4 39.4 172.2 C42.4 174.4 46.6 173.8 51 172.4 L51 174.4 C46.4 175.4 42 175.8 38.8 174.4 C34.6 172.6 30.4 173 26.6 175.4 Z", fill: trim, op: 0.55 },
        { t: "path", d: "M32.4 158 L49 158", stroke: darken(color, white ? 0.16 : 0.3), sw: 2.4, op: 0.7 },
        { t: "path", d: "M34.4 163 L47.6 163 M34.8 166.4 L47.8 166.4", stroke: trim, sw: 1, op: 0.9 },
        { t: "path", d: "M29 177 Q34 179 44 178.4", stroke: "#FFFFFF", sw: 1, op: white ? 0.5 : 0.22 },
      ];
    }
  }
}

function shoeShapes(id: string): Shape[] {
  const left = leftShoe(id);
  return [...left, ...left.map(mirrorShape)];
}

// Olho de brinquedo: abertura amendoada quase do tamanho da íris (pouco
// branco), íris com anel escuro e gradiente, pupila, reflexos grandes, sombra
// da pálpebra e uma linha fina de cílios. Coordenadas do olho esquerdo
// (centro 38), deslocadas pro direito.
function eye(cx: number, side: -1 | 1, iris: string): Shape[] {
  const x = (v: number) => cx + (v - 38);
  const outer = cx + side * 6.1;
  const opening = `M${x(32.2)} 51 C${x(32.6)} 45 ${x(43.4)} 45 ${x(43.8)} 51 C${x(43.4)} 57 ${x(32.6)} 57 ${x(32.2)} 51 Z`;
  return [
    { t: "path", d: opening, fill: { k: "linear", x1: 0, y1: 0, x2: 0, y2: 1, stops: [[0, "#E4DEDD"], [0.35, "#F8F5F4"], [1, "#FFFFFF"]] } },
    { t: "circle", cx, cy: 51, r: 4.5, fill: { k: "radial", cx: 0.5, cy: 0.35, r: 0.8, stops: [[0, lighten(iris, 0.45)], [0.55, iris], [1, darken(iris, 0.5)]] }, stroke: darken(iris, 0.6), sw: 0.6 },
    { t: "circle", cx, cy: 51, r: 2.2, fill: INK },
    { t: "ellipse", cx: cx + 1.8, cy: 49.2, rx: 1.8, ry: 2, fill: "#FFFFFF" },
    { t: "circle", cx: cx - 1.7, cy: 53.2, r: 0.9, fill: "#FFFFFF", op: 0.8 },
    { t: "ellipse", cx, cy: 47, rx: 5.2, ry: 1.6, fill: soft("#000000", 0.3) },
    { t: "path", d: `M${x(32)} 51 C${x(32.6)} 44.4 ${x(43.4)} 44.4 ${x(44)} 51`, stroke: INK, sw: 1.5 },
    { t: "path", d: `M${outer} 50.6 L${outer + side * 1.3} 49.4`, stroke: INK, sw: 1.1 },
  ];
}

// Sobrancelha fina e macia (mais grossa perto do nariz).
function brow(cx: number, side: -1 | 1, color: string): Shape {
  const x = (v: number) => (side === -1 ? cx + (v - 38) : cx - (v - 38));
  return {
    t: "path",
    d: `M${x(45)} 40.2 C${x(41.6)} 37.2 ${x(36)} 37.2 ${x(32.2)} 40.6 C${x(32)} 41.4 ${x(32.7)} 41.7 ${x(33.2)} 41.2 C${x(36.4)} 38.8 ${x(41)} 38.8 ${x(44.8)} 41.6 Z`,
    fill: color,
    op: 0.8,
  };
}

function closedEye(cx: number, happy: boolean): Shape[] {
  return [
    { t: "path", d: happy ? `M${cx - 5.6} 51.4 Q${cx} 45 ${cx + 5.6} 51.4` : `M${cx - 5.6} 50.6 Q${cx} 56.4 ${cx + 5.6} 50.6`, stroke: INK, sw: 2 },
  ];
}

function mouth(skin: string, mood: string): Shape[] {
  const lipLine = rosy(skin, 0.7);
  const dimples: Shape[] = [
    { t: "path", d: "M43.4 62.4 Q43.8 63.6 44.7 63.9", stroke: darken(skin, 0.4), sw: 0.8, op: 0.35 },
    { t: "path", d: "M56.6 62.4 Q56.2 63.6 55.3 63.9", stroke: darken(skin, 0.4), sw: 0.8, op: 0.35 },
  ];

  switch (mood) {
    case "md-cool":
      return [
        { t: "path", d: "M45 64.4 Q50.4 65.6 55.6 62.8", stroke: lipLine, sw: 1.9 },
        { t: "ellipse", cx: 50.4, cy: 65.8, rx: 2.4, ry: 0.8, fill: "#FFFFFF", op: 0.2 },
      ];
    case "md-wink":
      return [
        { t: "path", d: "M44 63.4 Q50.4 68.4 56.4 62.6", stroke: lipLine, sw: 1.9 },
        { t: "ellipse", cx: 50.4, cy: 66.3, rx: 2.6, ry: 0.85, fill: "#FFFFFF", op: 0.24 },
      ];
    case "md-laugh":
      return [
        { t: "path", d: "M42.6 61.8 Q50 75 57.4 61.8 Q50 60 42.6 61.8 Z", fill: "#5B1F27" },
        { t: "ellipse", cx: 50, cy: 67, rx: 4.2, ry: 2.2, fill: "#E2707C" },
        { t: "path", d: "M44 62.4 Q50 60.8 56 62.4 L55.5 64.4 Q50 63 44.5 64.4 Z", fill: "#FFFFFF" },
      ];
    default:
      return [
        { t: "path", d: "M44.2 63.2 Q50 67.6 55.8 63.2", stroke: lipLine, sw: 1.9 },
        { t: "ellipse", cx: 50, cy: 66, rx: 2.6, ry: 0.85, fill: "#FFFFFF", op: 0.24 },
        ...dimples,
      ];
  }
}

// Cores de cabelo "de verdade": a sobrancelha acompanha. Nas fantasia (azul,
// rosa, roxo, verde) a sobrancelha fica castanho-escura, senão parece pintada.
const NATURAL_HAIR = ["hc-black", "hc-brown", "hc-blond", "hc-red", "hc-gray"];

function faceShapes(mood: string, skin: string, iris: string, browColor: string): Shape[] {
  const deep = darken(skin, 0.45);
  const blush = rosy(skin, 0.5);
  const cheeks: Shape[] = [
    { t: "ellipse", cx: 31, cy: 60.5, rx: 6.6, ry: 4.6, fill: soft(blush, 0.26) },
    { t: "ellipse", cx: 69, cy: 60.5, rx: 6.6, ry: 4.6, fill: soft(blush, 0.26) },
  ];
  const nose: Shape[] = [
    { t: "ellipse", cx: 50, cy: 57.6, rx: 2.8, ry: 2.2, fill: soft("#FFFFFF", 0.28) },
    { t: "ellipse", cx: 50, cy: 60, rx: 3.8, ry: 1.2, fill: soft(deep, 0.2) },
  ];
  const brows = [brow(38, -1, browColor), brow(62, 1, browColor)];

  switch (mood) {
    case "md-cool": {
      const lid = (x0: number): Shape => ({
        t: "path",
        d: `M${x0} 51 C${x0 + 0.4} 44.4 ${x0 + 11.2} 44.4 ${x0 + 11.6} 51 C${x0 + 9.6} 49.2 ${x0 + 2} 49.2 ${x0} 51 Z`,
        fill: skin,
      });
      return [
        ...cheeks,
        ...brows,
        ...eye(38, -1, iris),
        ...eye(62, 1, iris),
        lid(32.2),
        lid(56.2),
        { t: "path", d: "M32.2 51 C34 49.2 42 49.2 43.8 51", stroke: INK, sw: 1.7 },
        { t: "path", d: "M56.2 51 C58 49.2 66 49.2 67.8 51", stroke: INK, sw: 1.7 },
        ...nose,
        ...mouth(skin, mood),
      ];
    }
    case "md-wink":
      return [...cheeks, ...brows, ...eye(38, -1, iris), ...closedEye(62, false), ...nose, ...mouth(skin, mood)];
    case "md-laugh":
      return [...cheeks, ...brows, ...closedEye(38, true), ...closedEye(62, true), ...nose, ...mouth(skin, mood)];
    default:
      return [...cheeks, ...brows, ...eye(38, -1, iris), ...eye(62, 1, iris), ...nose, ...mouth(skin, mood)];
  }
}

function accessoryShapes(id: string): Shape[] {
  switch (id) {
    case "ac-glasses":
      return [
        { t: "circle", cx: 38, cy: 50, r: 9.2, stroke: "#2A2A32", sw: 1.7, fill: "#FFFFFF", op: 0.14 },
        { t: "circle", cx: 62, cy: 50, r: 9.2, stroke: "#2A2A32", sw: 1.7, fill: "#FFFFFF", op: 0.14 },
        { t: "path", d: "M47.2 49 Q50 46.6 52.8 49", stroke: "#2A2A32", sw: 1.7 },
        { t: "path", d: "M28.9 48.6 L23.5 46.6", stroke: "#2A2A32", sw: 1.6 },
        { t: "path", d: "M71.1 48.6 L76.5 46.6", stroke: "#2A2A32", sw: 1.6 },
        shine("M31.5 46 Q33 43.6 36 43", 1.5, 0.5),
      ];
    case "ac-shades":
      return [
        { t: "path", d: "M27.5 44 L47.5 44 L47.5 52 Q47.5 59.5 41 59.5 L34 59.5 Q27.5 59.5 27.5 52 Z", fill: { k: "linear", x1: 0, y1: 0, x2: 1, y2: 1, stops: [[0, "#3A3A46"], [1, "#0E0E12"]] } },
        { t: "path", d: "M52.5 44 L72.5 44 L72.5 52 Q72.5 59.5 66 59.5 L59 59.5 Q52.5 59.5 52.5 52 Z", fill: { k: "linear", x1: 0, y1: 0, x2: 1, y2: 1, stops: [[0, "#3A3A46"], [1, "#0E0E12"]] } },
        { t: "path", d: "M47.5 46.4 L52.5 46.4", stroke: "#0E0E12", sw: 2.2 },
        { t: "path", d: "M27.5 46 L23.5 45", stroke: "#0E0E12", sw: 1.7 },
        { t: "path", d: "M72.5 46 L76.5 45", stroke: "#0E0E12", sw: 1.7 },
        shine("M31 48 L37 46", 1.5, 0.45),
      ];
    case "ac-cap":
      return [
        { t: "path", d: "M22 32 C22 9 38 2 50 2 C62 2 78 9 78 32 Z", fill: volume("#C9594B") },
        { t: "path", d: "M19 31 Q50 41 81 31 L81 35 Q50 46 19 35 Z", fill: volume("#8E3B32") },
        { t: "circle", cx: 50, cy: 2.5, r: 2.6, fill: "#8E3B32" },
        shine("M31 17 Q38 8 50 7", 2.2, 0.34),
      ];
    case "ac-headphones":
      return [
        { t: "path", d: "M23 50 C19 4 81 4 77 50", stroke: "#5F5F72", sw: 5 },
        { t: "rect", x: 16, y: 41, w: 11, h: 21, rx: 5.5, fill: volume("#454556"), stroke: "#4FC3F7", sw: 1.6 },
        { t: "rect", x: 73, y: 41, w: 11, h: 21, rx: 5.5, fill: volume("#454556"), stroke: "#4FC3F7", sw: 1.6 },
      ];
    case "ac-fedora":
      return [
        { t: "ellipse", cx: 50, cy: 29, rx: 35, ry: 7.5, fill: volume("#4A3B34") },
        { t: "path", d: "M31 29 C31 5 69 5 69 29 Z", fill: volume("#5A4840") },
        { t: "rect", x: 31, y: 22, w: 38, h: 5.5, fill: "#EDB84F" },
        shine("M38 14 Q46 8 56 9", 2, 0.3),
      ];
    case "ac-crown":
      return [
        { t: "path", d: "M27 30 L31 9 L41 22 L50 5 L59 22 L69 9 L73 30 Z", fill: { k: "linear", x1: 0, y1: 0, x2: 0, y2: 1, stops: [[0, "#FFE58A"], [1, "#E0A82A"]] }, stroke: "#B8860B", sw: 1.1 },
        { t: "circle", cx: 50, cy: 21, r: 2.6, fill: "#D9485A" },
        { t: "circle", cx: 37, cy: 23, r: 1.9, fill: "#5AA9E6" },
        { t: "circle", cx: 63, cy: 23, r: 1.9, fill: "#5AA9E6" },
      ];
    default:
      return [];
  }
}

// Acessórios que cobrem o topo da cabeça: o cabelo da frente não aparece por baixo.
const HIDES_FRONT_HAIR = ["ac-cap", "ac-fedora"];

const HEAD = "M50 16 C67 16 78 29 78 45 C78 57 71 68 59 73 C55 74.6 45 74.6 41 73 C29 68 22 57 22 45 C22 29 33 16 50 16 Z";

// Camadas de trás pra frente: sombra no chão → cabelo de trás → calça e
// calçado → corpo da roupa → pescoço → gola e detalhes → braços → sombra sob
// a cabeça → orelhas → cabeça (com sombra do maxilar e brilho da testa) →
// rosto → cabelo da frente → acessório. `lowerBody = false` pula o que fica
// abaixo do busto (calça, calçado, chão) — os avatares pequenos não mostram.
export function buildCharacter(look: Look, lowerBody = true): Shape[] {
  const skin = SKIN_COLORS[look.skin] ?? SKIN_COLORS[DEFAULT_LOOK.skin];
  const hair = HAIR_COLORS[look.hairColor] ?? HAIR_COLORS[DEFAULT_LOOK.hairColor];
  const iris = EYE_COLORS[look.eyes] ?? EYE_COLORS[DEFAULT_LOOK.eyes];
  const top = topParts(look.top, skin);

  return [
    ...(lowerBody ? [{ t: "ellipse", cx: 50, cy: 180, rx: 30, ry: 3.4, fill: soft("#000000", 0.5) } as Shape] : []),
    ...hairBack(look.hair, hair),
    ...(lowerBody ? [...bottomShapes(look.bottom, skin), ...shoeShapes(look.shoes)] : []),
    ...top.under,
    {
      t: "rect", x: 43, y: 66, w: 14, h: 18, rx: 7,
      fill: { k: "linear", x1: 0, y1: 0, x2: 0, y2: 1, stops: [[0, darken(skin, 0.2)], [1, darken(skin, 0.08)]] },
    },
    ...top.over,
    ...top.arms,
    { t: "ellipse", cx: 50, cy: 77, rx: 20, ry: 4.6, fill: "#000000", op: 0.1 },
    { t: "ellipse", cx: 22.6, cy: 51, rx: 4.6, ry: 6.8, fill: volume(skin, 0.6) },
    { t: "ellipse", cx: 77.4, cy: 51, rx: 4.6, ry: 6.8, fill: volume(skin, 0.6) },
    { t: "ellipse", cx: 23.6, cy: 51.4, rx: 2, ry: 3.8, fill: darken(skin, 0.3), op: 0.5 },
    { t: "ellipse", cx: 76.4, cy: 51.4, rx: 2, ry: 3.8, fill: darken(skin, 0.3), op: 0.5 },
    { t: "path", d: HEAD, fill: volume(skin) },
    { t: "path", d: HEAD, fill: { k: "linear", x1: 0, y1: 0, x2: 0, y2: 1, stops: [[0, "#000000", 0], [0.66, "#000000", 0], [1, "#000000", 0.15]] } },
    { t: "ellipse", cx: 43, cy: 27, rx: 12, ry: 6.5, fill: soft("#FFFFFF", 0.26) },
    ...faceShapes(look.mood, skin, iris, NATURAL_HAIR.includes(look.hairColor) ? darken(hair, 0.15) : "#3B2A22"),
    ...(HIDES_FRONT_HAIR.includes(look.accessory) ? [] : hairFront(look.hair, hair)),
    ...accessoryShapes(look.accessory),
  ];
}
