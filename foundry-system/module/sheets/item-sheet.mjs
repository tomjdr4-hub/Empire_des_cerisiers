import { EDC } from "../helpers/config.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

const TPL = `systems/${EDC.id}/templates/item`;

class ItemSheetBase extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["edc", "item"],
    position: { width: 480, height: 520 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      specAjouter: ItemSheetBase.#onSpecAjouter,
      specSupprimer: ItemSheetBase.#onSpecSupprimer
    }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.item = this.item;
    context.system = this.item.system;
    return context;
  }

  static async #onSpecAjouter(event) {
    event.preventDefault();
    const specs = foundry.utils.deepClone(this.item.system.specialisations ?? []);
    specs.push({ nom: "Nouvelle spécialisation", niveau: 1, description: "" });
    await this.item.update({ "system.specialisations": specs });
  }

  static async #onSpecSupprimer(event, target) {
    event.preventDefault();
    const idx = Number(target.closest("[data-index]").dataset.index);
    const specs = foundry.utils.deepClone(this.item.system.specialisations ?? []);
    specs.splice(idx, 1);
    await this.item.update({ "system.specialisations": specs });
  }
}

export class ChampSheet extends ItemSheetBase {
  static PARTS = { body: { template: `${TPL}/champ-sheet.hbs` } };
}
export class AvantageSheet extends ItemSheetBase {
  static PARTS = { body: { template: `${TPL}/avantage-sheet.hbs` } };
}
export class DesavantageSheet extends ItemSheetBase {
  static PARTS = { body: { template: `${TPL}/desavantage-sheet.hbs` } };
}
export class AspectSheet extends ItemSheetBase {
  static PARTS = { body: { template: `${TPL}/aspect-sheet.hbs` } };
}
export class TechniqueSheet extends ItemSheetBase {
  static PARTS = { body: { template: `${TPL}/technique-sheet.hbs` } };
}
export class RituelSheet extends ItemSheetBase {
  static PARTS = { body: { template: `${TPL}/rituel-sheet.hbs` } };
}
export class ArmeSheet extends ItemSheetBase {
  static PARTS = { body: { template: `${TPL}/arme-sheet.hbs` } };
}
export class ArmureSheet extends ItemSheetBase {
  static PARTS = { body: { template: `${TPL}/armure-sheet.hbs` } };
}
export class ObjetSheet extends ItemSheetBase {
  static PARTS = { body: { template: `${TPL}/objet-sheet.hbs` } };
}
