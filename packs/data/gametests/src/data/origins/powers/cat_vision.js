
import { TicksPerSecond } from "@minecraft/server";
import { toAllPlayers } from "../../../origins/player";

/**
 * 
 * @param { import('@minecraft/server').Player } player 
 */
function cat_vision(player) {

  if (!player.hasTag('power_cat_vision')) return

  player.triggerEvent('r4isen1920_originspe:light_level');
  const lightLevel = player.getProperty('r4isen1920_originspe:light_level');

  player.addEffect('night_vision', TicksPerSecond * 70, { showParticles: false });
  // player.addEffect('strength', TicksPerSecond * 12, { amplifier: 0, showParticles: false });

  // if (lightLevel <= 14) {
  //   player.addEffect('night_vision', TicksPerSecond * 12, { showParticles: false });
  //   player.addEffect('strength', TicksPerSecond * 12, { amplifier: 0, showParticles: false });
  // } else {
  //   player.removeEffect('night_vision');
  //   player.removeEffect('strength');
  // }

}

toAllPlayers(cat_vision, TicksPerSecond * 60)
