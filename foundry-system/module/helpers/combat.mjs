import { ouvrirJetDialogue } from "./dice.mjs";

/**
 * Enregistre la formule d'initiative (2d6 + bonus des Champs cochés "Initiative"), le rejet
 * automatique de l'initiative à chaque nouveau tour (p.232 : "Chaque combattant lance 2d6 au
 * début de chaque tour"), la limite du sursaut héroïque, et les boutons "Appliquer les dégâts" /
 * "Se défendre" sur les chat cards d'attaque.
 */
export function registerCombatHooks() {
  CONFIG.Combat.initiative.formula = "2d6 + @initiativeBonus";

  Hooks.on("combatRound", (combat) => {
    if (!game.user.isGM) return;
    combat.rollAll();
  });

  // Sursaut héroïque "Aux portes de la mort" : ne s'active qu'une fois par scène (p.237).
  Hooks.on("preUpdateActor", (actor, changes) => {
    const active = foundry.utils.getProperty(changes, "system.blessures.portesDeLaMortActive");
    if (active !== true) return;
    if (actor.system.blessures?.portesDeLaMortUtilisee) {
      ui.notifications.warn("Le sursaut héroïque a déjà été utilisé cette scène.");
      delete changes.system.blessures.portesDeLaMortActive;
      return;
    }
    foundry.utils.setProperty(changes, "system.blessures.portesDeLaMortUtilisee", true);
  });

  Hooks.on("renderChatMessageHTML", (message, html) => {
    const bouton = html.querySelector?.("[data-action='appliquer-degats']");
    if (bouton && bouton.dataset.applique !== "true") {
      bouton.addEventListener("click", async () => {
        await appliquerDegatsCibles(Number(bouton.dataset.degats));
        bouton.dataset.applique = "true";
        bouton.disabled = true;
      });
    }

    html.querySelectorAll?.("[data-action='se-defendre']")?.forEach((boutonDefense) => {
      if (boutonDefense.dataset.resolu === "true") return;
      boutonDefense.addEventListener("click", async () => {
        boutonDefense.dataset.resolu = "true";
        boutonDefense.disabled = true;
        const armeDegatsBrut = boutonDefense.dataset.armeDegats;
        await resoudreDefense(
          boutonDefense.dataset.actorId,
          Number(boutonDefense.dataset.attaqueTotal),
          armeDegatsBrut === "" ? null : Number(armeDegatsBrut)
        );
      });
    });
  });
}

/** Jet d'attaque avec une arme, en visant les cibles actuellement sélectionnées (p.233 : opposition à la Défense). */
export async function rollAttaque(actor, arme) {
  const cibles = Array.from(game.user.targets)
    .map((token) => token.actor)
    .filter(Boolean)
    .map((a) => ({ id: a.id, nom: a.name }));

  return ouvrirJetDialogue(actor, {
    titre: `Attaque : ${arme.name}`,
    difficulteInitiale: 8
  }, { armeDegats: arme.system.facteurDegats, cibles });
}

/** Jet de Défense (esquive/parade) : à comparer manuellement au total de l'attaque adverse. */
export async function rollDefense(actor) {
  return ouvrirJetDialogue(actor, {
    titre: "Défense (esquive/parade)"
  });
}

/**
 * Jet de réveil pour un personnage Invalidité/Inconscience : 2d6 + Voie + Champ le plus élevé
 * contre une difficulté de 12 ; un double "1" est un échec automatique (p.237).
 */
export async function rollReveilInconscience(actor) {
  const voieNiveau = actor.system.voie?.niveau ?? 0;
  const champMax = actor.system.champMax ?? 0;
  return ouvrirJetDialogue(actor, {
    titre: "Jet de réveil (Invalidité/Inconscience)",
    bonusFixe: voieNiveau + champMax,
    bonusFixeLabel: `Voie+Champ (${voieNiveau}+${champMax})`,
    difficulteInitiale: 12
  }, { echecAutoDouble1: true });
}

/** Équipe/déséquipe une arme (plusieurs armes peuvent être équipées en même temps, p.238-240). */
export async function toggleEquipeArme(arme) {
  await arme.update({ "system.equipe": !arme.system.equipe });
}

/** Équipe/déséquipe une armure. Une seule armure peut être équipée à la fois : en équiper une déséquipe les autres. */
export async function toggleEquipeArmure(actor, armure) {
  const equiper = !armure.system.equipe;
  if (equiper) {
    const autres = actor.items.filter((i) => i.type === "armure" && i.id !== armure.id && i.system.equipe);
    for (const autre of autres) await autre.update({ "system.equipe": false });
  }
  await armure.update({ "system.equipe": equiper });
}

/** Déduit la protection de l'armure équipée par la cible, applique les dégâts restants et notifie le résultat. */
async function appliquerDegatsActeur(cibleActor, degatsBruts) {
  const protection = cibleActor.system.protectionActive ?? 0;
  const degatsFinaux = Math.max(0, degatsBruts - protection);
  const actuel = cibleActor.system.blessures?.value ?? 0;
  await cibleActor.update({ "system.blessures.value": actuel + degatsFinaux });
  ui.notifications.info(`${cibleActor.name} subit ${degatsFinaux} points de blessures (protection ${protection}).`);
}

/** Applique les dégâts (moins la protection d'armure) aux tokens actuellement ciblés. */
export async function appliquerDegatsCibles(degatsBruts) {
  const cibles = Array.from(game.user.targets);
  if (!cibles.length) {
    ui.notifications.warn("Aucune cible sélectionnée pour appliquer les dégâts.");
    return;
  }
  for (const token of cibles) {
    if (token.actor) await appliquerDegatsActeur(token.actor, degatsBruts);
  }
}

/**
 * Résout la Défense opposée d'une cible face à une attaque (p.233) : ouvre le jet de Défense de
 * la cible et, s'il n'égale pas le total de l'attaque, applique les dégâts (facteur de l'arme +
 * marge de l'attaquant, moins la protection).
 */
async function resoudreDefense(actorId, attaqueTotal, armeDegats) {
  const actor = game.actors.get(actorId);
  if (!actor) return;
  const resultat = await ouvrirJetDialogue(actor, { titre: `Défense de ${actor.name} (esquive/parade)` });
  if (!resultat) return;
  if (resultat.total >= attaqueTotal) {
    ui.notifications.info(`${actor.name} évite l'attaque !`);
    return;
  }
  if (armeDegats === null) return;
  const marge = attaqueTotal - resultat.total;
  await appliquerDegatsActeur(actor, armeDegats + marge);
}
