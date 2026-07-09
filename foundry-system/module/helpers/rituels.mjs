import { EDC } from "./config.mjs";
import { ouvrirJetDialogue } from "./dice.mjs";

/** Calcule la difficulté d'un rituel : 8 + somme des points de Majoration choisis (p.250). */
export function calculerDifficulteRituel(majoration) {
  const total = Object.values(majoration).reduce((s, v) => s + v, 0);
  return EDC.difficulteBase + total;
}

function construireOptions(majorationActuelle, formatter) {
  return EDC.majorationRituel.map((ligne, idx) => ({
    value: idx,
    label: `${idx} pt(s) — ${formatter(ligne)}`,
    selected: idx === (majorationActuelle ?? 0)
  }));
}

/** Ouvre le calculateur de Majoration et enregistre la difficulté résultante sur l'item Rituel. */
export async function ouvrirCalculateurRituel(rituel) {
  const m = rituel.system.majoration;
  const content = await renderTemplate(`systems/${EDC.id}/templates/dialogs/rituel-calculator.hbs`, {
    difficulteBase: EDC.difficulteBase,
    optionsPortee: construireOptions(m.portee, (l) => l.portee),
    optionsDuree: construireOptions(m.duree, (l) => l.duree),
    optionsDegatsSoins: construireOptions(m.degatsSoins, (l) => l.degatsSoins),
    optionsCibles: construireOptions(m.cibles, (l) => l.cibles),
    optionsBonusMalus: construireOptions(m.bonusMalus, (l) => `±${l.bonusMalus}`),
    optionsInvocation: construireOptions(m.invocation, (l) => l.invocationType ? `${l.invocationNiveauChamp} (${l.invocationType})` : l.invocationNiveauChamp)
  });

  const resultat = await foundry.applications.api.DialogV2.wait({
    window: { title: `Calculer la difficulté : ${rituel.name}` },
    content,
    rejectClose: false,
    buttons: [
      { action: "valider", label: "Valider", default: true, callback: (event, button) => new FormData(button.form) },
      { action: "annuler", label: "Annuler" }
    ]
  });

  if (!resultat || resultat === "annuler") return;

  const majoration = {
    portee: Number(resultat.get("portee") || 0),
    duree: Number(resultat.get("duree") || 0),
    degatsSoins: Number(resultat.get("degatsSoins") || 0),
    cibles: Number(resultat.get("cibles") || 0),
    invocation: Number(resultat.get("invocation") || 0),
    bonusMalus: Number(resultat.get("bonusMalus") || 0)
  };
  const difficulte = calculerDifficulteRituel(majoration);
  await rituel.update({ "system.majoration": majoration, "system.difficulte": difficulte });
}

/** Jet de rituel : Champ (+ Spécialisation) lié, contre la difficulté calculée. */
export async function lancerRituel(actor, rituel) {
  const champItem = actor.items.find((i) => i.type === "champ" && i.name === rituel.system.champ) ?? null;
  return ouvrirJetDialogue(actor, {
    titre: `Rituel : ${rituel.name}`,
    champId: champItem?.id ?? null,
    difficulteInitiale: rituel.system.difficulte
  });
}
