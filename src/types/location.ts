// Região que o usuário pode selecionar para ver o ranking local: um
// ponto no mapa com um raio, não um "dono" dos bares. Os bares não
// pertencem a região nenhuma — quem está dentro dela é decidido só pela
// distância (ver src/utils/geo.ts), então um bar aparece onde ele está,
// exista ou não um bairro cadastrado ali.
//
// "name" é o que exibir: um bairro cadastrado (src/data/locations.ts),
// uma rua ou cidade vinda da busca livre, ou o nome de um bar.
export interface CityLocation {
  id: string;
  name: string;
  city: string; // "" quando não faz sentido/ não se sabe
  state: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
}
