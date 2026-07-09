const { NumberField, StringField, BooleanField, HTMLField } = foundry.data.fields;

export class ArmeData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      facteurDegats: new NumberField({ required: true, integer: true, initial: 1, min: 0 }),
      bonusMalusInitiative: new NumberField({ required: true, integer: true, initial: 0 }),
      portee: new StringField({ required: false, initial: "Mêlée" }),
      equipe: new BooleanField({ initial: false }),
      notes: new HTMLField({ required: false, initial: "" })
    };
  }
}
