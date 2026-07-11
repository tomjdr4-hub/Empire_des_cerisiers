import { ouvrirJetDialogue } from "./dice.mjs";

/**
 * Jet de Soins (p.246) : 2d6 + Champ Médecin (ou approprié) + Spécialisation, difficulté 8. En cas
 * de réussite, la cible récupère (marge de réussite + 3) points de blessures. Un personnage ne
 * peut normalement bénéficier de soins médicaux qu'une fois par jour.
 */
export async function rollSoins(actor) {
  const patient = Array.from(game.user.targets).map((t) => t.actor).find(Boolean) ?? actor;

  if (patient.system.blessures?.soinsRecusAujourdhui) {
    const continuer = await foundry.applications.api.DialogV2.confirm({
      window: { title: "Soins" },
      content: `<p>${patient.name} a déjà reçu des soins médicaux aujourd'hui (p.246 : une fois par jour). Continuer quand même ?</p>`
    });
    if (!continuer) return;
  }

  const resultat = await ouvrirJetDialogue(actor, {
    titre: patient === actor ? "Soins" : `Soins sur ${patient.name}`,
    difficulteInitiale: 8
  });
  if (!resultat || !resultat.difficulteConnue) return;

  if (!resultat.reussite) {
    ui.notifications.info("Le jet de Soins échoue.");
    return;
  }

  const soin = Math.max(0, resultat.marge + 3);
  const actuel = patient.system.blessures?.value ?? 0;
  await patient.update({
    "system.blessures.value": Math.max(0, actuel - soin),
    "system.blessures.soinsRecusAujourdhui": true
  });
  ui.notifications.info(`${patient.name} récupère ${soin} points de blessures (marge ${resultat.marge >= 0 ? "+" : ""}${resultat.marge}, +3).`);
}

/** Guérison naturelle par le repos (p.246) : 5 points de blessures par jour/nuit, 10 pour 24h complètes. */
export async function rollRepos(actor) {
  const choix = await foundry.applications.api.DialogV2.wait({
    window: { title: "Repos" },
    content: "<p>Combien de temps le personnage se repose-t-il (p.246) ?</p>",
    rejectClose: false,
    buttons: [
      { action: "jour", label: "Repos d'un jour ou d'une nuit (5 pts)" },
      { action: "24h", label: "Repos complet de 24h (10 pts)" },
      { action: "annuler", label: "Annuler" }
    ]
  });
  if (!choix || choix === "annuler") return;

  const soin = choix === "24h" ? 10 : 5;
  const actuel = actor.system.blessures?.value ?? 0;
  await actor.update({ "system.blessures.value": Math.max(0, actuel - soin) });
  ui.notifications.info(`${actor.name} récupère ${soin} points de blessures grâce au repos.`);
}
