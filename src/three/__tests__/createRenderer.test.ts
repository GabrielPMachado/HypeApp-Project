import { WebGLRenderer } from "three";

import { withoutWebGL1Class } from "@/three/createRenderer";

// O bug real: o expo-gl faz WebGL2RenderingContext herdar de
// WebGLRenderingContext, e o three recusa o contexto por achar que é WebGL 1.
// Aqui a herança do expo-gl é simulada pra reproduzir o erro sem aparelho.
const scope = globalThis as unknown as Record<string, unknown>;
const original = Object.getOwnPropertyDescriptor(scope, "WebGLRenderingContext");

const canvas = {
  width: 100,
  height: 100,
  style: {},
  addEventListener: () => {},
  removeEventListener: () => {},
} as unknown as HTMLCanvasElement;

function installExpoGlClasses(): object {
  function WebGLRenderingContext() {}
  function WebGL2RenderingContext() {}
  WebGL2RenderingContext.prototype = Object.create(WebGLRenderingContext.prototype);
  scope.WebGLRenderingContext = WebGLRenderingContext;
  scope.WebGL2RenderingContext = WebGL2RenderingContext;
  return new (WebGL2RenderingContext as unknown as new () => object)();
}

afterEach(() => {
  if (original) Object.defineProperty(scope, "WebGLRenderingContext", original);
  else delete scope.WebGLRenderingContext;
  delete scope.WebGL2RenderingContext;
});

describe("withoutWebGL1Class", () => {
  it("reproduz o erro do celular: o three recusa o contexto do expo-gl", () => {
    const gl = installExpoGlClasses();
    expect(() => new WebGLRenderer({ canvas, context: gl as WebGLRenderingContext })).toThrow(
      "WebGL 1 is not supported",
    );
  });

  it("com a classe escondida, passa da checagem do WebGL 1", () => {
    const gl = installExpoGlClasses();
    let message = "";
    try {
      withoutWebGL1Class(() => new WebGLRenderer({ canvas, context: gl as WebGLRenderingContext }));
    } catch (error) {
      message = String(error);
    }
    // O contexto de mentira não tem os métodos do GL, então a criação falha
    // mais adiante — mas não mais pelo motivo do WebGL 1.
    expect(message).not.toContain("WebGL 1 is not supported");
    expect(message).toContain("getContextAttributes");
  });

  it("devolve a classe ao normal depois, inclusive quando a criação falha", () => {
    installExpoGlClasses();
    const before = scope.WebGLRenderingContext;
    expect(() =>
      withoutWebGL1Class(() => {
        expect(scope.WebGLRenderingContext).toBeUndefined();
        throw new Error("falhou de propósito");
      }),
    ).toThrow("falhou de propósito");
    expect(scope.WebGLRenderingContext).toBe(before);
  });

  it("devolve o valor de quem foi criado", () => {
    installExpoGlClasses();
    expect(withoutWebGL1Class(() => 42)).toBe(42);
  });

  it("sem a classe no ambiente, só executa", () => {
    delete scope.WebGLRenderingContext;
    expect(withoutWebGL1Class(() => "ok")).toBe("ok");
    expect("WebGLRenderingContext" in scope).toBe(false);
  });

  it("classe que não dá pra esconder: falha com mensagem clara em vez de seguir", () => {
    installExpoGlClasses();
    // Descritor simulado (não-configurável e somente leitura), sem mexer no global de verdade.
    const spy = jest
      .spyOn(Object, "getOwnPropertyDescriptor")
      .mockReturnValueOnce({ value: function () {}, writable: false, configurable: false, enumerable: true });
    try {
      expect(() => withoutWebGL1Class(() => 1)).toThrow("não pode ser escondida");
    } finally {
      spy.mockRestore();
    }
  });
});
