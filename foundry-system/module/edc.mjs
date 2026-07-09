import { EDC } from "./helpers/config.mjs";
import * as models from "./data-models/_module.mjs";
import { EDCActor } from "./documents/actor.mjs";
import { EDCItem } from "./documents/item.mjs";
import { PersonnageSheet } from "./sheets/actor-personnage-sheet.mjs";
import { PnjSheet } from "./sheets/actor-pnj-sheet.mjs";
import {
  ChampSheet, AvantageSheet, DesavantageSheet, AspectSheet,
  TechniqueSheet, RituelSheet, ArmeSheet, ArmureSheet, ObjetSheet
} from "./sheets/item-sheet.mjs";
import { registerCombatHooks } from "./helpers/combat.mjs";

Hooks.once("init", () => {
  console.log("L'Empire des Cerisiers | Initialisation du système");

  game.edc = { EDC };
  CONFIG.EDC = EDC;

  CONFIG.Actor.documentClass = EDCActor;
  CONFIG.Item.documentClass = EDCItem;

  CONFIG.Actor.dataModels = {
    personnage: models.PersonnageData,
    pnj: models.PnjData
  };
  CONFIG.Item.dataModels = {
    champ: models.ChampData,
    avantage: models.AvantageData,
    desavantage: models.DesavantageData,
    aspect: models.AspectData,
    technique: models.TechniqueData,
    rituel: models.RituelData,
    arme: models.ArmeData,
    armure: models.ArmureData,
    objet: models.ObjetData
  };

  const { DocumentSheetConfig } = foundry.applications.apps;

  DocumentSheetConfig.registerSheet(Actor, EDC.id, PersonnageSheet, {
    types: ["personnage"], makeDefault: true, label: "Fiche de Personnage"
  });
  DocumentSheetConfig.registerSheet(Actor, EDC.id, PnjSheet, {
    types: ["pnj"], makeDefault: true, label: "Fiche de PNJ"
  });

  DocumentSheetConfig.registerSheet(Item, EDC.id, ChampSheet, { types: ["champ"], makeDefault: true, label: "Champ" });
  DocumentSheetConfig.registerSheet(Item, EDC.id, AvantageSheet, { types: ["avantage"], makeDefault: true, label: "Avantage" });
  DocumentSheetConfig.registerSheet(Item, EDC.id, DesavantageSheet, { types: ["desavantage"], makeDefault: true, label: "Désavantage" });
  DocumentSheetConfig.registerSheet(Item, EDC.id, AspectSheet, { types: ["aspect"], makeDefault: true, label: "Aspect" });
  DocumentSheetConfig.registerSheet(Item, EDC.id, TechniqueSheet, { types: ["technique"], makeDefault: true, label: "Technique" });
  DocumentSheetConfig.registerSheet(Item, EDC.id, RituelSheet, { types: ["rituel"], makeDefault: true, label: "Rituel" });
  DocumentSheetConfig.registerSheet(Item, EDC.id, ArmeSheet, { types: ["arme"], makeDefault: true, label: "Arme" });
  DocumentSheetConfig.registerSheet(Item, EDC.id, ArmureSheet, { types: ["armure"], makeDefault: true, label: "Armure" });
  DocumentSheetConfig.registerSheet(Item, EDC.id, ObjetSheet, { types: ["objet"], makeDefault: true, label: "Objet" });

  registerCombatHooks();
});
