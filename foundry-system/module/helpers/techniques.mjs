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

/**
 * Calcule, pour chaque Aspect du personnage, la Puissance gagnée à son niveau actuel et ce qu'il
 * en reste après les techniques déjà créées à CE niveau (p.212-214 : les points non dépensés à un
 * niveau donné sont perdus au niveau suivant, donc seules les techniques créées au niveau actuel
 * de l'Aspect comptent contre le budget de ce niveau).
 */
function calculerBudgetsAspects(actor) {
  const aspects = actor.items.filter((i) => i.type === "aspect");
  const techniques = actor.items.filter((i) => i.type === "technique");

  return aspects.map((a) => {
    const puissanceGagneeAuNiveau = EDC.puissanceParNiveauAspect[a.system.niveau] ?? 0;
    const puissanceDepensee = techniques
      .filter((t) => t.system.aspect === a.name && t.system.niveauAspectCreation === a.system.niveau)
      .reduce((s, t) => s + t.system.puissance, 0);
    return {
      nom: a.name,
      niveau: a.system.niveau,
      puissanceGagneeAuNiveau,
      puissanceDepensee,
      puissanceRestante: puissanceGagneeAuNiveau - puissanceDepensee
    };
  });
}

/** Ouvre l'aide à la création de techniques (table Aspect -> points de Puissance disponibles, p.212-214). */
export async function ouvrirCalculateurTechnique(actor) {
  const lignes = calculerBudgetsAspects(actor);

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

/**
 * Ouvre l'assistant de création d'une Technique : montre le budget de Puissance disponible par
 * Aspect (p.212-214), puis construit le coût de la nouvelle technique à partir du tableau p.216
 * (portée/durée/dégâts/cibles/bonus/invocation) et la crée directement avec ce coût.
 */
export async function ouvrirCreationTechnique(actor) {
  const aspects = actor.items.filter((i) => i.type === "aspect");
  const lignes = calculerBudgetsAspects(actor);
  const optionsAspect = aspects.map((a) => {
    const ligne = lignes.find((l) => l.nom === a.name);
    return { value: a.name, label: `${a.name} (niv. ${a.system.niveau} — ${ligne?.puissanceRestante ?? 0} pt(s) restant(s))` };
  });

  const content = await renderTemplate(`systems/${EDC.id}/templates/dialogs/technique-creation.hbs`, {
    lignes,
    optionsAspect,
    optionsPortee: construireOptions(0, (l) => l.portee),
    optionsDuree: construireOptions(0, (l) => l.duree),
    optionsDegatsSoins: construireOptions(0, (l) => l.degatsSoins),
    optionsCibles: construireOptions(0, (l) => l.cibles),
    optionsBonusMalus: construireOptions(0, (l) => `±${l.bonusMalus}`),
    optionsInvocation: construireOptions(0, (l) => l.invocationType ? `${l.invocationNiveauChamp} (${l.invocationType})` : l.invocationNiveauChamp)
  });

  const resultat = await foundry.applications.api.DialogV2.wait({
    window: { title: "Créer une Technique" },
    content,
    rejectClose: false,
    buttons: [
      { action: "creer", label: "Créer la technique", default: true, callback: (event, button) => new FormData(button.form) },
      { action: "annuler", label: "Annuler" }
    ]
  });

  if (!resultat || resultat === "annuler") return null;

  const aspectNom = resultat.get("aspect") || "";
  const aspectItem = aspects.find((a) => a.name === aspectNom);
  if (!aspectItem) {
    ui.notifications.error("Choisissez un Aspect pour cette technique (p.213 : une technique est liée à un Aspect).");
    return null;
  }

  const nom = String(resultat.get("nom") || "").trim() || "Nouvelle Technique";
  const majoration = {
    portee: Number(resultat.get("portee") || 0),
    duree: Number(resultat.get("duree") || 0),
    degatsSoins: Number(resultat.get("degatsSoins") || 0),
    cibles: Number(resultat.get("cibles") || 0),
    invocation: Number(resultat.get("invocation") || 0),
    bonusMalus: Number(resultat.get("bonusMalus") || 0)
  };
  const puissance = Math.max(1, Object.values(majoration).reduce((s, v) => s + v, 0));

  const ligne = lignes.find((l) => l.nom === aspectNom);
  const puissanceRestante = ligne?.puissanceRestante ?? 0;
  if (puissanceRestante <= 0) {
    ui.notifications.error(`Plus de Puissance disponible pour ${aspectNom} au niveau ${aspectItem.system.niveau} : montez l'Aspect pour en regagner (p.212-214).`);
    return null;
  }
  if (puissance > puissanceRestante) {
    ui.notifications.error(`Cette technique coûte ${puissance} points de Puissance, mais il n'en reste que ${puissanceRestante} pour ${aspectNom} au niveau ${aspectItem.system.niveau}.`);
    return null;
  }

  const [technique] = await actor.createEmbeddedDocuments("Item", [{
    name: nom,
    type: "technique",
    system: {
      puissance,
      aspect: aspectNom,
      voie: actor.system.voie?.nom ?? "",
      niveauAspectCreation: aspectItem.system.niveau,
      majoration
    }
  }]);
  return technique;
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
