export class EDCActor extends Actor {
  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();

    const champs = this.items.filter((i) => i.type === "champ");
    const champMax = champs.reduce((max, c) => Math.max(max, c.system.niveau ?? 0), 0);
    const champsCombat = champs.filter((c) => c.system.initiative);
    const initiativeBonus = champsCombat.reduce((sum, c) => sum + (c.system.niveau ?? 0), 0);
    const champCombatMax = champsCombat.reduce((max, c) => Math.max(max, c.system.niveau ?? 0), 0);

    this.system.champMax = champMax;
    if (this.system.combat) {
      this.system.combat.initiativeBonus = initiativeBonus;
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
