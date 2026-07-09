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
