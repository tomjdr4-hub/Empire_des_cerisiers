import { EDC } from "./config.mjs";
import { ouvrirJetDialogue } from "./dice.mjs";

/**
 * Jet de résistance à la peur ou à l'intimidation (Voie + Champ, comme la Résistance mentale,
 * p.253-255). En cas d'échec, la marge d'échec détermine automatiquement le malus applicable
 * (table p.254) et l'éventuel effet spécial (perte de tour, fuite, paralysie...).
 */
export async function rollResisterPeurIntimidation(actor, type) {
  const voieNiveau = actor.system.voie?.niveau ?? 0;
  const champMax = actor.system.champMax ?? 0;

  const resultat = await ouvrirJetDialogue(actor, {
    titre: type === "intimidation" ? "Résister à l'intimidation" : "Résister à la peur",
    bonusFixe: voieNiveau + champMax,
    bonusFixeLabel: `Voie+Champ (${voieNiveau}+${champMax})`
  });
  if (!resultat) return;

  if (!resultat.difficulteConnue) {
    ui.notifications.info("Précisez une difficulté dans le dialogue de jet pour connaître le malus applicable en cas d'échec (table p.254).");
    return;
  }

  if (resultat.reussite) {
    ui.notifications.info(`${actor.name} résiste !`);
    return;
  }

  const margeEchec = Math.abs(resultat.marge);
  const palier = EDC.resoudrePeurIntimidation(margeEchec);
  const effet = type === "intimidation" ? palier.effetIntimidation : palier.effetPeur;
  const cible = type === "intimidation" ? "aux jets allant à l'encontre de celui qui intimide" : "à tous les jets";

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="edc edc-roll-card echec">
      <header class="edc-roll-header"><h3>${type === "intimidation" ? "Intimidation" : "Peur"} — Échec</h3></header>
      <p>${actor.name} échoue à résister (marge d'échec ${margeEchec}) : <strong>${palier.malus} ${cible}</strong> le temps de la scène ou du combat.</p>
      ${effet ? `<p><em>${effet}</em></p>` : ""}
    </div>`
  });
}
