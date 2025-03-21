import { world, system, ItemStack, EntityComponentTypes, EnchantmentTypes } from "@minecraft/server";
import { toAllPlayers } from "../../../origins/player";
import { findItemsWithLore } from "../../../utils/items";
import { inventoryWatcher } from "../../../utils/custom_events";

const fortuneLore = ["§6Blessed by the Fortunate Miner Perk§r"];
const isMinersFortunePickaxe = 'isMinersFortunePickaxe';
const fortune_enchantment_level = 1;

const pickaxeTypes = [
    "wooden_pickaxe",
    "stone_pickaxe",
    "iron_pickaxe",
    "golden_pickaxe",
    "diamond_pickaxe",
    "netherite_pickaxe"
];

// function fortunate_miner(player, oldSlot, newSlot) {

//     if (!player.hasTag("perk_fortunate_miner")) return; // Only applies to tagged players

//     const inventory = player.getComponent("inventory").container;
//     const oldItemStack = inventory.getItem(oldSlot);
//     removeFortuneEnchantment(oldItemStack);

//     addFortuneEnchantment(player, newSlot, "minecraft:fortune", 1);
// }


// const playerLastSlot = new Map(); // Track each player's last selected slot

// system.runInterval(() => {
//     for (const player of world.getAllPlayers()) {
//         const currentSlot = player.selectedSlotIndex;
//         const lastSlot = playerLastSlot.get(player.id); // Get last recorded slot

//         if (lastSlot !== undefined && currentSlot !== lastSlot) {
//             // ✅ Slot Changed! Call the function
//             onSlotChange(player, lastSlot, currentSlot);
//         }

//         // ✅ Update last slot tracking
//         playerLastSlot.set(player.id, currentSlot);
//     }
// }, 20); // Runs every tick (20 times per second)

// // ✅ Function to handle slot changes
// function onSlotChange(player, oldSlot, newSlot) {
//     // console.log(`🎯 ${player.name} changed slot from ${oldSlot} to ${newSlot}`);

//     fortunate_miner(player, oldSlot, newSlot);
// }

const fortuneEnchantment = EnchantmentTypes.get("minecraft:fortune");


function addFortuneEnchantment(player, slotIndex, itemStack, level) {

    if (!itemStack?.typeId) return; // No item in hand
    
    const typeId = itemStack.typeId
        .replace('minecraft:', '')
        .replace('r4isen1920_originspe:blacksmith_', '');

    if (!pickaxeTypes.includes(typeId)) return; // Only apply to pickaxes

    // Get the enchantable component
    const enchantments = itemStack.getComponent("minecraft:enchantable");

    if(enchantments && fortuneEnchantment && !enchantments.hasEnchantment(fortuneEnchantment)) {

        enchantments.addEnchantment({ type: fortuneEnchantment, level });
        
        itemStack.setDynamicProperty(isMinersFortunePickaxe, true);

        player.getComponent('inventory').container.setItem(slotIndex, itemStack);

        // player.sendMessage(`✨ Enchanted your item with ${enchantmentType} ${level}!`);
    }
}


// 🔄 Function to remove Fortune enchantment and lore
function removeFortuneEnchantment(player, slotIndex, itemStack) {

    if (!itemStack?.typeId) return;

    const is_fortune_enchanted_by_miner = itemStack.getDynamicProperty(isMinersFortunePickaxe)

    const enchantments = itemStack.getComponent("minecraft:enchantable");

    if (enchantments && fortuneEnchantment && is_fortune_enchanted_by_miner && enchantments.hasEnchantment(fortuneEnchantment)) {
        enchantments.removeEnchantment(fortuneEnchantment);
        itemStack.setDynamicProperty(isMinersFortunePickaxe, false);
        player.getComponent('inventory').container.setItem(slotIndex, itemStack);

        // console.log(`⛏️ Fortune removed from ${player.name}'s pickaxe!`);
        // player.sendMessage("⚠️ Your pickaxe lost its Fortune enchantment!");

        return itemStack;
    } else {
        return false
    }

}

// 🔔 If a player picks up a fortunate pickaxe from a miner class, and this player doesn't have the fortunate_miner perk, the item will be unenchanted.
inventoryWatcher.onItemAdded((player, { itemStack, slot }) => {

    if(!player.hasTag("perk_fortunate_miner")) {

        removeFortuneEnchantment(player, slot, itemStack);

    } else {

        addFortuneEnchantment(player, slot, itemStack, fortune_enchantment_level);
    }
});