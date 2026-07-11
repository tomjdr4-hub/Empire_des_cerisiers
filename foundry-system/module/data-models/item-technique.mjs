const { SchemaField, NumberField, StringField, HTMLField } = foundry.data.fields;

export class TechniqueData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      puissance: new NumberField({ required: true, integer: true, initial: 5, min: 1 }),
      aspect: new StringField({ required: false, initial: "" }),
      voie: new StringField({ required: false, initial: "" }),
      // Niveau de l'Aspect au moment de la création : les points de Puissance non dépensés à ce
      // niveau sont perdus au niveau suivant (p.212-214), donc le budget disponible ne se calcule
      // que parmi les techniques créées au niveau actuel de l'Aspect.
      niveauAspectCreation: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
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
