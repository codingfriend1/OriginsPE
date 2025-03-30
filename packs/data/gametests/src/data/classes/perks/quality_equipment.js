
import { ItemStack, world, system, TicksPerSecond, EquipmentSlot, ItemComponentTypes, EnchantmentTypes } from "@minecraft/server";

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

const validClasses = ['class_blacksmith', 'class_smith'];


/**
 * 
 * List of items
 */
const items = [

  ...templateMaterials.flatMap(material => 
    templateTypes.map(type => `minecraft:${material}_${type}`)
  )
]

/**
 * 
 * @param { import('@minecraft/server').Player } player 
 */
function quality_equipment(player) {
  const unsetItemsInInventory = findItems(player).filter(item =>
    items.includes(item?.item?.typeId) &&
    !item?.item?.getDynamicProperty(is_quality_set_property)
  );

  if (unsetItemsInInventory.length === 0) return;

  // ✅ List of valid classes that produce quality equipment
  const hasValidClass = validClasses.some(tag => player.hasTag(tag));

  for (const item of unsetItemsInInventory) {
    const baseTypeId = item.item.typeId.replace('minecraft:', '');
    const newItemTypeId = hasValidClass
      ? `r4isen1920_originspe:blacksmith_${baseTypeId}`
      : `minecraft:${baseTypeId}`;

    const newItem = new ItemStack(newItemTypeId, item.item.amount);

    // 🎯 Add Fortune I to pickaxes
    addEnchantments(newItem, "minecraft:fortune")

    if (hasValidClass && baseTypeId.includes("pickaxe")) {
      const enchComp = newItem.getComponent(ItemComponentTypes.Enchantable);
      if (enchComp) {
        enchComp.enchantments.addEnchantment({
          type: EnchantmentTypes.get("minecraft:fortune"),
          level: 1,
        });
      }
    }

    let setLore = [];
    if (templateArmorTypes.some(type => baseTypeId.includes(type) && baseTypeId.includes('netherite'))) {
      setLore.push('§r§7', '§r§9+1 Knockback Resistance§r');
    }
    if (hasValidClass) {
      setLore.push('§r§6Quality Equipment§r');
    }
    newItem.setLore(setLore);

    // Prevent reprocessing the item in the future
    newItem.setDynamicProperty(is_quality_set_property, true);

    player.getComponent('inventory').container.setItem(item.slot, newItem);
  }

  if (hasValidClass) {
    player.playSound('smithing_table.use', { volume: 0.75, pitch: 1.25 });
  }
}


toAllPlayers(quality_equipment, 15, TicksPerSecond * 15)


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
    items.some(i => itemStack.typeId.includes(i.replace("minecraft:", ""))) &&
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
