// Remove os hypes e avaliações INVENTADOS que vieram dos dados de exemplo
// (src/data/mockVenues.ts, semeados no Firestore) e deixa só o conteúdo de
// gente de verdade.
//
// Como distingue: os itens de exemplo são criados por hr()/rv() no mock, com
// id "hr-12", "rv-3" (ou "hr-mb-1") e SEM authorId. Posts reais têm o id
// prefixado pelo bar ("cb-6-hr-1790…") e o authorId de quem postou.
//
// Uso (precisa de uma chave de conta de serviço: Console do Firebase →
// Configurações do projeto → Contas de serviço → Gerar nova chave privada;
// guarde o arquivo FORA da pasta do projeto e nunca o commite):
//   npm install --no-save firebase-admin
//   GOOGLE_APPLICATION_CREDENTIALS=caminho/da/chave.json node scripts/purge-seed-content.cjs
//   ... --apply     (sem isso só mostra o que faria)
// Com --apply, antes de gravar salva um backup dos bares alterados em
// .scratch/backup-venues-<data>.json.

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const apply = process.argv.includes("--apply");
const isSeed = (item) => !item.authorId && /^(hr|rv)-/.test(String(item.id));

admin.initializeApp();
const db = admin.firestore();

(async () => {
  const snapshot = await db.collection("venues").get();
  const changes = [];
  let seedHype = 0;
  let seedReviews = 0;
  let keptHype = 0;
  let keptReviews = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const hype = data.hypeReports || [];
    const reviews = data.reviews || [];
    const nextHype = hype.filter((item) => !isSeed(item));
    const nextReviews = reviews.filter((item) => !isSeed(item));
    const removedHype = hype.length - nextHype.length;
    const removedReviews = reviews.length - nextReviews.length;
    keptHype += nextHype.length;
    keptReviews += nextReviews.length;
    if (!removedHype && !removedReviews) continue;

    seedHype += removedHype;
    seedReviews += removedReviews;
    console.log(
      `  ${doc.id} (${data.name}): remove ${removedHype} hype(s) e ${removedReviews} avaliação(ões); ` +
        `mantém ${nextHype.length} e ${nextReviews.length}`
    );
    changes.push({ doc, hype, reviews, nextHype, nextReviews });
  }

  console.log(
    `${snapshot.size} bares. De exemplo: ${seedHype} hype(s) e ${seedReviews} avaliação(ões). ` +
      `De gente real (mantidos): ${keptHype} hype(s) e ${keptReviews} avaliação(ões).`
  );
  if (!apply) {
    console.log("Simulação: nada foi gravado. Rode com --apply para aplicar.");
    return;
  }
  if (changes.length === 0) return;

  const backupDir = path.join(__dirname, "..", ".scratch");
  fs.mkdirSync(backupDir, { recursive: true });
  const backupFile = path.join(backupDir, `backup-venues-${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(
    backupFile,
    JSON.stringify(
      changes.map((c) => ({ id: c.doc.id, hypeReports: c.hype, reviews: c.reviews })),
      null,
      2
    )
  );
  console.log(`Backup salvo em ${backupFile}`);

  for (const c of changes) {
    await c.doc.ref.update({ hypeReports: c.nextHype, reviews: c.nextReviews });
  }
  console.log(`Pronto: ${changes.length} bar(es) atualizado(s).`);
})().catch((error) => {
  console.error("Falhou:", error.message);
  process.exit(1);
});
