const { NumberField, StringField, HTMLField } = foundry.data.fields;

export class AspectData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      voie: new StringField({ required: false, initial: "" }),
      niveau: new NumberField({ required: true, integer: true, initial: 1, min: 0, max: 8 }),
      description: new HTMLField({ required: false, initial: "" })
    };
  }
}
