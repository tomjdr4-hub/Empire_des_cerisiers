import { EDC } from "../helpers/config.mjs";
import { ouvrirJetDialogue } from "../helpers/dice.mjs";
import { rollAttaque, rollReveilInconscience, toggleEquipeArme, toggleEquipeArmure } from "../helpers/combat.mjs";
import { rollSoins, rollRepos } from "../helpers/soins.mjs";
import { rollResisterPeurIntimidation } from "../helpers/peur.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export class PnjSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["edc", "pnj"],
    position: { width: 640, height: 620 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      editImage: PnjSheet.#onEditImage,
      rollLibre: PnjSheet.#onRollLibre,
      rollChamp: PnjSheet.#onRollChamp,
      rollVolonte: PnjSheet.#onRollVolonte,
      rollAttaque: PnjSheet.#onRollAttaque,
      toggleEquipeArme: PnjSheet.#onToggleEquipeArme,
      toggleEquipeArmure: PnjSheet.#onToggleEquipeArmure,
      rollReveil: PnjSheet.#onRollReveil,
      rollResisterPeur: PnjSheet.#onRollResisterPeur,
      rollResisterIntimidation: PnjSheet.#onRollResisterIntimidation,
      rollSoins: PnjSheet.#onRollSoins,
      rollRepos: PnjSheet.#onRollRepos,
      itemCreer: PnjSheet.#onItemCreer,
      itemModifier: PnjSheet.#onItemModifier,
      itemSupprimer: PnjSheet.#onItemSupprimer,
      toggleBlessure: PnjSheet.#onToggleBlessure
    }
  };

  static PARTS = {
    body: { template: `systems/${EDC.id}/templates/actor/pnj-sheet.hbs`, scrollable: [""] }
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
    context.estInconscient = actor.system.blessures?.palier?.id === "invalidite";
    return context;
  }

  static async #onEditImage(event, target) {
    const attr = target.dataset.edit;
    const current = foundry.utils.getProperty(this.actor, attr);
    const fp = new foundry.applications.apps.FilePicker.implementation({
      current,
      type: "image",
      callback: (path) => this.actor.update({ [attr]: path })
    });
    return fp.browse();
  }

  static async #onRollLibre() {
    await ouvrirJetDialogue(this.actor, { titre: "Jet libre" });
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

  static async #onToggleEquipeArme(event, target) {
    const arme = this.actor.items.get(target.closest("[data-item-id]").dataset.itemId);
    if (arme) await toggleEquipeArme(arme);
  }

  static async #onToggleEquipeArmure(event, target) {
    const armure = this.actor.items.get(target.closest("[data-item-id]").dataset.itemId);
    if (armure) await toggleEquipeArmure(this.actor, armure);
  }

  static async #onRollReveil() {
    await rollReveilInconscience(this.actor);
  }

  static async #onRollResisterPeur() {
    await rollResisterPeurIntimidation(this.actor, "peur");
  }

  static async #onRollResisterIntimidation() {
    await rollResisterPeurIntimidation(this.actor, "intimidation");
  }

  static async #onRollSoins() {
    await rollSoins(this.actor);
  }

  static async #onRollRepos() {
    await rollRepos(this.actor);
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
