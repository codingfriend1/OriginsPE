import { world, system } from "@minecraft/server";
import { setup } from "../../../utils/PubSub";


const TELEPORT_FAMILY_TAG = "power_teleport_family";

export function spawnWithFamily(event) {

  console.log(`spawnWithFamily`, event)

  const { player, initialSpawn } = event;

  // Only process respawns (not initial spawns)
  if (initialSpawn) return;

  // If the player has a bed spawn point, let them spawn there (normal behavior)
  if (player.getSpawnPoint()) {
    return;
  }

  // Find the first player with the teleport_family tag
  const teleportFamilyPlayer = world.getAllPlayers().find(p => p.hasTag(TELEPORT_FAMILY_TAG));

  console.log(`teleportFamilyPlayer.name`, teleportFamilyPlayer.name)


  if (!teleportFamilyPlayer) {    // If no player with the tag is found, fall back to world spawn
    player.sendMessage({ text: "No player with Teleport Family power found. Respawning at world spawn." });
    return;
  }

  // Get the location of the player with the teleport_family tag
  const { x, y, z } = teleportFamilyPlayer.location;
  const dimension = teleportFamilyPlayer.dimension;

  // Teleport the player immediately to ensure they spawn at the new location
  player.teleport({ x, y, z }, { dimension });

  // Notify the player
  player.sendMessage([
    { text: "No bed spawn found. Respawned at " },
    { text: teleportFamilyPlayer.name },
    { text: "'s location!" }
  ]);

  // Notify the teleport_family player (optional)
  teleportFamilyPlayer.sendMessage([
    { text: player.name },
    { text: " respawned at your location!" }
  ]);
}

setup.subscribe('r4isen1920_originspe:teleport_family', spawnWithFamily)