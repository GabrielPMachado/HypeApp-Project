// Região que o usuário pode selecionar para ver o ranking local.
// "available" indica se o HypeApp já tem parceiros/dados nessa região —
// alinhado à estratégia de lançamento hiper-local descrita no README
// (MVP exclusivo na Cidade Baixa, expansão depois da validação).
export interface CityLocation {
  id: string;
  neighborhood: string;
  city: string;
  state: string;
  available: boolean;
  // Só preenchido pra região vinda de busca livre (ver
  // LocationPickerModal), geocodificada na hora — permite centralizar o
  // mapa ali mesmo sem nenhum bar cadastrado. Bairros fixos (src/data/locations.ts)
  // não precisam disso: o mapa se enquadra pelos próprios bares.
  latitude?: number;
  longitude?: number;
}
