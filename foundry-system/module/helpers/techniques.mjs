import { EDC } from "./config.mjs";
import { lancerJet } from "./dice.mjs";

/** Active une technique : jet de 2d6 + Voie + Aspect contre une difficulté égale à son coût en Puissance. */
export async function activerTechnique(actor, technique) {
  const aspectItem = actor.items.find((i) => i.type === "aspect" && i.name === technique.system.aspect);
  const aspectNiveau = aspectItem?.system.niveau ?? 0;
  const voieNiveau = actor.system.voie?.niveau ?? 0;

  return lancerJet({
    actor,
    titre: `Technique : ${technique.name}`,
    bonusFixe: voieNiveau + aspectNiveau,
    bonusFixeLabel: `Voie+Aspect (${voieNiveau}+${aspectNiveau})`,
    difficulte: technique.system.puissance
  });
}

/** Ouvre l'aide à la création de techniques (table Aspect -> points de Puissance disponibles, p.212-214). */
export async function ouvrirCalculateurTechnique(actor) {
  const aspects = actor.items.filter((i) => i.type === "aspect");
  const techniques = actor.items.filter((i) => i.type === "technique");

  const lignes = aspects.map((a) => ({
    nom: a.name,
    niveau: a.system.niveau,
    puissanceGagneeAuNiveau: EDC.puissanceParNiveauAspect[a.system.niveau] ?? 0,
    puissanceDepensee: techniques
      .filter((t) => t.system.aspect === a.name)
      .reduce((s, t) => s + t.system.puissance, 0)
  }));

  const content = await renderTemplate(`systems/${EDC.id}/templates/dialogs/technique-calculator.hbs`, {
    lignes,
    table: EDC.puissanceParNiveauAspect
  });

  await foundry.applications.api.DialogV2.wait({
    window: { title: "Calculateur de Techniques" },
    content,
    buttons: [{ action: "fermer", label: "Fermer", default: true }]
  });
}

function construireOptions(majorationActuelle, formatter) {
  return EDC.majorationRituel.map((ligne, idx) => ({
    value: idx,
    label: `${idx} pt(s) — ${formatter(ligne)}`,
    selected: idx === (majorationActuelle ?? 0)
  }));
}

/**
 * Ouvre le calculateur de coût en Puissance d'une Technique (même table que la Majoration des
 * rituels, p.216) et enregistre le coût résultant sur l'item Technique.
 */
export async function ouvrirCalculateurCoutTechnique(technique) {
  const m = technique.system.majoration;
  const content = await renderTemplate(`systems/${EDC.id}/templates/dialogs/technique-cout-calculator.hbs`, {
    optionsPortee: construireOptions(m.portee, (l) => l.portee),
    optionsDuree: construireOptions(m.duree, (l) => l.duree),
    optionsDegatsSoins: construireOptions(m.degatsSoins, (l) => l.degatsSoins),
    optionsCibles: construireOptions(m.cibles, (l) => l.cibles),
    optionsBonusMalus: construireOptions(m.bonusMalus, (l) => `±${l.bonusMalus}`),
    optionsInvocation: construireOptions(m.invocation, (l) => l.invocationType ? `${l.invocationNiveauChamp} (${l.invocationType})` : l.invocationNiveauChamp)
  });

  const resultat = await foundry.applications.api.DialogV2.wait({
    window: { title: `Calculer le coût : ${technique.name}` },
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
  const puissance = Math.max(1, Object.values(majoration).reduce((s, v) => s + v, 0));
  await technique.update({ "system.majoration": majoration, "system.puissance": puissance });
}
