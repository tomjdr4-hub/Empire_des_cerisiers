const { NumberField, HTMLField } = foundry.data.fields;

export class DesavantageData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      valeur: new NumberField({ required: true, integer: true, initial: -1, min: -5, max: -1 }),
      description: new HTMLField({ required: false, initial: "" })
    };
  }
}
