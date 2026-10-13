import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DataTexture,
  DoubleSide,
  Float32BufferAttribute,
  LinearFilter,
  Group,
  LatheGeometry,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  RGBAFormat,
  Vector2,
  Vector3,
} from "three";

export const rad = (deg: number) => (deg * Math.PI) / 180;
export const Z_AXIS = new Vector3(0, 0, 1);

// Disco com borda esmaecida (alfa em degradê), usado no blush, nas sombras
// suaves e no halo do fundo. É um DataTexture — sem canvas, funciona igual no
// celular.
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
  // O padrão do DataTexture é NearestFilter (pixelado); a borda esmaecida precisa de filtro linear.
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

// Guarda o que foi criado pra liberar de uma vez quando o look muda. A cabeça
// (crânio, rosto, cabelo, acessórios) fica num grupo à parte, que é reduzido em
// torno do pescoço pra acertar a proporção com o corpo.
export class Kit {
  readonly root = new Group();
  readonly head = new Group();
  // Torso e braços: modelados na escala original e depois afinados/esticados até as
  // proporções de gente (ver body.ts). O resto do corpo fica direto em kit.root.
  readonly upper = new Group();
  private readonly geometries: BufferGeometry[] = [];
  private readonly materials = new Map<string, Material>();
  private layer = 0;
  private softTexture: DataTexture | null = null;

  constructor() {
    this.root.add(this.head);
    this.root.add(this.upper);
  }

  std(color: string, roughness = 0.7): MeshStandardMaterial {
    const key = `s|${color}|${roughness}`;
    let material = this.materials.get(key) as MeshStandardMaterial | undefined;
    if (!material) {
      material = new MeshStandardMaterial({ color, roughness, metalness: 0 });
      this.materials.set(key, material);
    }
    return material;
  }

  // Pele: um toque de luz própria clareia as sombras (parece pele de verdade,
  // não plástico com sombra preta).
  skin(color: string): MeshPhysicalMaterial {
    const key = `k|${color}`;
    let material = this.materials.get(key) as MeshPhysicalMaterial | undefined;
    if (!material) {
      // sheen: brilho macio nas bordas (pele com "veludo", não plástico)
      material = new MeshPhysicalMaterial({
        color,
        roughness: 0.62,
        metalness: 0,
        emissive: color,
        emissiveIntensity: 0.07,
        sheen: 0.7,
        sheenRoughness: 0.55,
        sheenColor: new Color(color).lerp(new Color("#FFE3D0"), 0.45),
      });
      this.materials.set(key, material);
    }
    return material;
  }

  // Pele em camada (pálpebra, por exemplo): mesma luz da pele do rosto, mas com
  // polygonOffset pra ficar por cima do olho sem brigar por profundidade.
  skinLayer(color: string): MeshStandardMaterial {
    this.layer += 1;
    const material = new MeshStandardMaterial({
      color,
      roughness: 0.62,
      metalness: 0,
      emissive: color,
      emissiveIntensity: 0.07,
      polygonOffset: true,
      polygonOffsetFactor: -this.layer,
      polygonOffsetUnits: -this.layer,
      side: DoubleSide,
    });
    this.materials.set(`k|layer|${this.layer}`, material);
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

  // Material criado fora (cores por vértice, por exemplo): entra na limpeza do dispose.
  track<T extends Material>(material: T): T {
    this.materials.set(`x|${this.materials.size}`, material);
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

// Sólido de revolução (torso): raio em função de u (0 embaixo, 1 em cima),
// fechado no topo e na base.
export function revolve(radius: (u: number) => number, height: number, steps = 48, segments = 44): BufferGeometry {
  const points: Vector2[] = [new Vector2(0.0001, 0)];
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    points.push(new Vector2(Math.max(0.0001, radius(u)), u * height));
  }
  points.push(new Vector2(0.0001, height));
  // Une os vértices da costura pra a sombra não ter emenda.
  const lathe = new LatheGeometry(points, segments);
  lathe.deleteAttribute("uv");
  lathe.deleteAttribute("normal");
  const merged = mergeVertices(lathe, 1e-5);
  merged.computeVertexNormals();
  return merged;
}

// Dobras suaves no tecido: desloca os vértices ao longo da normal com duas
// ondas que se cruzam (leve o bastante pra não virar textura de pano amassado).
export function wrinkle(geometry: BufferGeometry, amplitude: number, seed = 0, frequency = 34): BufferGeometry {
  const position = geometry.getAttribute("position");
  const normal = geometry.getAttribute("normal");
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const angle = Math.atan2(z, x);
    const d = amplitude * (0.55 * Math.sin(y * frequency + angle * 2 + seed) + 0.45 * Math.sin(y * frequency * 0.43 - angle * 3 + seed * 2.1));
    position.setXYZ(i, x + normal.getX(i) * d, y + normal.getY(i) * d, z + normal.getZ(i) * d);
  }
  geometry.computeVertexNormals();
  return geometry;
}

export const roundEnd = (u: number, from: number) =>
  u > from ? Math.sqrt(Math.max(0, 1 - Math.pow((u - from) / (1 - from), 2) * 0.96)) : 1;
export const roundStart = (u: number, to: number) =>
  u < to ? Math.sqrt(Math.max(0, 1 - Math.pow((to - u) / to, 2) * 0.9)) : 1;

// Tubo com raio variável ao longo de uma curva — braços, mangas, mechas de
// cabelo, sobrancelhas e lábios.
export function tube(
  points: Vector3[],
  radius: (t: number) => number,
  t0 = 0,
  t1 = 1,
  radial = 20,
  segments = 40,
): BufferGeometry {
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
  // O sentido de giro dos triângulos depende da orientação da curva (um braço
  // espelhado sai do avesso e só se veria o lado de dentro): confere se a
  // primeira normal aponta pra fora do eixo e, se não, inverte a ordem.
  const center = curve.getPointAt(t0);
  const first = new Vector3(positions[0], positions[1], positions[2]).sub(center);
  const a = new Vector3(positions[0], positions[1], positions[2]);
  const b1 = new Vector3(positions[3 * (radial + 1)], positions[3 * (radial + 1) + 1], positions[3 * (radial + 1) + 2]);
  const c1 = new Vector3(positions[3], positions[4], positions[5]);
  const faceNormal = b1.sub(a).cross(c1.sub(a));
  if (faceNormal.dot(first) < 0) {
    for (let i = 0; i < indices.length; i += 3) {
      const tmp = indices[i + 1];
      indices[i + 1] = indices[i + 2];
      indices[i + 2] = tmp;
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// Gerador pseudo-aleatório com semente: o cabelo sai igual toda vez.
export function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
