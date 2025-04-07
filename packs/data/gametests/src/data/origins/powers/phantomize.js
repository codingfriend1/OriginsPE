
import { world, GameMode } from "@minecraft/server";

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
  if (!player.hasTag('_phantomized') && player.getGameMode() !== GameMode.spectator) return;

  const currentPos = player.location;
  const lastPosStr = player.getDynamicProperty('r4isen1920_originspe:last_pos');
  const lastPos = lastPosStr ? lastPosStr.split(',').map(Number) : null;

  const isPlayerMoving = !lastPos || (
    currentPos.x !== lastPos[0] ||
    currentPos.y !== lastPos[1] ||
    currentPos.z !== lastPos[2]
  );

  player.setDynamicProperty(
    'r4isen1920_originspe:last_pos',
    `${currentPos.x},${currentPos.y},${currentPos.z}`
  );

  const BAR_ID = 5;
  const STILLNESS_BEFORE_BAR = 5; // 0.5 seconds
  const BAR_DURATION_SECONDS = 2;
  const BAR_DURATION_TICKS = BAR_DURATION_SECONDS * 20 / 2; // 20
  const EXIT_AFTER_TICKS = STILLNESS_BEFORE_BAR + BAR_DURATION_TICKS; // 30

  const ticks = isPlayerMoving
    ? 0
    : Math.min((player.getDynamicProperty('r4isen1920_originspe:move_ticks') || 0) + 1, EXIT_AFTER_TICKS);

  player.setDynamicProperty('r4isen1920_originspe:move_ticks', ticks);

  const cooldown = new ResourceBar(BAR_ID, 100, 0, BAR_DURATION_SECONDS);

  if (isPlayerMoving) {
    cooldown.pop(player);
    player.removeTag('_phantomized_stopped_moving');
    return;
  }

  if (ticks === STILLNESS_BEFORE_BAR) {
    cooldown.push(player);
    player.addTag('_phantomized_stopped_moving');
  }

  if (ticks >= EXIT_AFTER_TICKS) {
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
