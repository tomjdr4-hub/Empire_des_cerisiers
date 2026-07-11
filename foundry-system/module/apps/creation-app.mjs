import { EDC } from "../helpers/config.mjs";
import { ouvrirCreationTechnique } from "../helpers/techniques.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ApplicationV2 } = foundry.applications.api;

const TPL = `systems/${EDC.id}/templates/apps`;

const CHAMP_POINTS = 6;
const CHAMP_NIVEAU_MAX_CREATION = 5;
const SPEC_POINTS = 10;
const AVANTAGE_POINTS_MAX = 7;
const AVANTAGE_NIVEAU_MAX = 3;

/**
 * Assistant de création de personnage (Livre de règles p.202-210) : répartition des 6 points de
 * Champs, des 10 points de Spécialisations, choix de la Voie et d'un Aspect, et des 7 points
 * d'Avantages/Désavantages équilibrés.
 */
export class CreationApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    classes: ["edc", "edc-creation-app"],
    position: { width: 620, height: 700 },
    window: { resizable: true, title: "Création de personnage" },
    actions: {
      champCreer: CreationApp.#onChampCreer,
      champUp: CreationApp.#onChampUp,
      champDown: CreationApp.#onChampDown,
      champSupprimer: CreationApp.#onChampSupprimer,
      specAjouter: CreationApp.#onSpecAjouter,
      specUp: CreationApp.#onSpecUp,
      specDown: CreationApp.#onSpecDown,
      specSupprimer: CreationApp.#onSpecSupprimer,
      voieDefinir: CreationApp.#onVoieDefinir,
      voieReinitialiser: CreationApp.#onVoieReinitialiser,
      aspectAjouter: CreationApp.#onAspectAjouter,
      aspectSupprimer: CreationApp.#onAspectSupprimer,
      creerTechnique: CreationApp.#onCreerTechnique,
      avantageAjouter: CreationApp.#onAvantageAjouter,
      avantageUp: CreationApp.#onAvantageUp,
      avantageDown: CreationApp.#onAvantageDown,
      avantageSupprimer: CreationApp.#onAvantageSupprimer,
      desavantageAjouter: CreationApp.#onDesavantageAjouter,
      desavantageUp: CreationApp.#onDesavantageUp,
      desavantageDown: CreationApp.#onDesavantageDown,
      desavantageSupprimer: CreationApp.#onDesavantageSupprimer,
      terminerCreation: CreationApp.#onTerminerCreation
    }
  };

  static PARTS = {
    body: { template: `${TPL}/creation-app.hbs`, scrollable: [""] }
  };

  constructor(options) {
    super(options);
    this.actor = options.actor;
  }

  /** @override */
  get title() {
    return `Création de personnage — ${this.actor.name}`;
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.actor;

    const champsItems = actor.items.filter((i) => i.type === "champ");
    const champTotal = champsItems.reduce((s, c) => s + c.system.niveau, 0);
    const specTotal = champsItems.reduce(
      (s, c) => s + (c.system.specialisations ?? []).reduce((s2, sp) => s2 + sp.niveau, 0), 0
    );

    context.champPoints = { total: CHAMP_POINTS, depenses: champTotal, restants: CHAMP_POINTS - champTotal };
    context.specPoints = { total: SPEC_POINTS, depenses: specTotal, restants: SPEC_POINTS - specTotal };

    context.champs = champsItems.map((champ) => ({
      id: champ.id,
      nom: champ.name,
      niveau: champ.system.niveau,
      peutMonter: champ.system.niveau < CHAMP_NIVEAU_MAX_CREATION && champTotal < CHAMP_POINTS,
      peutDescendre: champ.system.niveau > 0,
      specialisations: (champ.system.specialisations ?? []).map((spec, idx) => ({
        champId: champ.id,
        idx,
        nom: spec.nom,
        niveau: spec.niveau,
        peutMonter: spec.niveau < champ.system.niveau && specTotal < SPEC_POINTS,
        peutDescendre: spec.niveau > 1
      }))
    }));

    const voieNom = actor.system.voie?.nom || "";
    const voieDef = Object.values(EDC.voies).find((v) => v.nom === voieNom);
    context.voie = {
      nom: voieNom,
      niveau: actor.system.voie?.niveau ?? 0,
      voiesNoms: Object.values(EDC.voies).map((v) => v.nom)
    };
    context.aspectsDisponibles = voieDef?.aspects ?? [];
    const aspectsItems = actor.items.filter((i) => i.type === "aspect");
    context.aspects = aspectsItems.map((aspect) => ({
      id: aspect.id,
      nom: aspect.name,
      niveau: aspect.system.niveau,
      puissanceDisponible: EDC.puissanceParNiveauAspect[aspect.system.niveau] ?? 0
    }));
    context.peutAjouterAspect = aspectsItems.length === 0;

    const avantagesItems = actor.items.filter((i) => i.type === "avantage");
    const desavantagesItems = actor.items.filter((i) => i.type === "desavantage");
    const avantageTotal = avantagesItems.reduce((s, a) => s + a.system.valeur, 0);
    const desavantageTotal = desavantagesItems.reduce((s, d) => s + Math.abs(d.system.valeur), 0);

    context.avantagePoints = { total: AVANTAGE_POINTS_MAX, depenses: avantageTotal, restants: AVANTAGE_POINTS_MAX - avantageTotal };
    context.desavantagePoints = { total: AVANTAGE_POINTS_MAX, depenses: desavantageTotal, restants: AVANTAGE_POINTS_MAX - desavantageTotal };
    context.equilibre = avantageTotal === desavantageTotal;

    context.avantages = avantagesItems.map((a) => ({
      id: a.id,
      nom: a.name,
      niveau: a.system.valeur,
      peutMonter: a.system.valeur < AVANTAGE_NIVEAU_MAX && avantageTotal < AVANTAGE_POINTS_MAX,
      peutDescendre: a.system.valeur > 1
    }));
    context.desavantages = desavantagesItems.map((d) => ({
      id: d.id,
      nom: d.name,
      niveau: Math.abs(d.system.valeur),
      peutMonter: Math.abs(d.system.valeur) < AVANTAGE_NIVEAU_MAX && desavantageTotal < AVANTAGE_POINTS_MAX,
      peutDescendre: Math.abs(d.system.valeur) > 1
    }));

    return context;
  }

  #lireEtViderInput(target, containerSelector, inputSelector) {
    const input = target.closest(containerSelector)?.querySelector(inputSelector);
    const valeur = input?.value?.trim();
    if (input) input.value = "";
    return valeur;
  }

  static async #onChampCreer(event, target) {
    const nom = this.#lireEtViderInput(target, ".edc-creation-ajout-champ", ".edc-creation-nouveau-champ");
    if (!nom) {
      ui.notifications.warn("Indiquez un nom pour le nouveau Champ.");
      return;
    }
    const [item] = await this.actor.createEmbeddedDocuments("Item", [{ name: nom, type: "champ" }]);
    if (item) this.render();
  }

  static async #onChampUp(event, target) {
    const champ = this.actor.items.get(target.dataset.itemId);
    if (!champ || champ.system.niveau >= CHAMP_NIVEAU_MAX_CREATION) return;
    await champ.update({ "system.niveau": champ.system.niveau + 1 });
    this.render();
  }

  static async #onChampDown(event, target) {
    const champ = this.actor.items.get(target.dataset.itemId);
    if (!champ || champ.system.niveau <= 0) return;
    const niveauVise = champ.system.niveau - 1;
    const specTropHaut = (champ.system.specialisations ?? []).some((s) => s.niveau > niveauVise);
    if (specTropHaut) {
      ui.notifications.warn("Réduisez d'abord les Spécialisations de ce Champ.");
      return;
    }
    await champ.update({ "system.niveau": niveauVise });
    this.render();
  }

  static async #onChampSupprimer(event, target) {
    const champ = this.actor.items.get(target.dataset.itemId);
    await champ?.delete();
    this.render();
  }

  static async #onSpecAjouter(event, target) {
    const champ = this.actor.items.get(target.dataset.itemId);
    if (!champ) return;
    const nom = this.#lireEtViderInput(target, ".edc-creation-ajout-spec", ".edc-xp-nouvelle-spec");
    if (!nom) {
      ui.notifications.warn("Indiquez un nom pour la nouvelle spécialisation.");
      return;
    }
    if (champ.system.niveau < 1) {
      ui.notifications.warn("Ce Champ doit être au moins niveau 1 pour recevoir une Spécialisation.");
      return;
    }
    const specs = foundry.utils.deepClone(champ.system.specialisations ?? []);
    specs.push({ nom, niveau: 1, description: "" });
    await champ.update({ "system.specialisations": specs });
    this.render();
  }

  static async #onSpecUp(event, target) {
    const champ = this.actor.items.get(target.dataset.itemId);
    if (!champ) return;
    const idx = Number(target.dataset.index);
    const specs = foundry.utils.deepClone(champ.system.specialisations ?? []);
    const spec = specs[idx];
    if (!spec || spec.niveau >= champ.system.niveau) return;
    specs[idx].niveau += 1;
    await champ.update({ "system.specialisations": specs });
    this.render();
  }

  static async #onSpecDown(event, target) {
    const champ = this.actor.items.get(target.dataset.itemId);
    if (!champ) return;
    const idx = Number(target.dataset.index);
    const specs = foundry.utils.deepClone(champ.system.specialisations ?? []);
    const spec = specs[idx];
    if (!spec || spec.niveau <= 1) return;
    specs[idx].niveau -= 1;
    await champ.update({ "system.specialisations": specs });
    this.render();
  }

  static async #onSpecSupprimer(event, target) {
    const champ = this.actor.items.get(target.dataset.itemId);
    if (!champ) return;
    const idx = Number(target.dataset.index);
    const specs = foundry.utils.deepClone(champ.system.specialisations ?? []);
    specs.splice(idx, 1);
    await champ.update({ "system.specialisations": specs });
    this.render();
  }

  static async #onVoieDefinir(event, target) {
    const input = target.closest(".edc-creation-voie")?.querySelector(".edc-creation-voie-nom");
    const nom = input?.value?.trim();
    if (!nom) {
      ui.notifications.warn("Indiquez le nom de la Voie.");
      return;
    }
    const niveau = this.actor.system.voie?.niveau > 0 ? this.actor.system.voie.niveau : 1;
    await this.actor.update({ "system.voie.nom": nom, "system.voie.niveau": niveau });
    this.render();
  }

  static async #onVoieReinitialiser() {
    const aspects = this.actor.items.filter((i) => i.type === "aspect");
    const techniques = this.actor.items.filter((i) => i.type === "technique");
    if (aspects.length || techniques.length) {
      const confirme = await foundry.applications.api.DialogV2.confirm({
        window: { title: "Réinitialiser la Voie" },
        content: "<p>Cela supprimera aussi l'Aspect choisi et les techniques déjà créées, puisqu'ils dépendent de la Voie. Continuer ?</p>"
      });
      if (!confirme) return;
      for (const item of [...aspects, ...techniques]) await item.delete();
    }
    await this.actor.update({ "system.voie.nom": "", "system.voie.niveau": 0 });
    this.render();
  }

  static async #onAspectAjouter(event, target) {
    if (this.actor.items.some((i) => i.type === "aspect")) {
      ui.notifications.warn("Un seul Aspect est choisi à la création (p.212-213). Les suivants s'obtiennent en progressant (Montée en compétences).");
      return;
    }
    const input = target.closest(".edc-creation-aspect-ajout")?.querySelector(".edc-creation-nouvel-aspect");
    const nom = input?.value?.trim();
    if (!nom) {
      ui.notifications.warn("Indiquez le nom de l'Aspect.");
      return;
    }
    if (!this.actor.system.voie?.nom) {
      ui.notifications.warn("Définissez d'abord la Voie du personnage.");
      return;
    }
    const [item] = await this.actor.createEmbeddedDocuments("Item", [{
      name: nom,
      type: "aspect",
      system: { voie: this.actor.system.voie.nom, niveau: 1 }
    }]);
    if (item) {
      if (input) input.value = "";
      this.render();
    }
  }

  static async #onAspectSupprimer(event, target) {
    const aspect = this.actor.items.get(target.dataset.itemId);
    await aspect?.delete();
    this.render();
  }

  static async #onCreerTechnique() {
    await ouvrirCreationTechnique(this.actor);
    this.render();
  }

  static async #onTerminerCreation() {
    const champPoints = this.actor.items.filter((i) => i.type === "champ").reduce((s, c) => s + c.system.niveau, 0);
    const restants = CHAMP_POINTS - champPoints;
    if (restants > 0) {
      const confirme = await foundry.applications.api.DialogV2.confirm({
        window: { title: "Terminer la création" },
        content: `<p>Il reste ${restants} point(s) de Champ non dépensé(s) — ils seront perdus. Terminer quand même ?</p>`
      });
      if (!confirme) return;
    }
    this.close();
  }

  static async #onAvantageAjouter(event, target) {
    const nom = this.#lireEtViderInput(target, ".edc-creation-ajout-avantage", ".edc-creation-nouvel-avantage");
    if (!nom) {
      ui.notifications.warn("Indiquez un nom pour le nouvel avantage.");
      return;
    }
    await this.actor.createEmbeddedDocuments("Item", [{ name: nom, type: "avantage", system: { valeur: 1 } }]);
    this.render();
  }

  static async #onAvantageUp(event, target) {
    const item = this.actor.items.get(target.dataset.itemId);
    if (!item || item.system.valeur >= AVANTAGE_NIVEAU_MAX) return;
    await item.update({ "system.valeur": item.system.valeur + 1 });
    this.render();
  }

  static async #onAvantageDown(event, target) {
    const item = this.actor.items.get(target.dataset.itemId);
    if (!item || item.system.valeur <= 1) return;
    await item.update({ "system.valeur": item.system.valeur - 1 });
    this.render();
  }

  static async #onAvantageSupprimer(event, target) {
    const item = this.actor.items.get(target.dataset.itemId);
    await item?.delete();
    this.render();
  }

  static async #onDesavantageAjouter(event, target) {
    const nom = this.#lireEtViderInput(target, ".edc-creation-ajout-desavantage", ".edc-creation-nouveau-desavantage");
    if (!nom) {
      ui.notifications.warn("Indiquez un nom pour le nouveau désavantage.");
      return;
    }
    await this.actor.createEmbeddedDocuments("Item", [{ name: nom, type: "desavantage", system: { valeur: -1 } }]);
    this.render();
  }

  static async #onDesavantageUp(event, target) {
    const item = this.actor.items.get(target.dataset.itemId);
    if (!item || Math.abs(item.system.valeur) >= AVANTAGE_NIVEAU_MAX) return;
    await item.update({ "system.valeur": item.system.valeur - 1 });
    this.render();
  }

  static async #onDesavantageDown(event, target) {
    const item = this.actor.items.get(target.dataset.itemId);
    if (!item || Math.abs(item.system.valeur) <= 1) return;
    await item.update({ "system.valeur": item.system.valeur + 1 });
    this.render();
  }

  static async #onDesavantageSupprimer(event, target) {
    const item = this.actor.items.get(target.dataset.itemId);
    await item?.delete();
    this.render();
  }
}
