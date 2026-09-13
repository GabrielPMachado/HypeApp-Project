# 🍻 HypeApp - O "Waze" do Rolê

> Descubra exatamente onde está o "Hype" da noite antes de sair de casa. Sem surpresas, sem filas inesperadas e com a música certa para a sua vibe.

![Badge Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-yellow)
![Badge Versão](https://img.shields.io/badge/Versão-MVP-blue)

## 💡 O Problema
Sexta-feira à noite, você e seus amigos querem tomar uma cerveja e ouvir uma música legal, mas surge a dúvida: *Para onde ir?* Ir aos mesmos lugares de sempre pode ser monótono, mas testar um lugar novo às escuras é arriscado. Tomar decisões baseadas em redes sociais muitas vezes cai em armadilhas de publicidade paga, perdendo a essência real da noite.

## 🚀 A Solução
O **HypeApp** é um aplicativo colaborativo em tempo real que funciona como um "termômetro do hype" autêntico. Através da própria comunidade que já está nos bares, mostramos o que está acontecendo na cidade *agora*, sem filtros comerciais.

### 🎯 Principais Funcionalidades (Visão do Usuário)

* 🗺️ **Interface Híbrida Inteligente:** Ao abrir o app, o usuário cai direto em um **Mapa de Calor** em tempo real alimentado por geolocalização, podendo alternar facilmente para uma **Visualização em Lista** com o ranking dos locais mais quentes.
* ⚡ **Status Colaborativo Relâmpago:** Atualizações feitas pela comunidade em apenas dois toques na tela utilizando indicadores visuais rápidos:
    * 🟢 Vazio / De boas
    * 🟡 Movimentado / Animado
    * 🔴 Lotado / Fila enorme
* 🎸 **Filtros por Vibe & Estilo:** Categorias dinâmicas divididas por estilo musical (Rock, Samba, Eletrônica) e preferências de ambiente ("Para conversar", "Para dançar").
* ⭐ **Nota do Hype:** Uma avaliação em tempo real baseada puramente na energia atual do local, mudando a cada noite.
* 🏆 **Gamificação (Especialistas da Noite):** Usuários ganham pontos ao atualizar o status dos locais através de QR Codes nas mesas.

---

## 🗺️ Estratégia de Lançamento (MVP) e Validação

O MVP do HypeApp adotará uma estratégia de hiper-foco geográfico, lançando inicialmente de forma exclusiva no bairro **Cidade Baixa (Porto Alegre)**, aproveitando a alta densidade de bares e o público jovem.

### O Projeto Piloto (Ganho de Tração)
Parcerias estratégicas com 5 a 10 bares locais da Cidade Baixa:
1. **Displays com QR Code:** Mesas dos bares parceiros terão QR Codes físicos facilitando o acesso ao app e estimulando a atualização do status em troca de recompensas reais (ex: chopes liberados pelo estabelecimento).
2. **Custo de Aquisição Inteligente:** O bar ganha destaque gratuito temporário no mapa, e o aplicativo ganha usuários ativos e dados validados em tempo real.

---

## 💼 Modelo de Negócios (Pós-Validação B2B)

Após a validação na Cidade Baixa, o HypeApp monetizará através de frentes voltadas para os proprietários:
1. **Hype Ads:** Bares pagam para impulsionar sua visibilidade no mapa e nas listas.
2. **Hype Analytics:** Painel com inteligência de mercado, mostrando o fluxo de pico do bar, comportamento do público e análise de perda de fluxo para concorrentes da região.

---

## 🛠️ Stack Tecnológica (MVP)

* **Frontend (Mobile):** React Native com [Expo](https://expo.dev/) (Expo Router para navegação)
* **Backend & Banco de Dados:** Firebase (Firestore/Realtime Database para status ao vivo)
* **Geolocalização:** Google Maps API

---

## 🚀 Como Rodar o Projeto

Pré-requisitos: [Node.js](https://nodejs.org/) e o app **Expo Go** instalado no celular ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779)).

```bash
npm install
npx expo start
```

Isso abre o Metro Bundler e mostra uma URL/QR code no terminal. Com o celular na **mesma rede Wi-Fi** do computador, abra o Expo Go e escaneie o QR code (ou digite a URL manualmente, ex: `exp://192.168.x.x:8081`).

Se for integrar com o Firebase, copie `.env.example` para `.env` e preencha com as credenciais do seu projeto Firebase — esse arquivo nunca deve ser commitado.

---

## 📝 Padrão de Commits

Este projeto segue o [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). Todo commit deve ter o formato:

```
<tipo>[escopo opcional]: <descrição>

[corpo opcional]

[rodapé(s) opcional(is)]
```

**Tipos mais usados:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

**Exemplos:**
```
feat(mapa): adiciona mapa de calor em tempo real
fix(status): corrige contagem de votos duplicados
docs(readme): atualiza modelo de negócio
```

Mudanças que quebram compatibilidade usam `!` após o tipo/escopo (ex: `feat!: ...`) ou um rodapé `BREAKING CHANGE:`.

O commit é validado automaticamente via [commitlint](commitlint.config.js) + Husky (`.husky/commit-msg`) — mensagens fora do padrão são rejeitadas.