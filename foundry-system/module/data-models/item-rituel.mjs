const { SchemaField, NumberField, StringField, HTMLField } = foundry.data.fields;

export class RituelData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      champ: new StringField({ required: false, initial: "" }),
      difficulte: new NumberField({ required: true, integer: true, initial: 8, min: 8 }),
      majoration: new SchemaField({
        portee: new NumberField({ required: true, integer: true, initial: 0, min: 0, max: 6 }),
        duree: new NumberField({ required: true, integer: true, initial: 0, min: 0, max: 6 }),
        degatsSoins: new NumberField({ required: true, integer: true, initial: 0, min: 0, max: 6 }),
        cibles: new NumberField({ required: true, integer: true, initial: 0, min: 0, max: 6 }),
        invocation: new NumberField({ required: true, integer: true, initial: 0, min: 0, max: 6 }),
        bonusMalus: new NumberField({ required: true, integer: true, initial: 0, min: 0, max: 6 })
      }),
      description: new HTMLField({ required: false, initial: "" })
    };
  }
}
