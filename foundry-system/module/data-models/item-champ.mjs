const { SchemaField, NumberField, StringField, BooleanField, HTMLField, ArrayField } = foundry.data.fields;

export class ChampData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      niveau: new NumberField({ required: true, integer: true, initial: 1, min: 0, max: 8 }),
      bonus: new NumberField({ required: true, integer: true, initial: 0 }),
      initiative: new BooleanField({ initial: false }),
      description: new HTMLField({ required: false, initial: "" }),
      specialisations: new ArrayField(
        new SchemaField({
          nom: new StringField({ required: true, initial: "" }),
          niveau: new NumberField({ required: true, integer: true, initial: 1, min: 1 }),
          description: new HTMLField({ required: false, initial: "" })
        })
      )
    };
  }
}
