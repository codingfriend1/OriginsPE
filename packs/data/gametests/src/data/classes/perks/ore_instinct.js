import {
  world,
  TicksPerSecond,
  BlockVolume
} from "@minecraft/server";
import { Vector3 } from "../../../utils/Vec3";
import { toAllPlayers } from '../../../origins/player'

const PING_FREQUENCY = TicksPerSecond * 30;
const EFFECT_DURATION = TicksPerSecond * 2;
const DETECTION_RADIUS = 64; // radius around player to scan

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

  const blocks = player.dimension.getBlocks(volume, ORE_IDS, true);

  for (const block of blocks) {
    // Spawn a glowing marker just above the ore
    
  }
}

toAllPlayers(detect_ores, PING_FREQUENCY);
