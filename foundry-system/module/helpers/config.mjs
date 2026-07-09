export const EDC = {};

EDC.id = "empire-des-cerisiers";

/** Table des difficultés (Système de jeu, p.232) */
EDC.difficultes = {
  8: "Facile",
  12: "Compliqué",
  16: "Difficile",
  20: "Héroïque",
  24: "Surhumain",
  28: "Chimérique"
};

/** Niveaux de Champ / Voie (p.205) */
EDC.niveauxChamp = {
  1: "Novice",
  2: "Adepte",
  3: "Professionnel",
  4: "Expert",
  5: "Maître",
  6: "Grand maître",
  7: "Légende",
  8: "Divinité"
};

/**
 * Table de blessures des Premiers rôles / PJ (p.237).
 * `seuil` = points de dégâts cumulés à partir desquels le palier s'applique.
 */
EDC.blessuresPersonnage = [
  { id: "contusions", label: "Contusions", seuil: 0, malus: 0 },
  { id: "meurtrissures", label: "Meurtrissures", seuil: 6, malus: -1 },
  { id: "legeres", label: "Blessures légères", seuil: 11, malus: -3 },
  { id: "moderees", label: "Blessures modérées", seuil: 16, malus: -5 },
  { id: "graves", label: "Blessures graves", seuil: 21, malus: -7 },
  { id: "portesDeLaMort", label: "Aux portes de la mort", seuil: 26, malus: -9, bonusPortesDeLaMort: 3 },
  { id: "invalidite", label: "Invalidité/Inconscience", seuil: 31, malus: null, echecAutomatique: true }
];

/** Table de blessures des Seconds rôles (p.238) */
EDC.blessuresSecondRole = [
  { id: "legeres", label: "Blessures légères", seuil: 0, malus: -1 },
  { id: "graves", label: "Blessure grave", seuil: 6, malus: -3 },
  { id: "incapacite", label: "Incapacité/inconscient", seuil: 11, malus: null, echecAutomatique: true }
];

/**
 * Table de Majoration pour la difficulté des rituels (p.250).
 * Chaque ligne d'index N coûte N points de Majoration à choisir sur le jet.
 * `bonusMalus` = intensité du bonus/malus octroyable au sortilège ; `invocationType` = nature de
 * l'entité invocable (renseignée uniquement aux paliers charnières) ; `invocationNiveauChamp` =
 * niveau de Champ requis chez l'invocateur.
 */
EDC.majorationRituel = [
  { points: 0, portee: "Contact", duree: "Instantanée / 1 action", degatsSoins: 1, cibles: "Soi-même", bonusMalus: 1, invocationType: "Figurant (petit esprit type Kodama, esprit mineur, petit kami mineur, etc.)", invocationNiveauChamp: "1 niveau de Champ" },
  { points: 1, portee: "3 mètres", duree: "1 tour", degatsSoins: 2, cibles: 1, bonusMalus: 2, invocationType: null, invocationNiveauChamp: "2 niveaux de Champ(s)" },
  { points: 2, portee: "10 mètres", duree: "3 tours", degatsSoins: 3, cibles: 2, bonusMalus: 3, invocationType: "Second rôle (esprit classique type, kami local, spectre, shikigami, ancêtre, etc.)", invocationNiveauChamp: "3 niveaux de Champ(s)" },
  { points: 3, portee: "30 mètres", duree: "5 tours", degatsSoins: 5, cibles: 3, bonusMalus: 4, invocationType: null, invocationNiveauChamp: "4 niveaux de Champ(s)" },
  { points: 4, portee: "50 mètres", duree: "1 scène", degatsSoins: 7, cibles: 4, bonusMalus: 5, invocationType: null, invocationNiveauChamp: "5 niveaux de Champ(s)" },
  { points: 5, portee: "100 mètres", duree: "1 jour", degatsSoins: 10, cibles: 5, bonusMalus: 6, invocationType: "Héros (6 niveaux de Champ)", invocationNiveauChamp: "6 niveaux de Champ(s)" },
  { points: 6, portee: "À vue", duree: "1 semaine", degatsSoins: 15, cibles: 6, bonusMalus: 7, invocationType: null, invocationNiveauChamp: "7 niveaux de Champ(s)" }
];

/** Difficulté de base pour tout jet standard (p.230) et pour les rituels (p.249) */
EDC.difficulteBase = 8;

/** Progression Aspect -> points de Puissance disponibles pour créer des techniques (p.212) */
EDC.puissanceParNiveauAspect = {
  1: 5,
  2: 10,
  3: 10,
  4: 10,
  5: 15,
  6: 20,
  7: 20,
  8: 25
};

/** Grandes Voies et leurs Aspects (p.217-227) */
EDC.voies = {
  kami: {
    nom: "Voie des Kami",
    aspects: ["La Pureté", "La Lumière", "L'Entre-Monde"]
  },
  arcEtCheval: {
    nom: "Voie de l'Arc et du Cheval",
    aspects: ["Le Devoir et la Droiture", "La Loyauté et la Fidélité", "La Bravoure et le Courage", "L'Impassibilité", "Le Mépris de la mort"]
  },
  huitRoiDragons: {
    nom: "Voie des Huit Roi-Dragons",
    aspects: ["Le Dragon du Centre", "Le Dragon de l'Est", "Le Dragon du Sud", "Le Dragon de l'Ouest", "Le Dragon du Nord"]
  },
  quatreDirectionsIntermediaires: {
    nom: "Voie des Quatre Directions Intermédiaires",
    aspects: ["La Voie Intermédiaire"]
  },
  ninjo: {
    nom: "Voie du Ninjô",
    aspects: ["Le Ninkyo", "Le Cœur", "La Liberté", "La Colère"]
  },
  yomiNoKuni: {
    nom: "Voie Maudite du Yomi-no-kuni",
    reserveAuxPnj: true,
    aspects: ["Le Kegare", "Les Ténèbres", "La Mort"]
  }
};

/** Résout le palier de blessure applicable pour un total de dégâts donné */
EDC.resoudrePalierBlessure = function (totalDegats, table = EDC.blessuresPersonnage) {
  let palier = table[0];
  for (const p of table) {
    if (totalDegats >= p.seuil) palier = p;
  }
  return palier;
};

/**
 * Construit la grille de cases à cocher (5 par palier) utilisée par les fiches pour représenter
 * visuellement la table de blessures, dans l'esprit de la feuille de personnage originale.
 */
EDC.construireGrilleBlessures = function (table, valeurActuelle) {
  return table.map((tier, tierIdx) => {
    let malusAffiche;
    if (tier.echecAutomatique) malusAffiche = "Échec automatique";
    else if (tier.bonusPortesDeLaMort) malusAffiche = `+${tier.bonusPortesDeLaMort}/${tier.malus}`;
    else if (!tier.malus) malusAffiche = "Aucun";
    else malusAffiche = `${tier.malus}`;

    return {
      label: tier.label,
      malusAffiche,
      boxes: Array.from({ length: 5 }, (_, i) => {
        const globalIndex = tierIdx * 5 + i;
        return { index: globalIndex, rempli: globalIndex < valeurActuelle };
      })
    };
  });
};
