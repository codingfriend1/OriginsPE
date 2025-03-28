
import { TicksPerSecond } from "@minecraft/server";
import { toAllPlayers } from "../../../origins/player";

/**
 * 
 * @param { import('@minecraft/server').Player } player 
 */
function night_vision(player) {

  if (!player.hasTag('power_night_vision')) return

  player.triggerEvent('r4isen1920_originspe:light_level');
  const lightLevel = player.getProperty('r4isen1920_originspe:light_level');

  if (lightLevel < 8) {
    player.addEffect('night_vision', TicksPerSecond * 12, { showParticles: false });
  } else {
    player.removeEffect('night_vision');
  }

}

toAllPlayers(night_vision, 3)
