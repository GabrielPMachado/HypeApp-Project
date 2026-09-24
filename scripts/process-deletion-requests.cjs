// Conclui a anonimização de quem excluiu a conta (ver cleanupUserData em
// src/context/AuthContext.tsx): troca o nome por "Conta excluída" e tira o
// authorId dos hypes/avaliações/fotos que sobraram, e apaga o pedido.
//
// Prazo prometido na Política de Privacidade: até 15 dias depois da exclusão.
//
// Uso (precisa de uma chave de conta de serviço: Console do Firebase →
// Configurações do projeto → Contas de serviço → Gerar nova chave privada):
//   npm install --no-save firebase-admin
//   GOOGLE_APPLICATION_CREDENTIALS=caminho/da/chave.json node scripts/process-deletion-requests.cjs
//   ... --apply     (sem isso só mostra o que faria)

const admin = require("firebase-admin");

const apply = process.argv.includes("--apply");
const DELETED_LABEL = "Conta excluída";

admin.initializeApp();
const db = admin.firestore();

function anonymize(items, uid) {
  let changed = 0;
  const next = (items || []).map((item) => {
    if (item.authorId !== uid) return item;
    changed += 1;
    const { authorId, ...rest } = item;
    return { ...rest, authorName: DELETED_LABEL };
  });
  return { next, changed };
}

async function accountStillExists(uid) {
  try {
    await admin.auth().getUser(uid);
    return true;
  } catch (error) {
    if (error.code === "auth/user-not-found") return false;
    throw error;
  }
}

(async () => {
  const requests = await db.collection("deletionRequests").get();
  console.log(`${requests.size} pedido(s) de exclusão. Modo: ${apply ? "APLICAR" : "simulação"}`);
  if (requests.empty) return;

  const venues = await db.collection("venues").get();

  for (const request of requests.docs) {
    const uid = request.id;
    if (await accountStillExists(uid)) {
      console.log(`- ${uid}: a conta ainda existe, pulando (pedido mantido).`);
      continue;
    }

    let touched = 0;
    for (const venueDoc of venues.docs) {
      const venue = venueDoc.data();
      const hype = anonymize(venue.hypeReports, uid);
      const reviews = anonymize(venue.reviews, uid);
      const photos = (venue.photos || []).filter((p) => p.authorId !== uid);
      const photosRemoved = (venue.photos || []).length - photos.length;
      if (!hype.changed && !reviews.changed && !photosRemoved) continue;

      touched += hype.changed + reviews.changed + photosRemoved;
      console.log(
        `  ${venueDoc.id}: ${hype.changed} hype(s), ${reviews.changed} avaliação(ões), ${photosRemoved} foto(s)`
      );
      if (apply) {
        await venueDoc.ref.update({
          hypeReports: hype.next,
          reviews: reviews.next,
          photos,
        });
      }
    }

    console.log(`- ${uid}: ${touched} item(ns) ${apply ? "anonimizados" : "a anonimizar"}.`);
    if (apply) await request.ref.delete();
  }
})().catch((error) => {
  console.error("Falhou:", error.message);
  process.exit(1);
});
