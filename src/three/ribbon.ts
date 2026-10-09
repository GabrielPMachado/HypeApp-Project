import { BufferGeometry, CatmullRomCurve3, Color, Float32BufferAttribute, Matrix4, Quaternion, SphereGeometry, Vector3 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// Peças de cabelo: mechas achatadas (fitas com seção elíptica) e blobs, todos
// com cor por vértice, que depois são fundidos numa malha só — centenas de
// mechas por um desenho só. A cor vai de escura na raiz a clara na ponta, que é
// o que dá profundidade ao cabelo (as sombras entre as mechas).

export interface RibbonOptions {
  // Meia-largura e meia-espessura em função de t (0 raiz, 1 ponta).
  width: (t: number) => number;
  thick: (t: number) => number;
  color: (t: number) => Color;
  radial?: number;
  segments?: number;
}

// Fita ao longo de pontos, deitada sobre as normais dadas (uma por ponto): a
// parte de cima da seção (pra fora da cabeça) é cheia, a de baixo achatada.
export function ribbon(points: Vector3[], normals: Vector3[], options: RibbonOptions): BufferGeometry {
  const radial = options.radial ?? 8;
  const segments = options.segments ?? 12;
  const curve = new CatmullRomCurve3(points, false, "catmullrom", 0.5);
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const tangent = new Vector3();
  const normal = new Vector3();
  const side = new Vector3();

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = curve.getPointAt(t);
    curve.getTangentAt(t, tangent).normalize();
    const f = t * (normals.length - 1);
    const k = Math.min(normals.length - 2, Math.floor(f));
    normal.copy(normals[k]).lerp(normals[k + 1], f - k);
    normal.addScaledVector(tangent, -normal.dot(tangent)).normalize();
    side.crossVectors(tangent, normal).normalize();
    const w = options.width(t);
    const h = options.thick(t);
    const c = options.color(t);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const cs = Math.cos(a);
      const sn = Math.sin(a);
      const k2 = sn < 0 ? 0.3 : 1;
      positions.push(
        p.x + side.x * cs * w + normal.x * sn * h * k2,
        p.y + side.y * cs * w + normal.y * sn * h * k2,
        p.z + side.z * cs * w + normal.z * sn * h * k2,
      );
      colors.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const b = a + radial + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  // Sentido dos triângulos: a face da primeira célula tem que apontar pra fora
  // do eixo da fita.
  const first = new Vector3(positions[0], positions[1], positions[2]);
  const axis = curve.getPointAt(0);
  const second = new Vector3(positions[3 * (radial + 1)], positions[3 * (radial + 1) + 1], positions[3 * (radial + 1) + 2]);
  const third = new Vector3(positions[3], positions[4], positions[5]);
  const faceNormal = second.clone().sub(first).cross(third.clone().sub(first));
  if (faceNormal.dot(first.clone().sub(axis)) < 0) {
    for (let i = 0; i < indices.length; i += 3) {
      const tmp = indices[i + 1];
      indices[i + 1] = indices[i + 2];
      indices[i + 2] = tmp;
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// Elipsoide colorido com o eixo maior alinhado a `up` (cachos, lâminas de
// moicano, coque). color recebe o y da esfera unitária (-1 embaixo, 1 em cima).
export function blob(center: Vector3, scale: Vector3, up: Vector3, color: (y: number) => Color, segments: [number, number] = [14, 10]): BufferGeometry {
  const geometry = new SphereGeometry(1, segments[0], segments[1]);
  geometry.deleteAttribute("uv");
  const position = geometry.getAttribute("position");
  const colors: number[] = [];
  for (let i = 0; i < position.count; i++) {
    const c = color(position.getY(i));
    colors.push(c.r, c.g, c.b);
  }
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  const rotation = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), up.clone().normalize());
  geometry.applyMatrix4(new Matrix4().compose(center, rotation, scale));
  return geometry;
}

export function mergeParts(parts: BufferGeometry[]): BufferGeometry {
  const merged = mergeGeometries(parts, false);
  if (!merged) throw new Error("não deu pra fundir as peças do cabelo");
  parts.forEach((part) => part.dispose());
  return merged;
}
