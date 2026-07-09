import { EDC } from "./config.mjs";

const TPL = `systems/${EDC.id}/templates`;

/**
 * Ouvre le dialogue de jet générique (Champ + Spécialisation + Avantages/Désavantages + difficulté)
 * puis lance le jet et poste la chat card. Retourne le résultat de `lancerJet` ou null si annulé.
 */
export async function ouvrirJetDialogue(actor, {
  titre = "Jet de dés",
  champId = null,
  difficulteInitiale = 8,
  bonusFixe = 0,
  bonusFixeLabel = ""
} = {}, extra = {}) {
  const champs = actor.items.filter((i) => i.type === "champ");
  const avantages = actor.items.filter((i) => i.type === "avantage" || i.type === "desavantage");

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

  const difficultesOptions = Object.entries(EDC.difficultes).map(([seuil, label]) => ({
    value: seuil,
    label: `${label} (${seuil})`,
    selected: Number(seuil) === difficulteInitiale
  }));
  const difficulteEstStandard = difficultesOptions.some((o) => o.selected);

  const content = await renderTemplate(`${TPL}/dialogs/roll-dialog.hbs`, {
    titre,
    options,
    difficultesOptions,
    difficulteInitiale,
    difficulteEstStandard,
    avantages,
    bonusFixe,
    bonusFixeLabel,
    blessureMalus: actor.system.blessures?.malus ?? 0
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

  const bonusSituationnel = Number(resultat.get("bonusSituationnel") || 0);
  const difficulteBrute = resultat.get("difficulte");
  const difficulte = difficulteBrute === "custom"
    ? Number(resultat.get("difficulteCustom") || 8)
    : Number(difficulteBrute);

  return lancerJet({
    actor,
    titre,
    champ,
    spec,
    avantages: avantagesCoches,
    bonusAvantages,
    bonusFixe,
    bonusFixeLabel,
    bonusSituationnel,
    difficulte,
    armeDegats: extra.armeDegats ?? null
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
  bonusFixe = 0,
  bonusFixeLabel = "",
  bonusSituationnel = 0,
  difficulte = 8,
  armeDegats = null
} = {}) {
  const malusBlessure = actor.system.blessures?.malus ?? 0;
  const roll = await new Roll("2d6").evaluate();

  const champNiveau = champ?.system.niveau ?? 0;
  const specNiveau = spec?.niveau ?? 0;
  const total = roll.total + champNiveau + specNiveau + bonusAvantages + bonusFixe + bonusSituationnel + malusBlessure;
  const marge = total - difficulte;
  const reussite = marge >= 0;
  const degatsBruts = armeDegats !== null && reussite ? Math.max(0, armeDegats + marge) : null;

  const fmt = (n) => (n >= 0 ? `+${n}` : `${n}`);
  const detail = [
    champ ? `${champ.name} ${fmt(champNiveau)}` : null,
    spec ? `${spec.nom} ${fmt(specNiveau)}` : null,
    ...avantages.map((a) => `${a.name} ${fmt(a.system.valeur)}`),
    bonusFixe ? `${bonusFixeLabel || "Bonus"} ${fmt(bonusFixe)}` : null,
    bonusSituationnel ? `Situationnel ${fmt(bonusSituationnel)}` : null,
    malusBlessure ? `Blessures ${fmt(malusBlessure)}` : null
  ].filter(Boolean);

  const margeAffichee = marge >= 0 ? `+${marge}` : `${marge}`;
  const content = await renderTemplate(`${TPL}/chat/roll-card.hbs`, {
    titre, roll, total, difficulte, marge, margeAffichee, reussite, detail, degatsBruts
  });

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    rolls: [roll],
    sound: CONFIG.sounds.dice
  });

  return { roll, total, difficulte, marge, reussite, degatsBruts };
}
