import { EDC } from "../helpers/config.mjs";

const { SchemaField, NumberField, StringField, HTMLField } = foundry.data.fields;

export class PnjData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      categorie: new StringField({
        required: true,
        initial: "secondRole",
        choices: ["premierRole", "secondRole", "figurant"]
      }),
      concept: new StringField({ required: true, initial: "" }),
      voie: new SchemaField({
        nom: new StringField({ required: true, initial: "" }),
        niveau: new NumberField({ required: true, integer: true, initial: 0, min: 0, max: 8 })
      }),
      combat: new SchemaField({
        actionsParTour: new NumberField({ required: true, integer: true, initial: 1, min: 0 })
      }),
      blessures: new SchemaField({
        value: new NumberField({ required: true, integer: true, initial: 0, min: 0 })
      }),
      notes: new HTMLField({ required: false, initial: "" })
    };
  }

  prepareDerivedData() {
    const table = this.categorie === "premierRole" ? EDC.blessuresPersonnage : EDC.blessuresSecondRole;
    const palier = EDC.resoudrePalierBlessure(this.blessures.value, table);
    this.blessures.palier = palier;
    this.blessures.malus = palier.malus ?? 0;
    this.blessures.echecAutomatique = !!palier.echecAutomatique;

    const capacite = table[table.length - 1].seuil - 1;
    this.vitalite = {
      value: Math.max(0, capacite - this.blessures.value),
      max: capacite
    };
  }
}
