const { SchemaField, NumberField, StringField, HTMLField } = foundry.data.fields;

export class TechniqueData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      puissance: new NumberField({ required: true, integer: true, initial: 5, min: 1 }),
      aspect: new StringField({ required: false, initial: "" }),
      voie: new StringField({ required: false, initial: "" }),
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
