
import { TicksPerSecond } from "@minecraft/server";

import { toAllPlayers } from "../../../origins/player";

/**
 * 
 * @param { import('@minecraft/server').Player } player 
 */
function cheaper_trades(player) {
  if (!player.hasTag('perk_cheaper_trades')) return;

  player.addEffect('village_hero', TicksPerSecond * 12, { amplifier: 2, showParticles: false });

}

toAllPlayers(cheaper_trades, 10)
