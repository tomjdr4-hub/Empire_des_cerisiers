import { EDC } from "../helpers/config.mjs";
import { ouvrirJetDialogue } from "../helpers/dice.mjs";
import { rollAttaque, rollDefense, rollReveilInconscience, toggleEquipeArme, toggleEquipeArmure } from "../helpers/combat.mjs";
import { activerTechnique, ouvrirCalculateurTechnique, ouvrirCreationTechnique } from "../helpers/techniques.mjs";
import { lancerRituel, ouvrirCalculateurRituel, ouvrirCreationRituel } from "../helpers/rituels.mjs";
import { XpApp } from "../apps/xp-app.mjs";
import { CreationApp } from "../apps/creation-app.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

const TABS_DEF = [
  { id: "champs", label: "Champs" },
  { id: "avantages", label: "Avantages" },
  { id: "voie", label: "Voie" },
  { id: "rituels", label: "Rituels" },
  { id: "equipement", label: "Équipement" },
  { id: "divers", label: "Divers" }
];

export class PersonnageSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["edc", "personnage"],
    position: { width: 860, height: 780 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      switchTab: PersonnageSheet.#onSwitchTab,
      editImage: PersonnageSheet.#onEditImage,
      ouvrirCreation: PersonnageSheet.#onOuvrirCreation,
      ouvrirMonteeXP: PersonnageSheet.#onOuvrirMonteeXP,
      rollLibre: PersonnageSheet.#onRollLibre,
      rollChamp: PersonnageSheet.#onRollChamp,
      rollVolonte: PersonnageSheet.#onRollVolonte,
      rollDefense: PersonnageSheet.#onRollDefense,
      rollAttaque: PersonnageSheet.#onRollAttaque,
      toggleEquipeArme: PersonnageSheet.#onToggleEquipeArme,
      toggleEquipeArmure: PersonnageSheet.#onToggleEquipeArmure,
      rollReveil: PersonnageSheet.#onRollReveil,
      resetSursaut: PersonnageSheet.#onResetSursaut,
      activerTechnique: PersonnageSheet.#onActiverTechnique,
      creerTechnique: PersonnageSheet.#onCreerTechnique,
      calculerTechnique: PersonnageSheet.#onCalculerTechnique,
      lancerRituel: PersonnageSheet.#onLancerRituel,
      creerRituel: PersonnageSheet.#onCreerRituel,
      calculerRituel: PersonnageSheet.#onCalculerRituel,
      itemCreer: PersonnageSheet.#onItemCreer,
      itemModifier: PersonnageSheet.#onItemModifier,
      itemSupprimer: PersonnageSheet.#onItemSupprimer,
      toggleBlessure: PersonnageSheet.#onToggleBlessure
    }
  };

  static PARTS = {
    body: { template: `systems/${EDC.id}/templates/actor/personnage-sheet.hbs` }
  };

  #activeTab = "champs";

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.actor;
    context.actor = actor;
    context.system = actor.system;
    context.items = {
      champs: actor.items.filter((i) => i.type === "champ"),
      avantages: actor.items.filter((i) => i.type === "avantage"),
      desavantages: actor.items.filter((i) => i.type === "desavantage"),
      aspects: actor.items.filter((i) => i.type === "aspect"),
      techniques: actor.items.filter((i) => i.type === "technique"),
      rituels: actor.items.filter((i) => i.type === "rituel"),
      armes: actor.items.filter((i) => i.type === "arme"),
      armures: actor.items.filter((i) => i.type === "armure"),
      objets: actor.items.filter((i) => i.type === "objet")
    };
    context.voiesNoms = Object.values(EDC.voies).map((v) => v.nom);
    context.estAuxPortesDeLaMort = actor.system.blessures?.palier?.id === "portesDeLaMort";
    context.sursautUtilise = actor.system.blessures?.portesDeLaMortUtilisee ?? false;
    context.estInconscient = actor.system.blessures?.palier?.id === "invalidite";
    context.blessuresGrille = EDC.construireGrilleBlessures(EDC.blessuresPersonnage, actor.system.blessures.value);
    context.tabsDef = TABS_DEF.map((t) => ({ ...t, active: t.id === this.#activeTab }));
    context.tabActive = Object.fromEntries(TABS_DEF.map((t) => [t.id, t.id === this.#activeTab]));
    return context;
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    this.#appliquerOngletActif();
  }

  #appliquerOngletActif() {
    for (const el of this.element.querySelectorAll(".edc-tab-panel")) {
      el.classList.toggle("active", el.dataset.tab === this.#activeTab);
    }
    for (const btn of this.element.querySelectorAll(".edc-tab-button")) {
      btn.classList.toggle("active", btn.dataset.tab === this.#activeTab);
    }
  }

  static #onSwitchTab(event, target) {
    this.#activeTab = target.dataset.tab;
    this.#appliquerOngletActif();
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

  static async #onOuvrirCreation() {
    new CreationApp({ actor: this.actor, id: `edc-creation-app-${this.actor.id}` }).render(true);
  }

  static async #onOuvrirMonteeXP() {
    new XpApp({ actor: this.actor, id: `edc-xp-app-${this.actor.id}` }).render(true);
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

  static async #onRollDefense() {
    await rollDefense(this.actor);
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

  static async #onResetSursaut() {
    await this.actor.update({
      "system.blessures.portesDeLaMortActive": false,
      "system.blessures.portesDeLaMortUtilisee": false
    });
  }

  static async #onActiverTechnique(event, target) {
    event.preventDefault();
    const technique = this.actor.items.get(target.closest("[data-item-id]").dataset.itemId);
    if (technique) await activerTechnique(this.actor, technique);
  }

  static async #onCreerTechnique() {
    await ouvrirCreationTechnique(this.actor);
  }

  static async #onCalculerTechnique() {
    await ouvrirCalculateurTechnique(this.actor);
  }

  static async #onLancerRituel(event, target) {
    const rituel = this.actor.items.get(target.closest("[data-item-id]").dataset.itemId);
    if (rituel) await lancerRituel(this.actor, rituel);
  }

  static async #onCreerRituel() {
    await ouvrirCreationRituel(this.actor);
  }

  static async #onCalculerRituel(event, target) {
    const rituel = this.actor.items.get(target.closest("[data-item-id]").dataset.itemId);
    if (rituel) await ouvrirCalculateurRituel(rituel);
  }

  static async #onItemCreer(event, target) {
    const type = target.dataset.type;
    const noms = {
      champ: "Nouveau Champ", avantage: "Nouvel Avantage", desavantage: "Nouveau Désavantage",
      aspect: "Nouvel Aspect", technique: "Nouvelle Technique", rituel: "Nouveau Rituel",
      arme: "Nouvelle Arme", armure: "Nouvelle Armure", objet: "Nouvel Objet"
    };
    const [item] = await this.actor.createEmbeddedDocuments("Item", [{ name: noms[type] ?? "Nouvel Item", type }]);
    item?.sheet.render(true);
  }

  static async #onItemModifier(event, target) {
    event.preventDefault();
    const item = this.actor.items.get(target.closest("[data-item-id]").dataset.itemId);
    item?.sheet.render(true);
  }

  static async #onItemSupprimer(event, target) {
    event.preventDefault();
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
