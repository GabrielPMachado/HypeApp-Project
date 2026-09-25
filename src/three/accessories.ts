import { CircleGeometry, ConeGeometry, CylinderGeometry, DoubleSide, SphereGeometry, TorusGeometry } from "three";

import { Kit, rad } from "@/three/kit";
import { stuck } from "@/three/head";

// Acessórios da cabeça, no grupo kit.head (mesmas coordenadas do crânio).
export function buildAccessory(kit: Kit, id: string) {
  const frame = kit.std("#25252D", 0.4);
  switch (id) {
    case "ac-glasses":
    case "ac-shades": {
      const shades = id === "ac-shades";
      for (const side of [-1, 1]) {
        const lens = stuck(kit, side * rad(23), rad(-3), 0.05);
        if (shades) {
          const plate = kit.mesh(lens, new SphereGeometry(1, 28, 20), kit.gloss("#15151B", 0.25, 1));
          plate.scale.set(0.086, 0.062, 0.016);
        } else {
          kit.mesh(lens, new TorusGeometry(0.078, 0.008, 10, 40), frame);
          const glass = kit.mesh(lens, new CircleGeometry(0.076, 32), kit.decal("#CFE8FF", 0.14));
          glass.position.z = 0.001;
        }
      }
      const bridge = kit.mesh(kit.head, new CylinderGeometry(0.007, 0.007, 0.06, 8), frame, 0, 1.5, 0.35);
      bridge.rotation.z = Math.PI / 2;
      for (const side of [-1, 1]) {
        const arm = kit.mesh(kit.head, new CylinderGeometry(0.007, 0.007, 0.3, 8), frame, side * 0.318, 1.5, 0.19);
        arm.rotation.x = Math.PI / 2;
      }
      break;
    }
    case "ac-cap": {
      const red = kit.std("#C9594B", 0.6);
      red.side = DoubleSide;
      const dome = kit.mesh(kit.head, new SphereGeometry(1, 48, 30, 0, Math.PI * 2, 0, 1.62), red, 0, 1.51, -0.01);
      dome.scale.set(0.355, 0.34, 0.345);
      dome.rotation.x = -0.32;
      const brim = kit.mesh(kit.head, new CylinderGeometry(0.22, 0.22, 0.02, 36, 1, false, rad(-90), rad(180)), kit.std("#8E3B32", 0.6), 0, 1.655, 0.12);
      brim.rotation.x = rad(-6);
      brim.scale.set(1, 1, 1.6);
      kit.mesh(kit.head, new SphereGeometry(0.026, 16, 12), kit.std("#8E3B32", 0.6), 0, 1.86, 0.02);
      break;
    }
    case "ac-headphones": {
      const shell = kit.std("#454556", 0.45);
      kit.mesh(kit.head, new TorusGeometry(0.385, 0.022, 12, 48, Math.PI), kit.std("#5F5F72", 0.4), 0, 1.5, 0);
      for (const side of [-1, 1]) {
        const cup = kit.mesh(kit.head, new CylinderGeometry(0.095, 0.095, 0.07, 32), shell, side * 0.385, 1.49, 0);
        cup.rotation.z = Math.PI / 2;
        const ring = kit.mesh(kit.head, new TorusGeometry(0.07, 0.008, 8, 32), kit.std("#4FC3F7", 0.4), side * 0.42, 1.49, 0);
        ring.rotation.y = Math.PI / 2;
        (ring.material as import("three").MeshStandardMaterial).emissive.set("#4FC3F7").multiplyScalar(0.5);
      }
      break;
    }
    case "ac-fedora": {
      const felt = kit.std("#4A3B34", 0.75);
      kit.mesh(kit.head, new CylinderGeometry(0.44, 0.44, 0.016, 48), felt, 0, 1.68, 0);
      kit.mesh(kit.head, new CylinderGeometry(0.25, 0.28, 0.2, 40), kit.std("#5A4840", 0.75), 0, 1.78, 0);
      kit.mesh(kit.head, new SphereGeometry(0.25, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), kit.std("#5A4840", 0.75), 0, 1.88, 0).scale.set(1, 0.32, 1);
      kit.mesh(kit.head, new CylinderGeometry(0.285, 0.285, 0.045, 40), kit.std("#EDB84F", 0.5), 0, 1.72, 0);
      break;
    }
    case "ac-crown": {
      const gold = kit.gloss("#F2C24A", 0.3, 1);
      kit.mesh(kit.head, new CylinderGeometry(0.2, 0.22, 0.07, 40, 1, true), gold, 0, 1.84, 0);
      const ring = kit.mesh(kit.head, new TorusGeometry(0.21, 0.02, 10, 40), gold, 0, 1.805, 0);
      ring.rotation.x = Math.PI / 2;
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const spike = kit.mesh(kit.head, new ConeGeometry(0.045, 0.16, 12), gold, Math.sin(angle) * 0.21, 1.91, Math.cos(angle) * 0.21);
        spike.rotation.set(Math.cos(angle) * rad(8), 0, -Math.sin(angle) * rad(8));
        kit.mesh(kit.head, new SphereGeometry(0.03, 14, 10), kit.gloss(i % 2 ? "#5AA9E6" : "#D9485A", 0.15, 1), Math.sin(angle) * 0.21, 1.835, Math.cos(angle) * 0.218);
      }
      break;
    }
  }
}
