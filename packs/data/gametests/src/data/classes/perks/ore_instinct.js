import {
  world,
  TicksPerSecond,
  BlockVolume,
  system,
  BlockPermutation,
  BlockTypes
} from "@minecraft/server";
import { Vector3 } from "../../../utils/Vec3";
import { toAllPlayers } from '../../../origins/player'

const PING_FREQUENCY = TicksPerSecond * 10;
const EFFECT_DURATION = TicksPerSecond * 2;
const DETECTION_RADIUS = 16; // radius around player to scan

const ORE_IDS = [
  "minecraft:coal_ore",
  "minecraft:iron_ore",
  "minecraft:copper_ore",
  "minecraft:gold_ore",
  "minecraft:redstone_ore",
  "minecraft:lapis_ore",
  "minecraft:diamond_ore",
  "minecraft:emerald_ore",
  "minecraft:deepslate_coal_ore",
  "minecraft:deepslate_iron_ore",
  "minecraft:deepslate_copper_ore",
  "minecraft:deepslate_gold_ore",
  "minecraft:deepslate_redstone_ore",
  "minecraft:deepslate_lapis_ore",
  "minecraft:deepslate_diamond_ore",
  "minecraft:deepslate_emerald_ore"
];

const offsets = [
  { x: 0, y: 1, z: 0 },   // up
  { x: 0, y: -1, z: 0 },  // down
  { x: 1, y: 0, z: 0 },   // east
  { x: -1, y: 0, z: 0 },  // west
  { x: 0, y: 0, z: 1 },   // south
  { x: 0, y: 0, z: -1 }   // north
];

/**
 * Returns the first adjacent block position that is air or water.
 * @param {import('@minecraft/server').Player} player
 * @param {{x: number, y: number, z: number}} pos
 * @returns {{x: number, y: number, z: number} | null}
 */
function findOpenAdjacentPos(player, pos) {

  for (const offset of offsets) {
    const checkPos = {
      x: pos.x + offset.x,
      y: pos.y + offset.y,
      z: pos.z + offset.z
    };

    const block = player.dimension.getBlock(checkPos);
    if (block?.typeId !== 'minecraft:air' && !block?.typeId.startsWith('minecraft:light_block')) continue;

    return block
  }

  return null; // No open adjacent space found
}


/**
 * Highlights ore blocks around the player by spawning glowing marker entities.
 * @param {import('@minecraft/server').Player} player
 */
function detect_ores(player) {
  if (!player.hasTag("perk_ore_instinct")) return;
  
  const { x, y, z } = player.location;

  const from = {
    x: Math.floor(x - DETECTION_RADIUS),
    y: Math.max(0, Math.floor(y - DETECTION_RADIUS)), // Prevent going below bedrock
    z: Math.floor(z - DETECTION_RADIUS)
  };

  const to = {
    x: Math.floor(x + DETECTION_RADIUS),
    y: Math.min(319, Math.floor(y + DETECTION_RADIUS)), // Cap at world height
    z: Math.floor(z + DETECTION_RADIUS)
  };

  const volume = new BlockVolume(from, to);

  const listBlockVolume = player.dimension.getBlocks(volume, { includeTypes: ORE_IDS }, true);

  const blockLocationIterator = listBlockVolume.getBlockLocationIterator();

  for (const orePosition of blockLocationIterator) {
    const adjacentAirBlock = findOpenAdjacentPos(player, orePosition);

    if(!adjacentAirBlock) continue

    player.dimension.spawnParticle(`r4isen1920_originspe:vein_mine`, adjacentAirBlock.center());
  }
}

toAllPlayers(detect_ores, PING_FREQUENCY);
