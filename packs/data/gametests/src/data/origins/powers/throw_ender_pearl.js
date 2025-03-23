import { Direction, world, system, ItemLockMode, ItemStack, TicksPerSecond } from "@minecraft/server";
import { ResourceBar } from "../../../origins/resource_bar";
import { usepower } from "../../../utils/PubSub";


const blocksPerChunk = 16;
const safeMaxRenderChunks = 11.5;

// Cooldown configuration
const MIN_DISTANCE = 16;   // No cooldown below this
const MAX_DISTANCE = 192;  // Max cooldown at 12 chunks
const MAX_COOLDOWN = 15;   // Max cooldown in seconds
const MIN_TELEPORT_DISTANCE = 5; // Too close to allow teleporting
const POWER_CONTROL_ITEM_NAME = 'r4isen1920_originspe:origins_power.throw_ender_pearl';

usepower.subscribe(POWER_CONTROL_ITEM_NAME, throw_ender_pearl);

/**
 * Handles teleportation ability triggered by double right-click.
 * @param {import('@minecraft/server').Player} player 
 */
function throw_ender_pearl({ player }) {

  if (
    !player.hasTag('power_throw_ender_pearl') ||
    !player.hasTag('_control_use_throw_ender_pearl')
  ) return;

  const playerMaxRenderChunks = player.clientSystemInfo.maxRenderDistance;
  const maxRenderDistance = Math.min(playerMaxRenderChunks, safeMaxRenderChunks) * blocksPerChunk;

  // Abort if currently on cooldown
  if (player.hasTag('cooldown_3')) {
    cancelTeleport(player);
    return;
  }

  const targetBlock = player.getBlockFromViewDirection({ 
    maxDistance: maxRenderDistance, 
    includeLiquidBlocks: false 
  });

  if (!targetBlock) {
    cancelTeleport(player);
    return;
  }

  // 📌 Get adjacent block location to the clicked face
  const targetLocation = getTargetLocationFromBlockFace(targetBlock);

  // 🧱 Ensure space is clear (feet + head)
  if (!isSpaceClearForTeleport(targetLocation, targetBlock.block.dimension)) {
    player.runCommandAsync(`say No room to teleport there!`);
    cancelTeleport(player);
    return;
  }

  // 🎯 Snap to center of target block
  const centeredTarget = getCenteredBlockLocation(targetLocation);

  // 📏 Distance for cooldown & restriction
  const distance = getDistance(player.location, centeredTarget);

  // if (distance <= MIN_TELEPORT_DISTANCE) {
  //   player.removeTag('_control_use_throw_ender_pearl');
  //   return;
  // }

  const cooldownSeconds = calculateCooldown(distance);

  // ✅ Teleport player
  player.playSound('mob.endermen.portal', { volume: 1, pitch: 1 });
  world.playSound('mob.endermen.portal', targetLocation);
  player.teleport(centeredTarget, { dimension: targetBlock.block.dimension });

  // ⏳ Apply cooldown
  if (cooldownSeconds < 1) {
    player.removeTag('cooldown_3');
  } else {
    new ResourceBar(3, 0, 100, cooldownSeconds).push(player);
  }

  // 🧹 Clean up
  player.removeTag('_control_use_throw_ender_pearl');
}

/**
 * Calculates the 3D distance between two points.
 * @param {{ x: number, y: number, z: number }} from 
 * @param {{ x: number, y: number, z: number }} to 
 * @returns {number}
 */
function getDistance(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dz = to.z - from.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculates cooldown in seconds based on travel distance.
 * @param {number} distance 
 * @returns {number} Cooldown in seconds (0–15)
 */
function calculateCooldown(distance) {
  const clamped = Math.max(0, Math.min(distance - MIN_DISTANCE, MAX_DISTANCE - MIN_DISTANCE));
  return Math.ceil((clamped / (MAX_DISTANCE - MIN_DISTANCE)) * MAX_COOLDOWN);
}

/**
 * Cancels the teleport attempt with a "denied" sound and removes control tag.
 * @param {import('@minecraft/server').Player} player
 */
function cancelTeleport(player) {
  player.playSound('note.bass', { volume: 1, pitch: 1.5 });
  player.removeTag('_control_use_throw_ender_pearl');
}

/**
 * Gets the block location adjacent to the face the player clicked.
 * @param {import('@minecraft/server').BlockRaycastHit} targetBlock 
 * @returns {{ x: number, y: number, z: number }}
 */
function getTargetLocationFromBlockFace(targetBlock) {
  const block = targetBlock.block;
  switch (targetBlock.face) {
    case Direction.Down: return block.below().location;
    case Direction.East: return block.east().location;
    case Direction.North: return block.north().location;
    case Direction.South: return block.south().location;
    case Direction.Up: return block.above().location;
    case Direction.West: return block.west().location;
    default: return block.location;
  }
}

/**
 * Checks if a location is clear enough to teleport to.
 * Allows small decorative blocks like grass or flowers at feet level.
 * @param {{ x: number, y: number, z: number }} location 
 * @param {import('@minecraft/server').Dimension} dimension 
 * @returns {boolean}
 */
function isSpaceClearForTeleport(location, dimension) {
  const block = dimension.getBlock(location);
  const above = dimension.getBlock({ x: location.x, y: location.y + 1, z: location.z });

  const allowedFeetBlocks = new Set([
    "minecraft:air",
    "minecraft:grass",
    "minecraft:tallgrass",
    "minecraft:fern",
    "minecraft:dead_bush",
    "minecraft:seagrass",
    "minecraft:tall_seagrass",
    "minecraft:carpet",
    "minecraft:snow_layer",
    "minecraft:small_dripleaf",
    "minecraft:large_dripleaf_leaf",
    "minecraft:sweet_berry_bush",
    "minecraft:flowering_azalea",
    "minecraft:azalea",
    "minecraft:bamboo_sapling",
    "minecraft:mangrove_propagule"
  ]);

  return allowedFeetBlocks.has(block?.typeId) && above?.typeId === "minecraft:air";
}


/**
 * Offsets a block location slightly to center the teleport position.
 * @param {{ x: number, y: number, z: number }} location 
 * @returns {{ x: number, y: number, z: number }}
 */
function getCenteredBlockLocation(location) {
  return {
    x: location.x + 0.5,
    y: location.y + 0.1,
    z: location.z + 0.5
  };
}