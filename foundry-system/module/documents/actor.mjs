export class EDCActor extends Actor {
  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();

    const champs = this.items.filter((i) => i.type === "champ");
    const champMax = champs.reduce((max, c) => Math.max(max, c.system.niveau ?? 0), 0);
    const initiativeBonus = champs
      .filter((c) => c.system.initiative)
      .reduce((sum, c) => sum + (c.system.niveau ?? 0), 0);

    this.system.champMax = champMax;
    if (this.system.combat) this.system.combat.initiativeBonus = initiativeBonus;
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
