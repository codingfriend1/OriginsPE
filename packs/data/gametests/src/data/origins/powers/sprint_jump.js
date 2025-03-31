
import { TicksPerSecond } from "@minecraft/server";

import { toAllPlayers } from "../../../origins/player";

/**
 * 
 * @param { import('@minecraft/server').Player } player 
 */
function sprint_jump(player) {

  if(player.hasTag('power_sprint_jump') && player.isSprinting) {
    player.addEffect('jump_boost', TicksPerSecond * 12, { amplifier: 1.4, showParticles: false })
  } else if(!player.hasTag('perk_high_jumper') && !player.hasTag('empowering_aura_active') && !player.isSprinting) {
    player.removeEffect('jump_boost');
  }
}

toAllPlayers(sprint_jump, 2)
