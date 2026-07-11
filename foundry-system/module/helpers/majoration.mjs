import { EDC } from "./config.mjs";

/** Construit les options d'un select de Majoration (p.216/p.250), partagées entre Techniques et Rituels. */
export function construireOptionsMajoration(majorationActuelle, formatter) {
  return EDC.majorationRituel.map((ligne, idx) => ({
    value: idx,
    label: `${idx} pt(s) — ${formatter(ligne)}`,
    selected: idx === (majorationActuelle ?? 0)
  }));
}
