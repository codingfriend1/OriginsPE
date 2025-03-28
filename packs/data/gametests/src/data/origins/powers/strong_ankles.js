
import { toAllPlayers } from "../../../origins/player";

/**
 * 
 * @param { import('@minecraft/server').Player } player 
 */
function strong_ankles(player) {
  if (!player.hasTag('power_strong_ankles')) return

  // player.triggerEvent('r4isen1920_originspe:movement.0.15');
  player.triggerEvent('r4isen1920_originspe:movement.0.12');
}

toAllPlayers(strong_ankles, 5)