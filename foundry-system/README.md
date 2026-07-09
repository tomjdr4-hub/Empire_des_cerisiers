# L'Empire des Cerisiers — système Foundry VTT (non officiel)

Système personnalisé pour [Foundry VTT](https://foundryvtt.com/) V14, pour le jeu de rôle
**L'Empire des Cerisiers** (Olivier Sanfilippo, Arkhane Asylum Publishing). Ce système ne contient
aucun texte de règle protégé ni illustration de l'éditeur : il faut posséder le livre de règles
pour jouer.

## Installation

Dans Foundry VTT, écran de configuration des systèmes de jeu, coller ce lien de manifeste :

```
https://github.com/tomjdr4-hub/Empire_des_cerisiers/releases/latest/download/system.json
```

## Contenu

- Feuilles de Personnage (Premier rôle) et de PNJ (Second rôle / Figurant)
- Jets automatisés : Champ + Spécialisation + Avantages/Désavantages contre une difficulté,
  avec application automatique du malus de blessure courant
- Combat : initiative auto (2d6 + Champs cochés "Initiative"), jets d'attaque avec bouton
  "Appliquer les dégâts" sur les tokens ciblés (soustrait la protection d'armure)
- Techniques : activation (2d6+Voie+Aspect vs Puissance) et aide à la création
  ("Calculer une technique")
- Rituels : calculateur de difficulté par Majoration ("Calculer une difficulté")
- Compendiums : Champs types, Voies et Aspects, Avantages/Désavantages d'exemple, Armes et Armures

### Limites connues (v0.1.0)

- Les jets opposés (attaque vs défense) ne sont pas résolus automatiquement l'un contre l'autre :
  chaque camp lance son propre jet (bouton "Défense" sur la fiche), puis on compare les deux
  totaux manuellement avant de cliquer sur "Appliquer les dégâts".
- Le nombre d'actions par tour est un champ éditable, pas un compteur consommé automatiquement
  pendant le combat.

## Développement

```
npm install
npm run build:packs   # recompile les compendiums depuis packs/_source/*.json
```

Aucune instance Foundry locale n'a servi à la vérification de ce système : seule une validation
statique (syntaxe JS, JSON) a été effectuée. Merci de signaler tout problème de rendu ou de
comportement rencontré en jeu.

## Publier une nouvelle version

Depuis la racine du dépôt (pas depuis `foundry-system/`) :

```
./release.sh 0.2.0 "Description des changements"
```

Ce script met à jour `foundry-system/system.json`, recompile les compendiums, commite, tague,
pousse et crée une release GitHub avec `system.json` et une archive `system.zip` en pièces jointes.
