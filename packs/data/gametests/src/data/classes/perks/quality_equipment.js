
import { ItemStack, world, system, TicksPerSecond, EquipmentSlot, ItemComponentTypes, EnchantmentTypes, EntityComponentTypes, ItemTypes } from "@minecraft/server";

import { toAllPlayers } from "../../../origins/player";
import { findItems } from "../../../utils/items";

const is_blacksmith_class_item = "r4isen1920_originspe:blacksmith_"
const is_quality_set_property = 'is_quality_set'

/**
 * 
 * Materials of the quality equipment
 */
const templateMaterials = [
  'diamond', 'golden', 'iron',
  'leather', 'netherite', 'stone', 'wooden'
];
/**
 * 
 * Specific types that is used for breaking
 * blocks
 */
const templateDiggableTypes = [
  'axe', 'hoe', 'shovel', 'pickaxe'
]
/**
 * 
 * Types of the armor
 */
const templateArmorTypes = [
  'boots', 'chestplate', 'helmet', 'leggings'
]
/**
 * 
 * All types of the 
 * quality equipment combined
 */
const templateTypes = [
  'sword',
  ...templateDiggableTypes,
  ...templateArmorTypes
];

const validBlacksmithTags = ['class_blacksmith', 'class_smith'];


/**
 * 
 * List of items
 */
const forgedItems = [

  ...templateMaterials.flatMap(material => 
    templateTypes.map(type => `minecraft:${material}_${type}`)
  )
]

function make_quality_equiptment(player) {

  const inventory = player?.getComponent(EntityComponentTypes.Inventory)?.container;

  if (!inventory) return false;

  const isPlayerBlacksmith = validBlacksmithTags.some(tag => player.hasTag(tag));

  for (let slot = 0; slot < inventory.size; slot++) {

    const itemStack = inventory.getItem(slot);

    if (!itemStack) continue;

    if (!isForged(itemStack) || hasBeenEvaluated(itemStack)) continue;

    if(isPlayerBlacksmith) {

      const blacksmithTypeId = itemStack.typeId.replace('minecraft:', 'r4isen1920_originspe:blacksmith_');

      const blacksmithItemStack = new cloneItemWithNewType(itemStack, blacksmithTypeId);

      addEnchantments(blacksmithItemStack, "minecraft:fortune");

      addLore(blacksmithItemStack);

      itemStack.setDynamicProperty(is_quality_set_property, true);
      inventory.setItem(slot, blacksmithItemStack);

    } else {
      itemStack.setDynamicProperty(is_quality_set_property, false);
      inventory.setItem(slot, itemStack);
    }
  }
}

function isForged(itemStack) {
  return forgedItems.includes(itemStack?.typeId);
}

function hasBeenEvaluated(itemStack) {
  return typeof itemStack?.getDynamicProperty(is_quality_set_property) === 'boolean'
}

function addLore(itemStack) {

  let currentLore = itemStack?.getLore() || [];

  const isNetheriteArmor = testNetheriteArmor(itemStack.typeId.replace('minecraft:', ''))

  if(isNetheriteArmor) {
    currentLore.push('§r§7', '§r§9+1 Knockback Resistance§r');
  }

  currentLore.push('§r§6Quality Equipment§r');

  itemStack.setLore(currentLore);
}

export function cloneItemWithNewType(original, newTypeId) {
  const newItem = new ItemStack(ItemTypes.get(newTypeId), original.amount);

  // Copy name and lore
  newItem.nameTag = original.nameTag;
  newItem.lore = original.lore;
  newItem.keepOnDeath = original.keepOnDeath;
  newItem.lockMode = original.lockMode;

  // Copy enchantments
  const oldEnch = original.getComponent(ItemComponentTypes.Enchantable);
  const newEnch = newItem.getComponent(ItemComponentTypes.Enchantable);
  if (oldEnch && newEnch) {
    for (const ench of oldEnch.getEnchantments()) {
      if (newEnch.canAddEnchantment(ench)) {
        newEnch.addEnchantment(ench);
      }
    }
  }

  // Copy durability
  const oldDur = original.getComponent(ItemComponentTypes.Durability);
  const newDur = newItem.getComponent(ItemComponentTypes.Durability);
  if (oldDur && newDur) {
    newDur.damage = oldDur.damage;
  }

  // Copy dynamic properties (if any)
  const keys = original.getDynamicPropertyIds?.() ?? [];
  for (const key of keys) {
    const value = original.getDynamicProperty(key);
    newItem.setDynamicProperty(key, value);
  }

  return newItem;
}


toAllPlayers(make_quality_equiptment, TicksPerSecond * 2, TicksPerSecond * 15)

