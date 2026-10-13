import { GLView, type ExpoWebGLRenderingContext } from "expo-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import { PanResponder, StyleSheet, Text, View } from "react-native";
import type { WebGLRenderer } from "three";

import { CharacterAvatar } from "@/components/CharacterAvatar";
import { LOOK_SLOTS, type AvatarView, type Look } from "@/data/character";
import { createRenderer } from "@/three/createRenderer";
import { CharacterStage } from "@/three/stage";

interface Character3DProps {
  look: Look;
  width: number;
  height: number;
  view?: AvatarView;
  // Cor da moldura: tinge o halo atrás do boneco.
  frameColor: string;
  // O boneco balança sozinho e gira acompanhando o dedo (só no perfil e no
  // editor). Sem isso desenha um único quadro parado — bem mais leve.
  interactive?: boolean;
  // Enquanto outra tela cobre esta, o balanço para (poupa bateria).
  paused?: boolean;
}

const SWAY = 0.2; // amplitude do balanço parado (radianos)
const RETURN_AFTER_MS = 1400;

interface Engine {
  stage: CharacterStage;
  renderer: WebGLRenderer;
  gl: ExpoWebGLRenderingContext;
  frame: number | null;
  yaw: number;
  startYaw: number;
  lastTouch: number;
  dragging: boolean;
}

// Boneco 3D de verdade (three.js sobre expo-gl). Se o GL não subir (aparelho
// sem suporte, erro de driver), cai no desenho 2D da mesma figura pra tela não
// ficar em branco.
export function Character3D({ look, width, height, view = "full", frameColor, interactive = false, paused = false }: Character3DProps) {
  const engine = useRef<Engine | null>(null);
  // Motivo da falha do 3D (null = funcionando). Aparece em letra miúda embaixo do
  // desenho 2D de reserva, pra dar pra saber por que o GL não subiu.
  const [failed, setFailed] = useState<string | null>(null);
  const lookKey = LOOK_SLOTS.map((slot) => look[slot]).join("|");
  const latest = useRef({ look, view, frameColor, interactive, paused, width, height });
  latest.current = { look, view, frameColor, interactive, paused, width, height };

  // verify: no primeiro quadro, confere (antes de apresentar) se o boneco de fato foi desenhado.
  const draw = (verify = false) => {
    const e = engine.current;
    if (!e) return;
    e.stage.setYaw(e.yaw);
    e.renderer.render(e.stage.scene, e.stage.camera);
    if (verify && isBlank(e.gl)) throw new Error("quadro vazio (o boneco não foi desenhado)");
    e.gl.endFrameEXP();
  };

  const loop = () => {
    const e = engine.current;
    if (!e) return;
    const now = Date.now();
    if (!e.dragging) {
      if (now - e.lastTouch > RETURN_AFTER_MS) {
        // volta pro centro pelo caminho mais curto e fica balançando
        const wrapped = Math.atan2(Math.sin(e.yaw), Math.cos(e.yaw));
        e.yaw = wrapped + (Math.sin(now / 1100) * SWAY - wrapped) * 0.07;
      }
    }
    draw();
    e.frame = requestAnimationFrame(loop);
  };

  const onContextCreate = (gl: ExpoWebGLRenderingContext) => {
    try {
      const renderer = createRenderer(gl);

      const stage = new CharacterStage();
      const current = latest.current;
      stage.setAspect(current.width / current.height);
      stage.setView(current.view);
      stage.setBackdrop(current.frameColor);
      stage.setLook(current.look);
      engine.current = { stage, renderer, gl, frame: null, yaw: 0, startYaw: 0, lastTouch: 0, dragging: false };

      if (current.interactive) {
        draw(true);
        if (!current.paused) engine.current.frame = requestAnimationFrame(loop);
      } else {
        // Um quadro parado (e mais um logo depois, pro primeiro não sair vazio).
        draw(true);
        engine.current.frame = requestAnimationFrame(() => {
          draw();
          if (engine.current) engine.current.frame = null;
        });
      }
    } catch (error) {
      const e = engine.current;
      if (e) {
        e.stage.dispose();
        e.renderer.dispose();
        engine.current = null;
      }
      setFailed(describe(error));
    }
  };

  // Look, moldura ou enquadramento mudaram: refaz o boneco e desenha de novo.
  useEffect(() => {
    const e = engine.current;
    if (!e) return;
    try {
      e.stage.setLook(look);
      e.stage.setBackdrop(frameColor);
      e.stage.setView(view);
      if (!interactive) draw();
    } catch (error) {
      setFailed(describe(error));
    }
  }, [lookKey, frameColor, view]);

  useEffect(() => {
    const e = engine.current;
    if (!e) return;
    e.stage.setAspect(width / height);
    if (!interactive) draw();
  }, [width, height]);

  useEffect(() => {
    const e = engine.current;
    if (!e || !interactive) return;
    if (paused && e.frame !== null) {
      cancelAnimationFrame(e.frame);
      e.frame = null;
    } else if (!paused && e.frame === null) {
      e.frame = requestAnimationFrame(loop);
    }
  }, [paused]);

  useEffect(
    () => () => {
      const e = engine.current;
      if (!e) return;
      if (e.frame !== null) cancelAnimationFrame(e.frame);
      e.stage.dispose();
      e.renderer.dispose();
      engine.current = null;
    },
    [],
  );

  // Arrastar na horizontal gira o boneco; na vertical deixa a tela rolar.
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy) * 1.4,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          const e = engine.current;
          if (e) {
            e.dragging = true;
            e.startYaw = e.yaw;
          }
        },
        onPanResponderMove: (_e, g) => {
          const e = engine.current;
          if (!e) return;
          e.yaw = e.startYaw + (g.dx / 120) * Math.PI;
          e.lastTouch = Date.now();
        },
        onPanResponderRelease: () => {
          const e = engine.current;
          if (e) {
            e.dragging = false;
            e.lastTouch = Date.now();
          }
        },
        onPanResponderTerminate: () => {
          const e = engine.current;
          if (e) e.dragging = false;
        },
      }),
    [],
  );

  if (failed !== null) {
    return (
      <View style={{ width, height }}>
        <CharacterAvatar look={look} view={view} size={height} />
        <Text style={styles.reason} numberOfLines={6}>
          3D indisponível: {failed}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ width, height }} {...(interactive ? pan.panHandlers : {})}>
      <GLView style={styles.fill} onContextCreate={onContextCreate} msaaSamples={4} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  reason: {
    position: "absolute",
    left: 4,
    right: 4,
    bottom: 2,
    fontSize: 9,
    color: "#FF9E9E",
    textAlign: "center",
  },
});

function describe(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  return text.replace(/s+/g, " ").slice(0, 220);
}

// A cena sumiu (contexto criado, mas nada desenhado)? Lê um pixel do meio do
// quadro: se ainda é a cor do fundo, o boneco não foi pra tela.
function isBlank(gl: ExpoWebGLRenderingContext): boolean {
  const pixel = new Uint8Array(4);
  gl.readPixels(Math.floor(gl.drawingBufferWidth / 2), Math.floor(gl.drawingBufferHeight * 0.45), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
  return Math.abs(pixel[0] - 16) < 8 && Math.abs(pixel[1] - 16) < 8 && Math.abs(pixel[2] - 21) < 8;
}
