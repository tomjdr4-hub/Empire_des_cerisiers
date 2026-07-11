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

/** Effets spéciaux et leur coût en points de Majoration (p.251). */
const EFFETS_SPECIAUX_RITUEL = [
  { id: "differe", label: "Effet différé (glyphe, talisman, ofuda...)", points: 2 },
  { id: "purification", label: "Capacité « Purification »", points: 2 },
  { id: "transfoPartielle", label: "Transformation partielle (un élément du corps)", points: 2 },
  { id: "transfoImportante", label: "Transformation importante (plusieurs éléments, même genre)", points: 6 },
  { id: "transfoComplete", label: "Transformation complète (autre créature, matière...)", points: 10 },
  { id: "enchantement", label: "Enchantement d'un objet/talisman à durée plus longue", points: 10 }
];

/**
 * Ouvre l'assistant de création d'un Rituel : choix du Champ lié, construction de la Majoration
 * (portée/durée/dégâts-soins/cibles/bonus-malus/invocation, p.250) et des éventuels effets
 * spéciaux (p.251), puis crée directement le Rituel avec la difficulté calculée (8 + Majoration).
 */
export async function ouvrirCreationRituel(actor) {
  const champs = actor.items.filter((i) => i.type === "champ");
  const optionsChamp = champs.map((c) => ({ value: c.name, label: `${c.name} (niv. ${c.system.niveau})` }));

  const content = await renderTemplate(`systems/${EDC.id}/templates/dialogs/rituel-creation.hbs`, {
    difficulteBase: EDC.difficulteBase,
    optionsChamp,
    effetsSpeciaux: EFFETS_SPECIAUX_RITUEL,
    optionsPortee: construireOptions(0, (l) => l.portee),
    optionsDuree: construireOptions(0, (l) => l.duree),
    optionsDegatsSoins: construireOptions(0, (l) => l.degatsSoins),
    optionsCibles: construireOptions(0, (l) => l.cibles),
    optionsBonusMalus: construireOptions(0, (l) => `±${l.bonusMalus}`),
    optionsInvocation: construireOptions(0, (l) => l.invocationType ? `${l.invocationNiveauChamp} (${l.invocationType})` : l.invocationNiveauChamp)
  });

  const resultat = await foundry.applications.api.DialogV2.wait({
    window: { title: "Créer un Rituel" },
    content,
    rejectClose: false,
    buttons: [
      { action: "creer", label: "Créer le rituel", default: true, callback: (event, button) => new FormData(button.form) },
      { action: "annuler", label: "Annuler" }
    ]
  });

  if (!resultat || resultat === "annuler") return null;

  const nom = String(resultat.get("nom") || "").trim() || "Nouveau Rituel";
  const majoration = {
    portee: Number(resultat.get("portee") || 0),
    duree: Number(resultat.get("duree") || 0),
    degatsSoins: Number(resultat.get("degatsSoins") || 0),
    cibles: Number(resultat.get("cibles") || 0),
    invocation: Number(resultat.get("invocation") || 0),
    bonusMalus: Number(resultat.get("bonusMalus") || 0)
  };
  const effetsChoisis = EFFETS_SPECIAUX_RITUEL.filter((e) => resultat.get(`effet-${e.id}`) === "on");
  const pointsEffets = effetsChoisis.reduce((s, e) => s + e.points, 0);
  const difficulte = calculerDifficulteRituel(majoration) + pointsEffets;
  const description = effetsChoisis.length
    ? `<p><em>Effets spéciaux : ${effetsChoisis.map((e) => `${e.label} (+${e.points})`).join(", ")}</em></p>`
    : "";

  const [rituel] = await actor.createEmbeddedDocuments("Item", [{
    name: nom,
    type: "rituel",
    system: {
      champ: resultat.get("champ") || "",
      difficulte,
      majoration,
      description
    }
  }]);
  return rituel;
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
