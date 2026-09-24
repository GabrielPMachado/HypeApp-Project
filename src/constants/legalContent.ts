// Texto de Política de Privacidade e Termos de Uso, embutido no app (ver
// LegalModal.tsx) em vez de linkar pra uma página externa — assim o
// conteúdo continua acessível offline e não depende de um serviço de
// terceiro pra cumprir uma exigência legal (LGPD).
export interface LegalListItem {
  label: string;
  detail: string;
}

export interface LegalFact {
  label: string;
  value: string;
  good?: boolean;
}

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  // Lista simples, um item por linha (sem destaque de rótulo).
  bullets?: string[];
  // Lista "rótulo em negrito + explicação", pros casos com mais contexto.
  items?: LegalListItem[];
  // Rodapé da seção com um rótulo curto (ex.: "O que a gente não coleta")
  // seguido de tags soltas.
  tagsIntro?: string;
  tags?: string[];
  // Bloco destacado (aviso), só usado na isenção de garantias dos Termos.
  warning?: string;
}

export interface LegalDocument {
  title: string;
  updatedAt: string;
  intro: string;
  facts?: LegalFact[];
  sections: LegalSection[];
  footer: string;
}

export const PRIVACY_POLICY: LegalDocument = {
  title: "Política de Privacidade",
  updatedAt: "24 de setembro de 2026",
  intro:
    "O HypeApp é um app colaborativo que mostra o quão animado um bar está agora, com base em " +
    "avaliações da própria comunidade. Esta página explica, sem juridiquês, quais dados " +
    "coletamos, pra quê, e como você pode ver ou apagar os seus a qualquer momento.",
  facts: [
    { label: "Localização por GPS", value: "Só na hora, nunca gravada" },
    { label: "Anúncios ou rastreamento", value: "Não usamos", good: true },
    { label: "Venda de dados", value: "Nunca", good: true },
    { label: "Excluir conta", value: "Direto no app, de verdade" },
  ],
  sections: [
    {
      heading: "Quais dados coletamos",
      paragraphs: [
        "Só pedimos o que o app precisa de verdade pra funcionar. Nada de formulário genérico " +
          "coletando o que não vai ser usado.",
      ],
      items: [
        {
          label: "Conta",
          detail:
            'E-mail e senha, ou seu nome e e-mail do Google, se você entrar com "Continuar com ' +
            'Google". Isso fica guardado pelo Firebase Authentication (Google) e nunca aparece ' +
            "no seu perfil público.",
        },
        {
          label: "Perfil (público pra outros usuários logados)",
          detail:
            "Nome de exibição, biografia, vibes favoritas, avatar/moldura/título escolhidos na " +
            "loja, e contadores de pontos e nível. Nunca inclui seu e-mail.",
        },
        {
          label: "Conteúdo que você publica",
          detail:
            'Reports de "hype" (uma nota de 0 a 10 com data/hora), avaliações (notas por ' +
            "critério, comentário e tags de vibe) e fotos de bares que você manda. Ficam " +
            "vinculados ao seu perfil, visíveis pra qualquer pessoa logada no app.",
        },
        {
          label: "Quem você segue",
          detail:
            "Se você seguir outro usuário, essa relação (quem segue quem) fica registrada e é " +
            "visível pra quem consulta o perfil de qualquer um dos dois.",
        },
        {
          label: "Localização do aparelho (GPS)",
          detail:
            "Usada em dois momentos, sempre na hora e nunca gravada num histórico: (1) ao " +
            "avaliar um bar, pra confirmar que você está de verdade perto dele — comparamos a " +
            'distância e descartamos a coordenada; (2) se você ativar "Bar lotado por perto" no ' +
            "perfil, o app compara sua posição com a dos bares periodicamente, só enquanto " +
            "estiver aberto, pra te avisar. Você pode desativar isso a qualquer momento, e o " +
            "app nunca acessa sua localização em segundo plano com o app fechado.",
        },
        {
          label: "Região que você busca",
          detail:
            'O bairro, rua ou cidade que você digita na busca é enviado ao Geoapify (nosso ' +
            'serviço de geocodificação) só pra achar as coordenadas daquele lugar no mapa. Não ' +
            "é a localização do seu aparelho.",
        },
        {
          label: "Denúncias e pedidos de expansão",
          detail:
            "Se você denunciar uma avaliação ou usuário, ou pedir que o HypeApp chegue numa " +
            "região sem bar cadastrado, guardamos seu ID junto com essa ação — só nossa equipe " +
            "revisa isso, nunca é público.",
        },
      ],
      tagsIntro: "O que a gente não coleta:",
      tags: [
        "Localização em segundo plano",
        "Contatos do aparelho",
        "Identificador de publicidade",
        "Histórico de navegação",
      ],
    },
    {
      heading: "Como usamos os dados",
      bullets: [
        'Calcular e mostrar o quão "hypado" cada bar está agora, com base nas notas recentes da comunidade.',
        "Montar seu perfil público, nível, moedas e itens de cosmético (avatar/moldura/título).",
        "Confirmar que você está fisicamente perto de um bar antes de liberar uma avaliação, e (se ativado) avisar de bar lotado por perto.",
        "Impedir spam: cada pessoa só pode enviar um report de hype por bar a cada 30 minutos, e uma avaliação por bar a cada 24 horas.",
        "Exibir o mapa (via Google Maps SDK) e localizar o texto buscado (via Geoapify).",
        "Revisar denúncias de conteúdo/usuário e avaliar pedidos de expansão pra novas regiões.",
        "Falar com você em caso de problema na conta, se você entrar em contato primeiro.",
      ],
      paragraphs: [
        "Não usamos seus dados pra anúncio, não fazemos perfilamento de comportamento, e não " +
          "compartilhamos nada com corretoras de dados.",
      ],
    },
    {
      heading: "Com quem compartilhamos",
      paragraphs: [
        "Só com os provedores que fazem o app funcionar — cada um recebe apenas o necessário " +
          "pra sua própria função:",
      ],
      items: [
        {
          label: "Firebase (Google)",
          detail:
            "autenticação de conta, banco de dados (Firestore) onde perfil/reports/avaliações " +
            "ficam guardados, e armazenamento (Storage) das fotos de bar que você envia.",
        },
        {
          label: "Google Maps SDK",
          detail: "exibe o mapa dentro do app, sujeito à política de privacidade do Google.",
        },
        {
          label: "Geoapify",
          detail:
            'transforma o texto que você busca (ex.: "Cidade Baixa, Porto Alegre") em ' +
            "coordenadas de mapa.",
        },
      ],
    },
    {
      heading: "Por quanto tempo guardamos",
      paragraphs: [
        "Enquanto sua conta existir. Um report de hype vale integralmente por 30 minutos, depois " +
          "perde valor na nota do bar, zera com 2 horas sem hype, e todo dia às 12h a nota " +
          "recomeça do zero — mas o " +
          "histórico continua no banco pra fins de consistência, até você excluir sua conta " +
          "(ver seção 05). Localização de GPS nunca é " +
          "gravada: é usada na hora, comparada, e descartada.",
      ],
    },
    {
      heading: "Seus direitos e controles",
      items: [
        { label: "Ver e editar", detail: "seu perfil completo fica em Perfil → editar, dentro do app." },
        {
          label: "Desligar a localização a qualquer momento",
          detail:
            'Perfil → "Bar lotado por perto" tem um interruptor; o check-in por proximidade só ' +
            "é pedido na hora de avaliar.",
        },
        { label: "Sair sem excluir", detail: "Perfil → Sair da conta, a qualquer momento." },
        {
          label: "Excluir a conta",
          detail:
            "Perfil → Excluir conta. Isso apaga, permanentemente e sem como desfazer: sua conta " +
            "de login e perfil (nome, bio, avatar, nível, moedas), suas fotos enviadas " +
            "(removidas do armazenamento) e suas relações de seguir (nos dois sentidos). Os " +
            "hypes e avaliações que você publicou podem continuar no histórico do bar pra não " +
            "distorcer a média da comunidade, mas o vínculo com você é desfeito: passam a " +
            'aparecer como "Conta excluída", sem ligação com o seu perfil. Essa anonimização ' +
            "é concluída em até 15 dias depois da exclusão.",
        },
      ],
    },
    {
      heading: "Idade mínima",
      paragraphs: [
        "O HypeApp mostra informação sobre bares e locais de vida noturna e não é destinado a " +
          "menores de 18 anos. No cadastro, pedimos a confirmação de que você tem 18 anos ou " +
          "mais antes de criar a conta. Não coletamos intencionalmente dados de crianças e " +
          "adolescentes.",
      ],
    },
    {
      heading: "Segurança",
      paragraphs: [
        "Autenticação e banco de dados rodam na infraestrutura do Firebase (Google Cloud), com " +
          "regras de acesso que restringem quem pode ler e escrever cada tipo de dado. Nenhum " +
          "sistema é 100% infalível, mas não guardamos senha em texto puro — isso é feito pelo " +
          "próprio Firebase Authentication.",
        "Fotos de bar são públicas pra qualquer usuário logado — evite mandar fotos com pessoas " +
          "identificáveis sem o consentimento delas, e nunca inclua documentos ou dados " +
          "pessoais na imagem.",
      ],
    },
    {
      heading: "Mudanças nesta política",
      paragraphs: [
        "Se algo relevante mudar (um novo provedor, um novo tipo de dado coletado), atualizamos " +
          "esta página e a data no topo. Mudanças de peso também aparecem dentro do app.",
      ],
    },
    {
      heading: "Contato",
      paragraphs: [
        "Dúvidas sobre privacidade, ou pedido de remoção de dado específico: [e-mail de contato do HypeApp].",
      ],
    },
    {
      heading: "Termos de Uso",
      paragraphs: [
        "As regras de uso do app (o que você pode e não pode fazer, responsabilidades e " +
          "limites) ficam nos Termos de Uso, um documento separado desta política — acesse pelo " +
          "mesmo lugar onde você abriu esta página.",
      ],
    },
  ],
  footer:
    "HypeApp — feito em Porto Alegre. Esta política cobre apenas o app HypeApp, não os bares e locais nele listados.",
};

