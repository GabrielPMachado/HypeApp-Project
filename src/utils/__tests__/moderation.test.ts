import { getModerationIssue, moderationMessage, normalizeForModeration } from "@/utils/moderation";

describe("getModerationIssue", () => {
  it("libera texto vazio ou só espaços", () => {
    expect(getModerationIssue("")).toBeNull();
    expect(getModerationIssue("   ")).toBeNull();
  });

  it("libera texto normal", () => {
    expect(getModerationIssue("Ambiente ótimo, som na medida certa.")).toBeNull();
  });

  it("barra palavrão mesmo em variação de plural/gênero (casa por radical)", () => {
    expect(getModerationIssue("isso é uma bosta")).toBe("profanity");
    expect(getModerationIssue("povo idiota")).toBe("profanity");
  });

  it("ignora maiúsculas e acentos ao detectar palavrão", () => {
    expect(getModerationIssue("IDIOTA")).toBe("profanity");
  });

  it("detecta letras repetidas como tentativa de burlar o filtro", () => {
    expect(getModerationIssue("issso é uma porraaaa")).toBe("profanity");
  });

  it("prioriza spam sobre palavrão quando os dois aparecem juntos", () => {
    expect(getModerationIssue("porra que site bom, olha aqui: meusite.com")).toBe("spam");
  });

  it.each(["confere em https://exemplo.com", "www.exemplo.com", "acesse exemplo.com.br"])(
    "detecta link como spam: %s",
    (text) => {
      expect(getModerationIssue(text)).toBe("spam");
    }
  );
});

describe("normalizeForModeration", () => {
  it("baixa a caixa e remove acento", () => {
    expect(normalizeForModeration("PÉSSIMO")).toBe("pessimo");
  });

  it("reduz 3+ repetições da mesma letra pra 1 (2 repetições fica como está)", () => {
    expect(normalizeForModeration("issso")).toBe("iso");
    expect(normalizeForModeration("péssimo")).toBe("pessimo");
  });
});

describe("moderationMessage", () => {
  it("varia a mensagem conforme o tipo de problema", () => {
    expect(moderationMessage("spam", "no comentário")).toContain("link");
    expect(moderationMessage("profanity", "no nome")).toContain("palavrão");
  });
});
