// Génère les fichiers JSON source des compendiums (packs/_source/<pack>/<id>.json) à partir des
// données extraites du livre de règles. À relancer avec `node scripts/seed-compendium-source.mjs`
// si l'on veut regénérer le contenu de base (n'écrase pas les éventuels ajouts manuels ailleurs).
import { mkdirSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

function foundryId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(16);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

function ecrireDocument(pack, doc) {
  const dir = `packs/_source/${pack}`;
  mkdirSync(dir, { recursive: true });
  const _id = foundryId();
  // `_key` est requis par @foundryvtt/foundryvtt-cli (compilePack) : sans lui, le document est
  // silencieusement ignoré à la compilation. Format `!items!<_id>` pour un Item de premier niveau.
  const complet = { _id, _key: `!items!${_id}`, folder: null, sort: 0, flags: {}, ...doc };
  writeFileSync(`${dir}/${_id}.json`, JSON.stringify(complet, null, 2) + "\n", "utf-8");
}

// ---------------------------------------------------------------------------
// Champs (p.205-206)
// ---------------------------------------------------------------------------
const champs = [
  "Administrateur", "Artiste de rue", "Bushi (soldat)", "Chasseur", "Courtisan", "Cuisinier",
  "Diplomate", "Duelliste", "Éleveur", "Espion", "Forgeron", "Inspecteur", "Marchand", "Marin",
  "Mercenaire", "Miko", "Onmyôji", "Prêtre shinto (kannushi)", "Chamane", "Shinobi (ninja)",
  "Stratège", "Wakô", "Yojimbo", "Sohei", "Sorcier",
  "Bakeneko (yôkai)", "Kitsune (yôkai)", "Tanuki (yôkai)", "Tengu (yôkai)"
];
for (const nom of champs) {
  ecrireDocument("champs", {
    name: nom,
    type: "champ",
    img: "icons/svg/book.svg",
    system: { niveau: 1, bonus: 0, initiative: false, description: "" }
  });
}

// ---------------------------------------------------------------------------
// Voies et Aspects (p.217-227)
// ---------------------------------------------------------------------------
const voies = {
  "Voie des Kami": ["La Pureté", "La Lumière", "L'Entre-Monde"],
  "Voie de l'Arc et du Cheval": [
    "Le Devoir et la Droiture", "La Loyauté et la Fidélité", "La Bravoure et le Courage",
    "L'Impassibilité", "Le Mépris de la mort"
  ],
  "Voie des Huit Roi-Dragons": [
    "Le Dragon du Centre", "Le Dragon de l'Est", "Le Dragon du Sud", "Le Dragon de l'Ouest", "Le Dragon du Nord"
  ],
  "Voie des Quatre Directions Intermédiaires": ["La Voie Intermédiaire"],
  "Voie du Ninjô": ["Le Ninkyo", "Le Cœur", "La Liberté", "La Colère"],
  "Voie Maudite du Yomi-no-kuni (réservée aux PNJ)": ["Le Kegare", "Les Ténèbres", "La Mort"]
};
for (const [voie, aspects] of Object.entries(voies)) {
  for (const aspect of aspects) {
    ecrireDocument("voies-aspects", {
      name: aspect,
      type: "aspect",
      img: "icons/svg/sun.svg",
      system: { voie, niveau: 0, description: "" }
    });
  }
}

// ---------------------------------------------------------------------------
// Avantages / Désavantages (p.208-211)
// ---------------------------------------------------------------------------
const avantages = [
  ["Âme de l'ours lune", 1, "L'ours lune est associé aux divinités des montagnes. Bonus égal au niveau sur les jets où la détermination du personnage entre en jeu."],
  ["Béni par Uzume-no-kami", 1, "Bonus égal au niveau sur les jets liés à la danse, à la séduction ou pour faire rire par le mouvement."],
  ["Héritier(ère) d'un clan", 2, "Le personnage appartient à la noblesse guerrière et bénéficie des avantages liés à son rang (aucun bonus technique direct)."],
  ["Initié de la Voie du Roi Sôjôbô", 1, "Sôjôbô, roi tengu légendaire réputé pour l'escrime. Bonus égal au niveau sur les jets liés au maniement d'une épée."],
  ["Sagesse de Zocho-ten", 1, "Bonus égal au niveau sur les jets de recherche documentaire ou de connaissances livresques."],
  ["Souplesse des bakeneko", 1, "Bonus égal au niveau lorsque la souplesse légendaire du personnage entre en jeu (liens, espaces réduits, contorsion)."],
  ["Touché par la grâce des kitsune", 1, "Bonus égal au niveau sur les jets où l'apparence et le charme du personnage entrent en compte."]
];
for (const [nom, valeur, description] of avantages) {
  ecrireDocument("avantages-desavantages", {
    name: nom, type: "avantage", img: "icons/svg/upgrade.svg", system: { valeur, description }
  });
}

const desavantages = [
  ["Cœur de kitsune", -1, "Le personnage s'amourache facilement. Malus égal au niveau pour résister à la tentation d'une aventure sentimentale ou charnelle."],
  ["Ennemi intime", -1, "Le personnage s'est fait un ennemi intime (PNJ) dont l'acharnement et la puissance dépendent du niveau du désavantage."],
  ["Maudit par la Montagne", -1, "Malus égal au niveau sur les jets de survie ou athlétiques en zone montagneuse."],
  ["Passé criminel", -1, "Malus égal au niveau lors d'interactions sociales avec les représentants de l'autorité."],
  ["Vieille blessure", -1, "Malus égal au niveau sur les actions liées au handicap engendré par l'ancienne blessure."],
  ["Touché par le Yomi", -1, "(Accord du MJ requis, jusqu'à -5.) Malus égal au niveau (max -3 en jeu) sur les interactions sociales avec les êtres purs ou médiumniques."]
];
for (const [nom, valeur, description] of desavantages) {
  ecrireDocument("avantages-desavantages", {
    name: nom, type: "desavantage", img: "icons/svg/downgrade.svg", system: { valeur, description }
  });
}

// ---------------------------------------------------------------------------
// Armes et armures (p.239-243)
// ---------------------------------------------------------------------------
const armesMelee = [
  ["Tachi, katana", 4, "+1 initiative"],
  ["Wakizashi (sabre/épée courte)", 3, ""],
  ["Tantô, aiguchi, couteaux", 2, "+1 pour les dissimuler"],
  ["Tetsubô, Kanabô (masse)", 5, "-2 aux protections adverses, -2 en initiative"],
  ["Ono (grand modèle, hache)", 5, "-2 initiative"],
  ["Yari, naginata, nagamaki, armes d'hast", 4, "+2 initiative au 1er tour et contre tout nouvel adversaire, -2 les autres tours contre un adversaire déjà engagé"]
];
for (const [nom, facteurDegats, notes] of armesMelee) {
  ecrireDocument("equipement", {
    name: nom, type: "arme", img: "icons/svg/sword.svg",
    system: { facteurDegats, bonusMalusInitiative: 0, portee: "Mêlée", notes }
  });
}
const armesDistance = [
  ["Shuriken, shaken (petits projectiles)", 1, "Portée 10 m (0-5 m +0, 6-10 m -1) ; +3 pour les dissimuler"],
  ["Yumi (arc long)", 3, "Portée 100+ m (0-50 m +0, 51-100 m -2) ; une action pour recharger"],
  ["Hankyu (arc court)", 3, "+1 dégâts de 0 à 15 m ; portée 50+ m (0-15 m +0, 16-50 m -2)"]
];
for (const [nom, facteurDegats, notes] of armesDistance) {
  ecrireDocument("equipement", {
    name: nom, type: "arme", img: "icons/svg/bones.svg",
    system: { facteurDegats, bonusMalusInitiative: 0, portee: "Distance", notes }
  });
}

const armures = [
  ["Armure souple (cuir léger, vêtements renforcés)", 1, 0],
  ["Armure légère (tatami-do)", 3, -1],
  ["Armure lourde de samurai (kozane-do)", 5, -3]
];
for (const [nom, protection, malusInitiative] of armures) {
  ecrireDocument("equipement", {
    name: nom, type: "armure", img: "icons/svg/shield.svg",
    system: { protection, malusInitiative, bonusForce: 0, notes: "" }
  });
}

console.log("Sources de compendiums générées dans packs/_source/.");