export const TERMS_OF_SERVICE: LegalDocument = {
  title: "Termos de Uso",
  updatedAt: "24 de setembro de 2026",
  intro:
    "Ao criar uma conta ou usar o HypeApp, você concorda com estas regras. Elas existem pra " +
    "manter o app útil e seguro pra todo mundo que quer saber onde a noite está boa. Leia " +
    "também a nossa Política de Privacidade, que explica quais dados coletamos.",
  sections: [
    {
      heading: "O que é o HypeApp",
      paragraphs: [
        'O HypeApp é um app colaborativo: mostra o quão animado ("hypado") um bar está agora, ' +
          "com base em avaliações e reports enviados pela própria comunidade em tempo real. As " +
          "informações de cada local (horário, endereço, faixa de preço) vêm de dados abertos " +
          "e, quando existe, do próprio dono do estabelecimento — não é uma fonte oficial dos " +
          "bares listados.",
      ],
    },
    {
      heading: "Quem pode usar",
      paragraphs: [
        "Você precisa ter 18 anos ou mais pra criar uma conta — o app trata de vida noturna e " +
          "locais que servem bebida alcoólica. Ao se cadastrar, você declara ter essa idade. " +
          "Contas identificadas como de menores de idade são encerradas.",
      ],
    },
    {
      heading: "Sua conta",
      bullets: [
        "Você é responsável por manter sua senha em sigilo e por tudo que acontecer na sua conta.",
        "O nome de exibição do seu perfil é público — não use o nome de outra pessoa nem se passe por alguém.",
        "Uma pessoa, uma conta. Criar várias contas pra burlar limites (de avaliação, denúncia, etc.) viola estes termos.",
      ],
    },
    {
      heading: "O que você publica",
      paragraphs: [
        "Hypes, avaliações, comentários, fotos e sua bio são conteúdo seu, mas ao publicar você " +
          "autoriza o HypeApp a exibi-los publicamente dentro do app, vinculados ao seu perfil, " +
          "enquanto sua conta existir.",
        "É proibido publicar:",
      ],
      bullets: [
        "Palavrão, discurso de ódio, assédio ou ofensa a outras pessoas.",
        "Spam, link ou propaganda não relacionada ao local avaliado.",
        "Avaliação de um bar onde você comprovadamente não esteve (o check-in por proximidade ajuda a evitar isso).",
        "Fotos com documentos, dados pessoais de terceiros, ou pessoas identificáveis sem o consentimento delas.",
        "Conteúdo ilegal, ou que incentive consumo abusivo de álcool ou outras substâncias.",
      ],
    },
    {
      heading: "Denúncias e moderação",
      paragraphs: [
        "Se você vir uma avaliação ou usuário violando estas regras, use o botão de denúncia " +
          "dentro do app. Denúncias são revisadas pela nossa equipe; denunciar em má-fé (pra " +
          "prejudicar alguém sem motivo real) também viola estes termos.",
      ],
    },
    {
      heading: "Dono de bar (painel do parceiro)",
      paragraphs: [
        "Se seu bar for cadastrado como parceiro, você pode editar horário de funcionamento e " +
          "faixa de preço do seu próprio local pelo painel do parceiro. Essa edição é restrita " +
          "ao dono cadastrado e não altera avaliações nem hypes enviados pela comunidade — só " +
          "as informações do estabelecimento em si.",
      ],
    },
    {
      heading: "Suspensão e encerramento",
      paragraphs: [
        "Podemos remover conteúdo ou suspender/encerrar uma conta que viole estes termos, sem " +
          "aviso prévio em casos graves (assédio, discurso de ódio, atividade fraudulenta). Você " +
          "pode encerrar sua própria conta a qualquer momento em Perfil → Excluir conta — ver o " +
          "que isso apaga na nossa Política de Privacidade.",
      ],
    },
    {
      heading: "Isenção de garantias",
      warning:
        'O HypeApp é fornecido "como está". As informações sobre cada bar (hype, horário, ' +
        "endereço, preço) vêm da comunidade e podem estar desatualizadas ou incorretas — sempre " +
        "confira diretamente com o local antes de ir. Não nos responsabilizamos por decisões " +
        "tomadas com base nessas informações, nem por qualquer interação entre usuários ou " +
        "entre usuário e estabelecimento.",
    },
    {
      heading: "Propriedade intelectual",
      paragraphs: [
        "A marca, o ícone e o visual do HypeApp pertencem ao HypeApp. O conteúdo que você " +
          "publica continua seu, mas fica licenciado pra exibição no app conforme a seção 04.",
      ],
    },
    {
      heading: "Mudanças nestes termos",
      paragraphs: [
        "Podemos atualizar estes termos conforme o app evolui. Mudanças relevantes aparecem " +
          "dentro do app; continuar usando o HypeApp depois de uma atualização significa que " +
          "você concorda com a nova versão.",
      ],
    },
    {
      heading: "Lei aplicável",
      paragraphs: [
        "Estes termos são regidos pelas leis do Brasil. Qualquer disputa relacionada ao HypeApp " +
          "é submetida ao foro da comarca de Porto Alegre/RS, salvo disposição legal em contrário.",
      ],
    },
    {
      heading: "Contato",
      paragraphs: ["Dúvidas sobre estes termos: [e-mail de contato do HypeApp]."],
    },
  ],
  footer:
    "HypeApp — feito em Porto Alegre. Estes termos cobrem apenas o uso do app, não os bares e locais nele listados.",
};
