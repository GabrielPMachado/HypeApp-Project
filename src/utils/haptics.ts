// Feedback tátil nas ações importantes (comprar, equipar, enviar, subir de
// nível). O expo-haptics é módulo nativo: importar ele estático no topo
// quebra o app em qualquer build que ainda não o tenha linkado (mesmo
// problema do AsyncStorage e do Google Sign-In). Aqui ele só carrega na
// primeira vibração e, se não existir, tudo vira no-op silencioso.

type HapticsModule = typeof import("expo-haptics");

let modulePromise: Promise<HapticsModule | null> | null = null;

function load(): Promise<HapticsModule | null> {
  if (!modulePromise) {
    modulePromise = import("expo-haptics").catch(() => null);
  }
  return modulePromise;
}

function run(action: (haptics: HapticsModule) => Promise<void>) {
  load()
    .then((haptics) => (haptics ? action(haptics) : undefined))
    .catch(() => {});
}

export const haptics = {
  // Toque leve: equipar, trocar de aba, marcar/desmarcar.
  tap: () => run((h) => h.impactAsync(h.ImpactFeedbackStyle.Light)),
  // Ação confirmada: enviar hype/avaliação, salvar.
  confirm: () => run((h) => h.impactAsync(h.ImpactFeedbackStyle.Medium)),
  // Conquista: compra feita, subiu de nível.
  success: () => run((h) => h.notificationAsync(h.NotificationFeedbackType.Success)),
  // Algo barrado: sem moedas, erro.
  warning: () => run((h) => h.notificationAsync(h.NotificationFeedbackType.Warning)),
};
