const { NumberField, StringField, HTMLField } = foundry.data.fields;

export class TechniqueData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      puissance: new NumberField({ required: true, integer: true, initial: 5, min: 1 }),
      aspect: new StringField({ required: false, initial: "" }),
      voie: new StringField({ required: false, initial: "" }),
      description: new HTMLField({ required: false, initial: "" })
    };
  }
}
