const { NumberField, HTMLField } = foundry.data.fields;

export class ObjetData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      quantite: new NumberField({ required: true, integer: true, initial: 1, min: 0 }),
      description: new HTMLField({ required: false, initial: "" })
    };
  }
}
