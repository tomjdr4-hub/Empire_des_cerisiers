const { NumberField, BooleanField, HTMLField } = foundry.data.fields;

export class ArmureData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      protection: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
      malusInitiative: new NumberField({ required: true, integer: true, initial: 0 }),
      bonusForce: new NumberField({ required: true, integer: true, initial: 0 }),
      equipe: new BooleanField({ initial: false }),
      notes: new HTMLField({ required: false, initial: "" })
    };
  }
}
