import type { ImageSourcePropType } from "react-native";

// Logos reais dos bares, com autorização deles pra uso no app — empacotadas
// como asset local (não como logoUrl no Firestore) porque a escrita nesse
// campo dos documentos existentes não está liberada nas regras hoje; um
// asset bundlado no app nem depende disso. Chave = Venue.id.
export const VENUE_LOGOS: Record<string, ImageSourcePropType> = {
  "cb-1": require("../../assets/venue-logos/cb-1-boteco-do-joaquim.jpg"),
  "cb-2": require("../../assets/venue-logos/cb-2-paralela.jpg"),
  "cb-3": require("../../assets/venue-logos/cb-3-matita-pere.jpg"),
  "cb-4": require("../../assets/venue-logos/cb-4-sgt-peppers.jpg"),
  "cb-5": require("../../assets/venue-logos/cb-5-capone-drinkeria.webp"),
  "cb-6": require("../../assets/venue-logos/cb-6-mambembe.jpg"),
  "bf-6": require("../../assets/venue-logos/bf-6-apricot-bistro.jpg"),
};
