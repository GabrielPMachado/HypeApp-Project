import type { ExpoWebGLRenderingContext } from "expo-gl";
import { ACESFilmicToneMapping, SRGBColorSpace, WebGLRenderer } from "three";

const WEBGL1_CLASS = "WebGLRenderingContext";

// O three (r163 em diante) recusa qualquer contexto que seja `instanceof
// WebGLRenderingContext`, achando que é WebGL 1 ("WebGL 1 is not supported
// since r163"). Só que o expo-gl faz o WebGL2RenderingContext herdar dessa
// classe de propósito (ver node_modules/expo-gl/common/EXWebGLRenderer.cpp), e o
// contexto dele é WebGL 2 de verdade: cai no teste por engano e o 3D nunca
// subia no celular. O three só olha pra essa classe ao criar o renderizador,
// então ela fica escondida só durante a criação e volta ao normal em seguida.
export function withoutWebGL1Class<T>(create: () => T): T {
  const scope = globalThis as unknown as Record<string, unknown>;
  const original = Object.getOwnPropertyDescriptor(scope, WEBGL1_CLASS);
  if (!original) return create();

  if (original.configurable) {
    Object.defineProperty(scope, WEBGL1_CLASS, {
      value: undefined,
      writable: true,
      configurable: true,
      enumerable: original.enumerable,
    });
  } else if (original.writable) {
    scope[WEBGL1_CLASS] = undefined;
  } else {
    throw new Error(`${WEBGL1_CLASS} não pode ser escondida do three`);
  }

  try {
    return create();
  } finally {
    if (original.configurable) Object.defineProperty(scope, WEBGL1_CLASS, original);
    else scope[WEBGL1_CLASS] = original.value;
  }
}

// O three só precisa de alguns pedaços do "canvas"; o resto é do expo-gl.
function stubCanvas(gl: ExpoWebGLRenderingContext): HTMLCanvasElement {
  return {
    width: gl.drawingBufferWidth,
    height: gl.drawingBufferHeight,
    style: {},
    addEventListener: () => {},
    removeEventListener: () => {},
    clientWidth: gl.drawingBufferWidth,
    clientHeight: gl.drawingBufferHeight,
  } as unknown as HTMLCanvasElement;
}

export function createRenderer(gl: ExpoWebGLRenderingContext): WebGLRenderer {
  const renderer = withoutWebGL1Class(
    () => new WebGLRenderer({ canvas: stubCanvas(gl), context: gl, antialias: true }),
  );
  renderer.setPixelRatio(1);
  renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight, false);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  return renderer;
}
