/**
 * Bascule la case de blessures cliquée : la remplit (et toutes celles avant elle) si elle est
 * vide, ou la vide (elle et toutes celles après) si elle est déjà la dernière remplie. Partagé
 * entre les fiches Personnage et PNJ.
 */
export async function toggleBlessureCase(actor, index) {
  const actuel = actor.system.blessures.value;
  const nouveau = index + 1 === actuel ? index : index + 1;
  await actor.update({ "system.blessures.value": nouveau });
}
