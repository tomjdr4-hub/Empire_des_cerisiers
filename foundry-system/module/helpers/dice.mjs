import { EDC } from "./config.mjs";

const TPL = `systems/${EDC.id}/templates`;

/**
 * Ouvre le dialogue de jet générique (Champ + Spécialisation + Avantages/Désavantages + difficulté)
 * puis lance le jet et poste la chat card. Retourne le résultat de `lancerJet` ou null si annulé.
 */
export async function ouvrirJetDialogue(actor, {
  titre = "Jet de dés",
  champId = null,
  difficulteInitiale = null,
  bonusFixe = 0,
  bonusFixeLabel = ""
} = {}, extra = {}) {
  const champs = actor.items.filter((i) => i.type === "champ");
  const avantages = actor.items.filter((i) => i.type === "avantage" || i.type === "desavantage");
  const aspects = actor.items.filter((i) => i.type === "aspect");

  const options = [];
  for (const champ of champs) {
    options.push({
      value: `${champ.id}|-1`,
      label: `${champ.name} (${champ.system.niveau})`,
      selected: champ.id === champId
    });
    for (const [idx, spec] of (champ.system.specialisations ?? []).entries()) {
      options.push({
        value: `${champ.id}|${idx}`,
        label: `${champ.name} — ${spec.nom} (${champ.system.niveau}+${spec.niveau})`,
        selected: false
      });
    }
  }

  const difficultesOptions = [
    { value: "", label: "Non précisé (le MJ décidera)", selected: difficulteInitiale === null },
    ...Object.entries(EDC.difficultes).map(([seuil, label]) => ({
      value: seuil,
      label: `${label} (${seuil})`,
      selected: Number(seuil) === difficulteInitiale
    }))
  ];
  const difficulteEstStandard = difficultesOptions.some((o) => o.selected);
  const estAttaque = extra.armeDegats !== null && extra.armeDegats !== undefined;

  const content = await renderTemplate(`${TPL}/dialogs/roll-dialog.hbs`, {
    titre,
    options,
    difficultesOptions,
    difficulteInitiale,
    difficulteEstStandard,
    avantages,
    aspects,
    bonusFixe,
    bonusFixeLabel,
    blessureMalus: actor.system.blessures?.malus ?? 0,
    estAttaque
  });

  const resultat = await foundry.applications.api.DialogV2.wait({
    window: { title: titre },
    content,
    rejectClose: false,
    buttons: [
      { action: "lancer", label: "Lancer les dés", default: true, callback: (event, button) => new FormData(button.form) },
      { action: "annuler", label: "Annuler" }
    ]
  });

  if (!resultat || resultat === "annuler") return null;

  const [champId2, specIdxStr] = String(resultat.get("champSpec") || "|-1").split("|");
  const champ = champs.find((c) => c.id === champId2) ?? null;
  const specIdx = Number(specIdxStr);
  const spec = champ && specIdx >= 0 ? champ.system.specialisations[specIdx] : null;

  const avantagesCoches = resultat.getAll("avantages")
    .map((id) => avantages.find((a) => a.id === id))
    .filter(Boolean);
  const bonusAvantages = avantagesCoches.reduce((s, a) => s + a.system.valeur, 0);

  const aspect = aspects.find((a) => a.id === resultat.get("aspectApplicable")) ?? null;
  const bonusAspect = aspect?.system.niveau ?? 0;

  const bonusSituationnel = Number(resultat.get("bonusSituationnel") || 0);
  const difficulteBrute = resultat.get("difficulte");
  let difficulte;
  if (difficulteBrute === "custom") difficulte = Number(resultat.get("difficulteCustom") || 8);
  else if (difficulteBrute === "") difficulte = null;
  else difficulte = Number(difficulteBrute);

  const surprise = estAttaque && resultat.get("attaqueSurprise") === "on";

  return lancerJet({
    actor,
    titre,
    champ,
    spec,
    avantages: avantagesCoches,
    bonusAvantages,
    aspect,
    bonusAspect,
    bonusFixe,
    bonusFixeLabel,
    bonusSituationnel,
    difficulte,
    armeDegats: extra.armeDegats ?? null,
    echecAutoDouble1: extra.echecAutoDouble1 ?? false,
    cibles: surprise ? [] : (extra.cibles ?? []),
    surprise
  });
}

/** Lance 2d6 + bonus, compare à la difficulté et poste la chat card. */
export async function lancerJet({
  actor,
  titre = "Jet de dés",
  champ = null,
  spec = null,
  avantages = [],
  bonusAvantages = 0,
  aspect = null,
  bonusAspect = 0,
  bonusFixe = 0,
  bonusFixeLabel = "",
  bonusSituationnel = 0,
  difficulte = null,
  armeDegats = null,
  echecAutoDouble1 = false,
  cibles = [],
  surprise = false
} = {}) {
  const malusBlessure = actor.system.blessures?.malus ?? 0;
  const roll = await new Roll("2d6").evaluate();
  const diceHTML = await roll.render();

  const champNiveau = champ?.system.niveau ?? 0;
  const specNiveau = spec?.niveau ?? 0;
  const total = roll.total + champNiveau + specNiveau + bonusAvantages + bonusAspect + bonusFixe + bonusSituationnel + malusBlessure;

  const valeursDes = roll.dice[0]?.results?.map((r) => r.result) ?? [];
  const doubleUn = echecAutoDouble1 && valeursDes.length === 2 && valeursDes.every((v) => v === 1);

  const difficulteConnue = difficulte !== null && difficulte !== undefined;
  const marge = difficulteConnue ? total - difficulte : null;
  const reussite = difficulteConnue ? (doubleUn ? false : marge >= 0) : null;
  const degatsBruts = difficulteConnue && armeDegats !== null && reussite ? Math.max(0, armeDegats + marge) : null;

  const fmt = (n) => (n >= 0 ? `+${n}` : `${n}`);
  const detail = [
    champ ? `${champ.name} ${fmt(champNiveau)}` : null,
    spec ? `${spec.nom} ${fmt(specNiveau)}` : null,
    ...avantages.map((a) => `${a.name} ${fmt(a.system.valeur)}`),
    aspect ? `${aspect.name} ${fmt(bonusAspect)}` : null,
    bonusFixe ? `${bonusFixeLabel || "Bonus"} ${fmt(bonusFixe)}` : null,
    bonusSituationnel ? `Situationnel ${fmt(bonusSituationnel)}` : null,
    malusBlessure ? `Blessures ${fmt(malusBlessure)}` : null,
    doubleUn ? "Double 1 : échec automatique" : null,
    surprise ? "Attaque surprise : la cible ne peut pas se défendre" : null
  ].filter(Boolean);

  const margeAffichee = difficulteConnue ? fmt(marge) : null;
  const ciblesDefendables = armeDegats !== null ? cibles : [];
  const content = await renderTemplate(`${TPL}/chat/roll-card.hbs`, {
    titre, diceHTML, roll, total, difficulte, difficulteConnue, marge, margeAffichee, reussite, detail, degatsBruts,
    armeDegats, cibles: ciblesDefendables
  });

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    rolls: [roll],
    sound: CONFIG.sounds.dice
  });

  return { roll, total, difficulte, difficulteConnue, marge, reussite, degatsBruts };
}