function testNetheriteArmor(baseTypeId) {
  return templateArmorTypes.some(armor => baseTypeId.includes(armor) && baseTypeId.includes('netherite'))
}


/**
 * Runs the effects of quality equipment.
 */
system.runTimeout(() => {
  world.afterEvents.playerBreakBlock.subscribe(event => {
    const { block, brokenBlockPermutation, itemStackBeforeBreak, player } = event;

    if (!isValidQualityEquipment(itemStackBeforeBreak)) return;

    if (itemStackBeforeBreak?.typeId.includes(is_blacksmith_class_item)) {
      handleDurability(itemStackBeforeBreak, player);
    }

    spawnBreakParticles(block, brokenBlockPermutation);
  });
}, TicksPerSecond * 11);

/**
 * Adds one or more enchantments to an item stack if possible.
 *
 * Accepts input in the following formats:
 * - A single string (e.g., "minecraft:fortune")
 * - An array of strings (e.g., ["minecraft:fortune", "minecraft:efficiency"])
 * - An object with a type and optional level (e.g., { type: "minecraft:fortune", level: 3 })
 * - An array of such objects
 *
 * Any unspecified levels default to 1. Invalid or incompatible enchantments are skipped.
 *
 * @param {ItemStack} itemStack - The item to apply enchantments to.
 * @param {string | Object | Array} informalEnchantments - Enchantment(s) to apply.
 * @returns {Array} - An array of enchantments that were successfully added.
 */
function addEnchantments(itemStack, informalEnchantments = []) {
  const enchantable = itemStack?.getComponent(ItemComponentTypes.Enchantable);
  if (!enchantable) return [];

  return (Array.isArray(informalEnchantments) ? informalEnchantments : [informalEnchantments])
    .map(e => ({ type: EnchantmentTypes.get(typeof e === "string" ? e : e.type), level: e.level ?? 1 }))
    .filter(e => e.type && enchantable.canAddEnchantment(e) && enchantable.addEnchantment(e));
}

/**
 * Checks if the broken item is a valid piece of quality equipment.
 */
function isValidQualityEquipment(itemStack) {
  return (
    itemStack &&
    forgedItems.some(i => itemStack.typeId.includes(i.replace("minecraft:", ""))) &&
    templateDiggableTypes.some(i => itemStack.typeId.includes(i)) &&
    itemStack.getLore()?.includes("§r§6Quality Equipment§r")
  );
}

/**
 * Handles durability logic, including applying damage and removing the item if it breaks.
 */
function handleDurability(itemStack, player) {
  const durability = itemStack.getComponent("durability");
  if (!durability) return;

  const damageAmount = calculateDurabilityLoss(durability);

  updateInventory(itemStack, durability, player, damageAmount);
}

/**
 * Determines how much durability should be lost, based on Minecraft's damage chance logic.
 */
function calculateDurabilityLoss(durability) {

  const damageChance = durability.getDamageChanceRange();

  const max = damageChance.max || 1
  const min = damageChance.min || 1

  // Apply damage based on Minecraft's logic
  let damageAmount = 0;

  // If min === max, apply damage 100% of the time
  if (min === max) {
    damageAmount = min;
  } else {
    // If min !== max, we need to implement the probability logic
    const randomRoll = Math.floor(Math.random() * max) + 1; // Random number from 1 to max
    if (randomRoll === min) {
      damageAmount = min; // 50% chance of taking damage
    }
  }

  return damageAmount
}

/**
 * Finds the item in the inventory, updates durability, or removes it if it is broken.
 */
function updateInventory(itemStack, durability, player, damageAmount) {

  const inventory = player.getComponent("inventory").container;

  durability.damage += Math.min(damageAmount, durability.maxDurability - durability.damage);

  if (durability.damage >= durability.maxDurability) {
    // Item Broke
    player.playSound("random.break", { volume: 1.0, pitch: 1.0 });
    inventory.setItem(player.selectedSlotIndex, undefined);
  } else {
    inventory.setItem(player.selectedSlotIndex, itemStack);
  }
}

/**
 * Spawns particle effects based on the type of block broken.
 */
function spawnBreakParticles(block, brokenBlockPermutation) {
  const cropTypes = [
    "wheat", "beetroot", "carrots", "potatoes", "melon_stem", "pumpkin_stem",
    "sweet_berry_bush", "nether_wart"
  ];
  const isCropBlock = cropTypes.some(type => brokenBlockPermutation.matches(`minecraft:${type}`));

  block.dimension.spawnParticle(
    `r4isen1920_originspe:blacksmiths_${isCropBlock ? "harvest" : "dig"}`,
    block.center()
  );
}
