import { EDC } from "../helpers/config.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ApplicationV2 } = foundry.applications.api;

const TPL = `systems/${EDC.id}/templates/apps`;

/** Coûts en points d'expérience (Livre de règles p.228). */
const COUT_CHAMP = (niveauVise) => 3 * niveauVise;
const COUT_SPECIALISATION = (niveauVise) => niveauVise;
const COUT_VOIE = (niveauVise) => 4 * niveauVise;
const COUT_ASPECT = (niveauVise) => 2 * niveauVise;
const COUT_AVANTAGE = (niveauVise) => 2 * niveauVise;

/**
 * Fenêtre de dépense de points d'expérience : augmenter les Champs, Spécialisations, la Voie,
 * les Aspects et les Avantages du personnage selon le barème de coûts du Livre de règles (p.228).
 */
export class XpApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    classes: ["edc", "edc-xp-app"],
    position: { width: 560, height: "auto" },
    window: { resizable: true, title: "Montée en compétences" },
    actions: {
      champUp: XpApp.#onChampUp,
      specUp: XpApp.#onSpecUp,
      specAjouter: XpApp.#onSpecAjouter,
      voieUp: XpApp.#onVoieUp,
      aspectUp: XpApp.#onAspectUp,
      avantageUp: XpApp.#onAvantageUp
    }
  };

  static PARTS = {
    body: { template: `${TPL}/xp-app.hbs`, scrollable: [""] }
  };

  constructor(options) {
    super(options);
    this.actor = options.actor;
  }

  /** @override */
  get title() {
    return `Montée en compétences — ${this.actor.name}`;
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.actor;
    const xp = actor.system.xp ?? 0;

    context.xp = xp;

    context.champs = actor.items.filter((i) => i.type === "champ").map((champ) => {
      const niveau = champ.system.niveau;
      const niveauSuivant = niveau + 1;
      const coutProchain = niveau < 8 ? COUT_CHAMP(niveauSuivant) : null;
      const specialisations = (champ.system.specialisations ?? []).map((spec, idx) => {
        const specNiveauSuivant = spec.niveau + 1;
        const specCoutProchain = spec.niveau < niveau ? COUT_SPECIALISATION(specNiveauSuivant) : null;
        return {
          champId: champ.id,
          idx,
          nom: spec.nom,
          niveau: spec.niveau,
          niveauSuivant: specNiveauSuivant,
          coutProchain: specCoutProchain,
          peutAugmenter: specCoutProchain !== null && xp >= specCoutProchain
        };
      });
      return {
        id: champ.id,
        nom: champ.name,
        niveau,
        niveauSuivant,
        coutProchain,
        peutAugmenter: coutProchain !== null && xp >= coutProchain,
        specialisations
      };
    });

    const voieNiveau = actor.system.voie?.niveau ?? 0;
    const voieNiveauSuivant = voieNiveau + 1;
    const coutVoieProchain = voieNiveau < 8 ? COUT_VOIE(voieNiveauSuivant) : null;
    context.voie = {
      nom: actor.system.voie?.nom || "(non définie)",
      niveau: voieNiveau,
      niveauSuivant: voieNiveauSuivant,
      coutProchain: coutVoieProchain,
      peutAugmenter: coutVoieProchain !== null && xp >= coutVoieProchain
    };

    context.aspects = actor.items.filter((i) => i.type === "aspect").map((aspect) => {
      const niveau = aspect.system.niveau;
      const niveauSuivant = niveau + 1;
      const coutProchain = niveau < voieNiveau ? COUT_ASPECT(niveauSuivant) : null;
      return {
        id: aspect.id,
        nom: aspect.name,
        niveau,
        niveauSuivant,
        coutProchain,
        peutAugmenter: coutProchain !== null && xp >= coutProchain
      };
    });

    context.avantages = actor.items.filter((i) => i.type === "avantage").map((avantage) => {
      const niveau = avantage.system.valeur;
      const niveauSuivant = niveau + 1;
      const coutProchain = niveau < 3 ? COUT_AVANTAGE(niveauSuivant) : null;
      return {
        id: avantage.id,
        nom: avantage.name,
        niveau,
        niveauSuivant,
        coutProchain,
        peutAugmenter: coutProchain !== null && xp >= coutProchain
      };
    });

    return context;
  }

  async #depenser(cout, action) {
    const xp = this.actor.system.xp ?? 0;
    if (xp < cout) {
      ui.notifications.warn(`Pas assez de points d'expérience (${cout} XP requis, ${xp} disponible${xp > 1 ? "s" : ""}).`);
      return false;
    }
    await action();
    await this.actor.update({ "system.xp": xp - cout });
    return true;
  }

  static async #onChampUp(event, target) {
    const champ = this.actor.items.get(target.dataset.itemId);
    if (!champ) return;
    const niveauVise = champ.system.niveau + 1;
    if (niveauVise > 8) return;
    const ok = await this.#depenser(COUT_CHAMP(niveauVise), () => champ.update({ "system.niveau": niveauVise }));
    if (ok) this.render();
  }

  static async #onSpecUp(event, target) {
    const champ = this.actor.items.get(target.dataset.itemId);
    if (!champ) return;
    const idx = Number(target.dataset.index);
    const specs = foundry.utils.deepClone(champ.system.specialisations ?? []);
    const spec = specs[idx];
    if (!spec) return;
    const niveauVise = spec.niveau + 1;
    if (niveauVise > champ.system.niveau) return;
    const ok = await this.#depenser(COUT_SPECIALISATION(niveauVise), () => {
      specs[idx].niveau = niveauVise;
      return champ.update({ "system.specialisations": specs });
    });
    if (ok) this.render();
  }

  static async #onSpecAjouter(event, target) {
    const champ = this.actor.items.get(target.dataset.itemId);
    if (!champ) return;
    const input = target.closest(".edc-xp-subrow").querySelector(".edc-xp-nouvelle-spec");
    const nom = input?.value?.trim();
    if (!nom) {
      ui.notifications.warn("Indiquez un nom pour la nouvelle spécialisation.");
      return;
    }
    if (champ.system.niveau < 1) {
      ui.notifications.warn("Ce Champ doit être au moins niveau 1 pour recevoir une Spécialisation.");
      return;
    }
    const specs = foundry.utils.deepClone(champ.system.specialisations ?? []);
    const ok = await this.#depenser(COUT_SPECIALISATION(1), () => {
      specs.push({ nom, niveau: 1, description: "" });
      return champ.update({ "system.specialisations": specs });
    });
    if (ok) this.render();
  }

  static async #onVoieUp() {
    const niveauVise = (this.actor.system.voie?.niveau ?? 0) + 1;
    if (niveauVise > 8) return;
    const ok = await this.#depenser(COUT_VOIE(niveauVise), () => this.actor.update({ "system.voie.niveau": niveauVise }));
    if (ok) this.render();
  }

  static async #onAspectUp(event, target) {
    const aspect = this.actor.items.get(target.dataset.itemId);
    if (!aspect) return;
    const niveauVise = aspect.system.niveau + 1;
    if (niveauVise > (this.actor.system.voie?.niveau ?? 0)) return;
    const ok = await this.#depenser(COUT_ASPECT(niveauVise), () => aspect.update({ "system.niveau": niveauVise }));
    if (ok) this.render();
  }

  static async #onAvantageUp(event, target) {
    const avantage = this.actor.items.get(target.dataset.itemId);
    if (!avantage) return;
    const niveauVise = avantage.system.valeur + 1;
    if (niveauVise > 3) return;
    const confirme = await foundry.applications.api.DialogV2.confirm({
      window: { title: "Achat d'un avantage" },
      content: `<p>Augmenter « ${avantage.name} » au niveau ${niveauVise} coûte ${COUT_AVANTAGE(niveauVise)} XP.</p>
        <p class="edc-hint">Rappel (p.228) : l'achat ou l'augmentation d'un avantage nécessite l'accord du meneur de jeu.</p>`
    });
    if (!confirme) return;
    const ok = await this.#depenser(COUT_AVANTAGE(niveauVise), () => avantage.update({ "system.valeur": niveauVise }));
    if (ok) this.render();
  }
}
