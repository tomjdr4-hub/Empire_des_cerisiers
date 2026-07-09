import { ouvrirJetDialogue } from "./dice.mjs";

/**
 * Enregistre la formule d'initiative (2d6 + bonus des Champs cochés "Initiative"), le rejet
 * automatique de l'initiative à chaque nouveau tour (p.232 : "Chaque combattant lance 2d6 au
 * début de chaque tour") et le bouton "Appliquer les dégâts" sur les chat cards d'attaque.
 */
export function registerCombatHooks() {
  CONFIG.Combat.initiative.formula = "2d6 + @initiativeBonus";

  Hooks.on("combatRound", (combat) => {
    if (!game.user.isGM) return;
    combat.rollAll();
  });

  Hooks.on("renderChatMessageHTML", (message, html) => {
    const bouton = html.querySelector?.("[data-action='appliquer-degats']");
    if (!bouton || bouton.dataset.applique === "true") return;
    bouton.addEventListener("click", async () => {
      await appliquerDegatsCibles(Number(bouton.dataset.degats));
      bouton.dataset.applique = "true";
      bouton.disabled = true;
    });
  });
}

/** Jet d'attaque avec une arme : difficulté 8 par défaut (à ajuster manuellement face à une Défense opposée). */
export async function rollAttaque(actor, arme) {
  return ouvrirJetDialogue(actor, {
    titre: `Attaque : ${arme.name}`,
    difficulteInitiale: 8
  }, { armeDegats: arme.system.facteurDegats });
}

/** Jet de Défense (esquive/parade) : à comparer manuellement au total de l'attaque adverse. */
export async function rollDefense(actor) {
  return ouvrirJetDialogue(actor, {
    titre: "Défense (esquive/parade)"
  });
}

/** Applique les dégâts (moins la protection d'armure) aux tokens actuellement ciblés. */
export async function appliquerDegatsCibles(degatsBruts) {
  const cibles = Array.from(game.user.targets);
  if (!cibles.length) {
    ui.notifications.warn("Aucune cible sélectionnée pour appliquer les dégâts.");
    return;
  }
  for (const token of cibles) {
    const cibleActor = token.actor;
    if (!cibleActor) continue;
    const armure = cibleActor.items.find((i) => i.type === "armure");
    const protection = armure?.system.protection ?? 0;
    const degatsFinaux = Math.max(0, degatsBruts - protection);
    const actuel = cibleActor.system.blessures?.value ?? 0;
    await cibleActor.update({ "system.blessures.value": actuel + degatsFinaux });
    ui.notifications.info(`${cibleActor.name} subit ${degatsFinaux} points de blessures (protection ${protection}).`);
  }
}
