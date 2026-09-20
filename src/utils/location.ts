import type { CityLocation } from "@/types/location";

// Texto exibido pra região atual: "Cidade Baixa, Porto Alegre" pros
// bairros cadastrados, "Ipanema, MG" pra uma cidade vinda da busca livre,
// só o nome quando não há mais nada a dizer (ex: o nome de um bar).
export function locationLabel(location: CityLocation): string {
  return [location.name, location.city || location.state].filter(Boolean).join(", ");
}
