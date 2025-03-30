import {
  world,
  system,
  ItemStack,
  ItemTypes,
  EnchantmentTypes,
  ItemComponentTypes
} from "@minecraft/server";
import { playerEvents } from "./PubSub";

const exceptions = [
  'minecraft:filled_map',
  'minecraft:map'
];

export function resetKeepOnDeath(player) {

  const container = player?.getComponent("inventory")?.container;
  if (!container) return;

  for (let i = 0; i < container.size; i++) {
    const item = container.getItem(i);
    if (item?.keepOnDeath) {
      item.keepOnDeath = false
      container.setItem(i, item);
    }
  }
}

export function isMap(item) {
  return exceptions.includes(item?.typeId) || !item.isStackable;
}


export function memorizeHotbar(player) {
  const container = player.getComponent("inventory")?.container;
  if (!container) return;

  const memories = [];

  for (let i = 9; i < container.size; i++) {
    const item = container.getItem(i);

    if (item?.keepOnDeath) {
      item.keepOnDeath = false
      container.setItem(i, item);
    }
  }

  for (let slot = 0; slot <= 8; slot++) {
    remember(slot, container, memories);
  }

  player.setDynamicProperty("saved_inventory", JSON.stringify(memories));
}

export function remember(slot, container, memories) {
  const item = container.getItem(slot);
  if (!item) return;

  if(isMap(item) && !item.keepOnDeath) {
    item.keepOnDeath = true
    container.setItem(slot, item);
  } else if (!isMap(item)) {
    const entry = {
      slot: slot,
      typeId: item.typeId,
      amount: item.amount,
      nameTag: item.nameTag,
      lore: item.lore,
    };

    memories.push(entry);
  }
}

export function memorizeInventory(player) {
  const container = player.getComponent("inventory")?.container;
  if (!container) return;

  const memories = [];

  for (let slot = 0; slot < container.size; slot++) {
    remember(slot, container, memories);
  }

  player.setDynamicProperty("saved_inventory", JSON.stringify(memories));
}



export function rememberInventory(player) {
  const data = player.getDynamicProperty("saved_inventory");
  if (!data) return;

  const container = player.getComponent("inventory")?.container;
  if (!container) return;

  const items = JSON.parse(data);

  for (const saved of items) {
    try {
      const item = new ItemStack(ItemTypes.get(saved.typeId), saved.amount);

      item.nameTag = saved.nameTag;
      item.lore = saved.lore;

      container.setItem(saved.slot, item);
    } catch (e) {
      console.warn(`Failed to restore item in slot ${saved.slot}:`, e);
    }
  }
}


const recentDeaths = new Map(); // playerId -> { time: tick, location }
const DEATH_RADIUS = 15; // blocks
const DEATH_TICKS_WINDOW = 20; // 2 seconds

export function getRecentDeaths() {
  return recentDeaths;
}

// Track player death info
world.afterEvents.entityDie.subscribe((event) => {
  const entity = event.deadEntity;
  if (entity?.typeId === "minecraft:player" && (entity?.hasTag('power_essentials') || entity?.hasTag('power_good_memory'))) {
    
    recentDeaths.set(entity.id, {
      time: system.currentTick,
      location: entity.location,
    });

    // Clean up after ~2 minutes
    system.runTimeout(() => {
      recentDeaths.delete(entity.id);
    }, 20 * 60 * 30);
  }
});


// Restore on respawn
world.afterEvents.playerSpawn.subscribe((event) => {
  const player = event.player;
  if (!recentDeaths.has(player.id)) return;

  system.run(() => {
    rememberInventory(player);
    recentDeaths.delete(player.id);
  });
});

// Delay entitySpawn processing
world.afterEvents.entitySpawn.subscribe((event) => {
  const entity = event.entity;

  // Only consider item entities
  if (entity.typeId !== "minecraft:item" && event.cause !== 'Spawned') return;

  // Delay by 1 tick to let entityDie populate recentDeaths
  system.run(() => {
    const itemComp = entity.getComponent("item");
    const itemStack = itemComp?.itemStack;
    const itemType = itemStack?.typeId ?? "unknown";
    const itemAmount = itemStack?.amount ?? "?";

    for (const [playerId, deathInfo] of recentDeaths.entries()) {
      const ticksAgo = system.currentTick - deathInfo.time;

      const dx = entity.location.x - deathInfo.location.x;
      const dz = entity.location.z - deathInfo.location.z;
      const distanceSquared = dx * dx + dz * dz;

      if (ticksAgo <= DEATH_TICKS_WINDOW && distanceSquared <= DEATH_RADIUS * DEATH_RADIUS) {
        entity.kill(); // Remove dropped item
        break;
      }
    }
  });
});