import { BLOCKED_TERMS, SPAM_PATTERN } from "@/constants/moderation";

// Casa por PREFIXO (só \b no início) — "caralho" também barra "caralhos",
// "caralhudo" etc. sem precisar listar cada variação. Custo: alguma
// palavra rara que comece com o mesmo radical também barraria; aceitável
// pro tamanho da lista atual (ver ressalva no plano de moderação).
const PROFANITY_PATTERN = new RegExp(`\\b(${BLOCKED_TERMS.join("|")})`, "i");

// minúsculas + sem acento (NFD remove o diacrítico como caractere à
// parte) + reduz 3+ repetições da mesma letra pra 1 ("caaaaralho" →
// "caralho") — pega as variações mais óbvias de "burlar" a lista sem
// tentar decodificar leetspeak completo.
export function normalizeForModeration(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/(.)\1{2,}/g, "$1");
}

export type ModerationIssue = "profanity" | "spam";

// null = conteúdo liberado. Comentário/nome/bio vazio nunca é bloqueado
// (a checagem de obrigatório é outra validação, feita à parte).
export function getModerationIssue(text: string): ModerationIssue | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (SPAM_PATTERN.test(trimmed)) return "spam";
  if (PROFANITY_PATTERN.test(normalizeForModeration(trimmed))) return "profanity";
  return null;
}

// Mensagem pronta pro campo — reaproveitada nos três lugares (nome, bio,
// comentário) trocando só o começo.
export function moderationMessage(issue: ModerationIssue, fieldLabel: string): string {
  return issue === "spam"
    ? `Tira o link ${fieldLabel} pra continuar.`
    : `Tira o palavrão ${fieldLabel} pra continuar.`;
}
