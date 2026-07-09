export class EDCActor extends Actor {
  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();

    const champs = this.items.filter((i) => i.type === "champ");
    const champMax = champs.reduce((max, c) => Math.max(max, c.system.niveau ?? 0), 0);
    const champsCombat = champs.filter((c) => c.system.initiative);
    const initiativeBonusChamps = champsCombat.reduce((sum, c) => sum + (c.system.niveau ?? 0), 0);
    const champCombatMax = champsCombat.reduce((max, c) => Math.max(max, c.system.niveau ?? 0), 0);

    // Bonus/malus d'équipement (p.238-240) : uniquement les armes/armures équipées.
    const armesEquipees = this.items.filter((i) => i.type === "arme" && i.system.equipe);
    const armureEquipee = this.items.find((i) => i.type === "armure" && i.system.equipe) ?? null;
    const bonusInitiativeArmes = armesEquipees.reduce((sum, a) => sum + (a.system.bonusMalusInitiative ?? 0), 0);
    const malusInitiativeArmure = armureEquipee?.system.malusInitiative ?? 0;

    this.system.champMax = champMax;
    this.system.protectionActive = armureEquipee?.system.protection ?? 0;
    if (this.system.combat) {
      this.system.combat.initiativeBonus = initiativeBonusChamps + bonusInitiativeArmes + malusInitiativeArmure;
      // Nombre d'actions par tour = Champ de combat le plus élevé / 2, arrondi au supérieur (p.234)
      this.system.combat.actionsParTour = Math.ceil(champCombatMax / 2);
    }
    if (this.system.voie) this.system.resistanceMentale = (this.system.voie.niveau ?? 0) + champMax;
  }

  /** @override */
  getRollData() {
    const data = super.getRollData();
    data.initiativeBonus = this.system.combat?.initiativeBonus ?? 0;
    data.blessureMalus = this.system.blessures?.malus ?? 0;
    return data;
  }
}
