// Termos bloqueados nos campos de texto livre e público do app (nome,
// bio, comentário de avaliação — ver utils/moderation.ts). Guarda só o
// RADICAL de cada palavra (sem plural/gênero) porque a checagem casa por
// prefixo, então "caralho"/"caralhos"/"caralhudo" já caem na mesma
// entrada — não precisa listar cada variação.
//
// ATENÇÃO: esta lista também é espelhada nas regras do Firestore (função
// isClean) — ver o plano de moderação. Mudou a lista aqui, muda lá
// também, senão o cliente bloqueia mas um app adulterado ainda consegue
// gravar.
export const BLOCKED_TERMS = [
  // Baixo calão comum
  "caralho",
  "porra",
  "merda",
  "bosta",
  "cacete",
  "piroca",
  "pau no",
  "xoxota",
  "buceta",
  "pentelh",
  "pelanca",
  // Xingamento/ofensa direta
  "arrombad",
  "desgraç",
  "imbecil",
  "idiota",
  "retardad",
  "babaca",
  "otári",
  "escrot",
  "fdp",
  "vsf",
  "vai se fuder",
  "vai a merda",
  "filho da puta",
  "filha da puta",
  "corn",
  // Termos sexuais/xingamento envolvendo terceiros
  "puta",
  "viad",
  "bicha",
  "sapatão",
  "traveco",
  // Slurs raciais/discriminatórios comuns em PT-BR
  "macac",
  "crioul",
  "neguinh",
  "favelad",
] as const;

// Link é o sinal de spam mais comum e barato de detectar — sem tentar
// adivinhar todo padrão de propaganda possível.
export const SPAM_PATTERN = /https?:\/\/|www\.|\.com\b|\.com\.br\b/i;
