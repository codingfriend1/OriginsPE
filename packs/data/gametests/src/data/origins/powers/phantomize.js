
import { world } from "@minecraft/server";

import { toAllPlayers } from "../../../origins/player";
import { ResourceBar } from "../../../origins/resource_bar";
import { usepower } from "../../../utils/PubSub";

const POWER_CONTROL_ITEM_NAME = 'r4isen1920_originspe:origins_power.phantomize';

usepower.subscribe(POWER_CONTROL_ITEM_NAME, phantomize);

/**
 * 
 * @param { import('@minecraft/server').Player } player 
 */
function phantomize({ player }) {
  if (player.hasTag('power_phantomize') && player.hasTag('_control_use_phantomize') && !player.hasTag('_phantomized')) {

    enterPhantomizedForm(player);

  }
}

function checkMovement(player) {
  if (!player.hasTag('_phantomized')) return;

  // Get and store position as a string
  const currentPos = player.location;
  const lastPosStr = player.getDynamicProperty('r4isen1920_originspe:last_pos');
  const lastPos = lastPosStr ? lastPosStr.split(',').map(Number) : null;

  const cooldown = new ResourceBar(5, 100, 0, 2); // 2 seconds countdown

  const isPlayerMoving = !lastPos || (
    currentPos.x !== lastPos[0] ||
    currentPos.y !== lastPos[1] ||
    currentPos.z !== lastPos[2]
  );

  // Save current location for next tick
  player.setDynamicProperty(
    'r4isen1920_originspe:last_pos',
    `${currentPos.x},${currentPos.y},${currentPos.z}`
  );

  if (isPlayerMoving) {
    // Player is moving: reset state
    player.setDynamicProperty('r4isen1920_originspe:move_ticks', 0);
    cooldown.pop(player);
    player.removeTag('_phantomized_stopped_moving');
    return;
  }

  // Player is not moving — count how long they've been still
  const ticks = Math.min(
    (player.getDynamicProperty('r4isen1920_originspe:move_ticks') || 0) + 1,
    40 // 2 seconds at 20 TPS
  );
  player.setDynamicProperty('r4isen1920_originspe:move_ticks', ticks);

  if (ticks >= 5 && !player.hasTag('_phantomized_stopped_moving')) {
    // After 5 ticks (0.25s) show resource bar (not instant)
    cooldown.push(player);
    player.addTag('_phantomized_stopped_moving');
  }

  if (ticks >= 20) {
    // Player stayed still for 2 seconds, end form
    cooldown.pop(player);
    exitPhantomizedForm(player);
  }
}


toAllPlayers(checkMovement, 2);


/**
 * 
 * @param { import('@minecraft/server').Player } player 
 */
function enterPhantomizedForm(player) {

  player.runCommand('gamemode spectator');

  world.playSound('mob.endermen.portal', player.location, { pitch: 0.75 });

  player.addTag('_phantomized');
  player.removeTag('_control_use_phantomize');
  player.setDynamicProperty('r4isen1920_originspe:phantomized_start', player.location);

}

/**
 * 
 * @param { import('@minecraft/server').Player } player 
 */
function exitPhantomizedForm(player) {

  player.runCommand('gamemode survival');

  world.playSound('mob.endermen.portal', player.location, { pitch: 0.75 });

  player.removeTag('_phantomized');
  player.removeTag('_control_use_phantomize');
  player.setDynamicProperty('r4isen1920_originspe:move_ticks', 0)

}
