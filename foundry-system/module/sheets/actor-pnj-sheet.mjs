import { EDC } from "../helpers/config.mjs";
import { ouvrirJetDialogue } from "../helpers/dice.mjs";
import { rollAttaque } from "../helpers/combat.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export class PnjSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["edc", "pnj"],
    position: { width: 640, height: 620 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      rollChamp: PnjSheet.#onRollChamp,
      rollVolonte: PnjSheet.#onRollVolonte,
      rollAttaque: PnjSheet.#onRollAttaque,
      itemCreer: PnjSheet.#onItemCreer,
      itemModifier: PnjSheet.#onItemModifier,
      itemSupprimer: PnjSheet.#onItemSupprimer,
      toggleBlessure: PnjSheet.#onToggleBlessure
    }
  };

  static PARTS = {
    body: { template: `systems/${EDC.id}/templates/actor/pnj-sheet.hbs` }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.actor;
    context.actor = actor;
    context.system = actor.system;
    context.items = {
      champs: actor.items.filter((i) => i.type === "champ"),
      armes: actor.items.filter((i) => i.type === "arme"),
      armures: actor.items.filter((i) => i.type === "armure")
    };
    const categories = { premierRole: "Premier rôle", secondRole: "Second rôle", figurant: "Figurant" };
    context.categorieOptions = Object.entries(categories).map(([value, label]) => ({
      value, label, selected: value === actor.system.categorie
    }));
    const table = actor.system.categorie === "premierRole" ? EDC.blessuresPersonnage : EDC.blessuresSecondRole;
    context.blessuresGrille = EDC.construireGrilleBlessures(table, actor.system.blessures.value);
    return context;
  }

  static async #onRollChamp(event, target) {
    const champ = this.actor.items.get(target.closest("[data-item-id]").dataset.itemId);
    if (champ) await ouvrirJetDialogue(this.actor, { titre: `Jet : ${champ.name}`, champId: champ.id });
  }

  static async #onRollVolonte() {
    await ouvrirJetDialogue(this.actor, {
      titre: "Résistance mentale (Volonté)",
      bonusFixe: this.actor.system.resistanceMentale ?? 0,
      bonusFixeLabel: "Voie+Champ"
    });
  }

  static async #onRollAttaque(event, target) {
    const arme = this.actor.items.get(target.closest("[data-item-id]").dataset.itemId);
    if (arme) await rollAttaque(this.actor, arme);
  }

  static async #onItemCreer(event, target) {
    const type = target.dataset.type;
    const noms = { champ: "Nouveau Champ", arme: "Nouvelle Arme", armure: "Nouvelle Armure" };
    const [item] = await this.actor.createEmbeddedDocuments("Item", [{ name: noms[type] ?? "Nouvel Item", type }]);
    item?.sheet.render(true);
  }

  static async #onItemModifier(event, target) {
    const item = this.actor.items.get(target.closest("[data-item-id]").dataset.itemId);
    item?.sheet.render(true);
  }

  static async #onItemSupprimer(event, target) {
    const item = this.actor.items.get(target.closest("[data-item-id]").dataset.itemId);
    await item?.delete();
  }

  static async #onToggleBlessure(event, target) {
    const idx = Number(target.dataset.index);
    const actuel = this.actor.system.blessures.value;
    const nouveau = idx + 1 === actuel ? idx : idx + 1;
    await this.actor.update({ "system.blessures.value": nouveau });
  }
}
