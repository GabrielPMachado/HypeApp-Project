import { Color, DirectionalLight, DoubleSide, Group, HemisphereLight, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Scene } from "three";

import type { AvatarView, Look } from "@/data/character";
import { buildCharacterModel, type CharacterModel } from "@/three/characterModel";
import { softDiscTexture } from "@/three/kit";

// Enquadramentos da câmera: pra onde ela olha e a que distância (fov fixo).
const CAMERA: Record<AvatarView, { target: [number, number, number]; distance: number; pitch: number }> = {
  full: { target: [0, 0.92, 0], distance: 3.95, pitch: 0.05 },
  bust: { target: [0, 1.38, 0], distance: 2.45, pitch: 0.02 },
  top: { target: [0, 0.9, 0.02], distance: 2.1, pitch: 0.05 },
  bottom: { target: [0, 0.36, 0.02], distance: 2.05, pitch: 0.06 },
  shoes: { target: [0, 0.11, 0.05], distance: 1.5, pitch: 0.3 },
};

const FOV = 28;
// Largura que o corpo inteiro (com os cotovelos) ocupa, mais uma folga.
const FULL_WIDTH = 1.0;

// Cena do personagem: luzes, câmera e o boneco, sem nada de plataforma — quem
// cria o renderizador (celular ou navegador) só chama render.
export class CharacterStage {
  readonly scene = new Scene();
  readonly camera = new PerspectiveCamera(FOV, 1, 0.5, 30);
  private readonly pivot = new Group();
  private model: CharacterModel | null = null;
  private view: AvatarView = "full";
  private aspect = 1;
  private glow: Mesh | null = null;

  constructor() {
    this.scene.add(this.pivot);

    this.scene.add(new HemisphereLight(0xfff6ee, 0x6b6a80, 1.25));

    const key = new DirectionalLight(0xfff0dc, 2.6);
    key.position.set(2.2, 3.4, 3.6);
    this.scene.add(key);

    const fill = new DirectionalLight(0xa9c3ff, 0.75);
    fill.position.set(-3.2, 1.4, 2.4);
    this.scene.add(fill);

    const rim = new DirectionalLight(0xffffff, 1.5);
    rim.position.set(-1.6, 2.6, -3.6);
    this.scene.add(rim);

    const warmRim = new DirectionalLight(0xffc48a, 0.9);
    warmRim.position.set(3, 1.2, -2.8);
    this.scene.add(warmRim);

    this.applyCamera();
  }

  setLook(look: Look) {
    if (this.model) {
      this.pivot.remove(this.model.root);
      this.model.dispose();
    }
    this.model = buildCharacterModel(look);
    this.pivot.add(this.model.root);
  }

  // Fundo escuro com um halo atrás do boneco, na cor da moldura equipada.
  setBackdrop(frameColor: string) {
    this.scene.background = new Color("#101015");
    if (!this.glow) {
      const material = new MeshBasicMaterial({ map: softDiscTexture(), transparent: true, depthWrite: false, side: DoubleSide });
      this.glow = new Mesh(new PlaneGeometry(3.4, 3.4), material);
      this.glow.position.z = -1.3;
      this.scene.add(this.glow);
    }
    const material = this.glow.material as MeshBasicMaterial;
    material.color.set(frameColor);
    material.opacity = 0.42;
    this.alignGlow();
  }

  setView(view: AvatarView) {
    this.view = view;
    this.applyCamera();
    this.alignGlow();
  }

  private alignGlow() {
    if (this.glow) this.glow.position.y = CAMERA[this.view].target[1] + 0.1;
  }

  setAspect(aspect: number) {
    this.aspect = aspect;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.applyCamera();
  }

  // Giro do boneco em torno do próprio eixo (radianos, 0 = de frente).
  setYaw(yaw: number) {
    this.pivot.rotation.y = yaw;
  }

  private applyCamera() {
    const { target, distance, pitch } = CAMERA[this.view];
    // Em telas estreitas o corpo inteiro precisa de mais distância pra caber na largura.
    const widthFit = FULL_WIDTH / (2 * Math.tan((FOV * Math.PI) / 360) * this.aspect);
    const dist = this.view === "full" ? Math.max(distance, widthFit) : distance;
    this.camera.position.set(target[0], target[1] + Math.sin(pitch) * dist, target[2] + Math.cos(pitch) * dist);
    this.camera.lookAt(target[0], target[1], target[2]);
  }

  dispose() {
    this.model?.dispose();
    this.model = null;
    if (this.glow) {
      (this.glow.material as MeshBasicMaterial).map?.dispose();
      (this.glow.material as MeshBasicMaterial).dispose();
      this.glow.geometry.dispose();
      this.glow = null;
    }
  }
}
