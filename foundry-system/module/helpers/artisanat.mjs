import { EDC } from "./config.mjs";
import { ouvrirJetDialogue } from "./dice.mjs";

/**
 * Jet d'Artisanat (p.254-259) : choix d'une Qualité recherchée (table p.256), jet de Champ +
 * Spécialisation contre une difficulté de 8 + Qualité. En cas de réussite, rappelle les bonus
 * conférés par cette Qualité à l'objet créé.
 */
export async function rollArtisanat(actor) {
  const options = EDC.qualiteArtisanat.map((q) => {
    const parts = [];
    if (q.bonusJet) parts.push(`+${q.bonusJet} à un jet précis`);
    if (q.bonusArmure) parts.push(`+${q.bonusArmure} armure`);
    parts.push(`${q.degatsSoins} dégâts/soins (potion, élixir, poison)`);
    return { value: q.points, label: `Qualité ${q.points} — ${parts.join(", ")}` };
  });

  const content = await renderTemplate(`systems/${EDC.id}/templates/dialogs/artisanat-qualite.hbs`, { options });

  const choix = await foundry.applications.api.DialogV2.wait({
    window: { title: "Artisanat : choisir la Qualité" },
    content,
    rejectClose: false,
    buttons: [
      { action: "continuer", label: "Continuer", default: true, callback: (event, button) => new FormData(button.form) },
      { action: "annuler", label: "Annuler" }
    ]
  });
  if (!choix || choix === "annuler") return;

  const qualite = Number(choix.get("qualite") || 0);
  const palier = EDC.qualiteArtisanat.find((q) => q.points === qualite);

  const resultat = await ouvrirJetDialogue(actor, {
    titre: qualite > 0 ? `Artisanat (Qualité ${qualite})` : "Artisanat",
    difficulteInitiale: EDC.difficulteBase + qualite
  });
  if (!resultat || !resultat.reussite) return;

  if (palier) {
    const parts = [];
    if (palier.bonusJet) parts.push(`+${palier.bonusJet} à un type de jet précis fait avec l'objet (attaque, défense, dégâts, une Spécialisation, etc.)`);
    if (palier.bonusArmure) parts.push(`+${palier.bonusArmure} bonus d'armure supplémentaire`);
    parts.push(`${palier.degatsSoins} dégâts/soins si l'objet est une potion, un élixir médical ou un poison`);
    ui.notifications.info(`Objet de Qualité ${qualite} créé avec succès : ${parts.join(" ; ")}.`);
  } else {
    ui.notifications.info("Objet simple créé avec succès.");
  }
}
