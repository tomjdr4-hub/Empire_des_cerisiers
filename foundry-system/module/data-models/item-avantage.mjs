const { NumberField, HTMLField } = foundry.data.fields;

export class AvantageData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      // Plafond à 3 pour la création de PJ (imposé par creation-app.mjs), mais les PNJ, Mononoke et
      // objets magiques (armures sacrées jusqu'à +8, p.242-243) peuvent avoir des valeurs bien plus élevées.
      valeur: new NumberField({ required: true, integer: true, initial: 1, min: 1, max: 10 }),
      description: new HTMLField({ required: false, initial: "" })
    };
  }
}
