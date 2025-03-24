import { toAllPlayers } from "../../../origins/player";
import { Vector3 } from "../../../utils/Vec3";

/**
 * Applies claustrophobia effects to players in low-ceiling areas
 * @param { import('@minecraft/server').Player } player 
 */
function claustrophobia(player) {
  if (!player.hasTag('power_claustrophobia')) return;

  const rayDirection = new Vector3(0, 1, 0); // straight up
  const rayDistance = 2; // smaller distance to reduce flicker

  const block = player.dimension.getBlockFromRay(player.getHeadLocation(), rayDirection, { maxDistance: rayDistance })?.block;

  const currentLevel = player.getDynamicProperty('r4isen1920_originspe:claustrophobia') || 0;

  let newLevel = currentLevel;

  if (block?.permutation?.material?.isSolid) {
    newLevel = Math.min(currentLevel + 1, 200);
  } else {
    newLevel = Math.max(currentLevel - 1, 0);
  }

  player.setDynamicProperty('r4isen1920_originspe:claustrophobia', newLevel);

  const isNowClaustrophobic = newLevel >= 150;
  const wasClaustrophobic = player.hasTag('_claustrophobic');

  // Only apply effects if state has changed
  if (isNowClaustrophobic && !wasClaustrophobic) {
    player.triggerEvent('r4isen1920_originspe:attack.0');
    player.triggerEvent('r4isen1920_originspe:movement.0.05');
    player.addTag('_claustrophobic');
  } else if (!isNowClaustrophobic && wasClaustrophobic) {
    player.triggerEvent('r4isen1920_originspe:attack.1');
    player.triggerEvent('r4isen1920_originspe:movement.0.1');
    player.removeTag('_claustrophobic');
  }
}

toAllPlayers(claustrophobia, 2); // every 2 ticks
