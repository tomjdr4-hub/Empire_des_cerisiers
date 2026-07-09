const { NumberField, HTMLField } = foundry.data.fields;

export class AvantageData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      valeur: new NumberField({ required: true, integer: true, initial: 1, min: 1, max: 3 }),
      description: new HTMLField({ required: false, initial: "" })
    };
  }
}
