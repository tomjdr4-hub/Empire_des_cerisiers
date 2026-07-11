import { EDC } from "../helpers/config.mjs";

const { SchemaField, NumberField, StringField, BooleanField, HTMLField } = foundry.data.fields;

export class PersonnageData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      concept: new StringField({ required: true, initial: "" }),
      origines: new StringField({ required: true, initial: "" }),
      xp: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
      voie: new SchemaField({
        nom: new StringField({ required: true, initial: "" }),
        niveau: new NumberField({ required: true, integer: true, initial: 0, min: 0, max: 8 })
      }),
      combat: new SchemaField({
        actionsParTour: new NumberField({ required: true, integer: true, initial: 1, min: 0 })
      }),
      blessures: new SchemaField({
        value: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
        portesDeLaMortActive: new BooleanField({ initial: false }),
        portesDeLaMortUtilisee: new BooleanField({ initial: false }),
        soinsRecusAujourdhui: new BooleanField({ initial: false })
      }),
      // 1 ryu = 4 koku = 40 gin = 4000 mon (p.259)
      argent: new SchemaField({
        ryu: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
        koku: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
        gin: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
        mon: new NumberField({ required: true, integer: true, initial: 0, min: 0 })
      }),
      divers: new HTMLField({ required: false, initial: "" }),
      biographie: new HTMLField({ required: false, initial: "" })
    };
  }

  prepareDerivedData() {
    const table = EDC.blessuresPersonnage;
    const palier = EDC.resoudrePalierBlessure(this.blessures.value, table);
    this.blessures.palier = palier;
    this.blessures.echecAutomatique = !!palier.echecAutomatique;

    if (palier.id === "portesDeLaMort" && this.blessures.portesDeLaMortActive) {
      this.blessures.malus = palier.bonusPortesDeLaMort ?? 0;
    } else {
      this.blessures.malus = palier.malus ?? -9;
    }

    const capacite = table[table.length - 1].seuil - 1; // 30 : dernier seuil "normal" avant invalidité
    this.vitalite = {
      value: Math.max(0, capacite - this.blessures.value),
      max: capacite
    };
  }
}
