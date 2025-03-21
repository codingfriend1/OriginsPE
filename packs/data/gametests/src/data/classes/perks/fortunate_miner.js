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

const fortuneEnchantment = EnchantmentTypes.get("minecraft:fortune");


function addFortuneEnchantment(player, slotIndex, itemStack, level) {

    if(!verifyIsPickaxe(itemStack)) return false

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

    if(!verifyIsPickaxe(itemStack)) return false

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

function verifyIsPickaxe(itemStack) {

    if (!itemStack?.typeId) return false; // No item in hand
    
    const typeId = itemStack.typeId
        .replace('minecraft:', '')
        .replace('r4isen1920_originspe:blacksmith_', '');

    return pickaxeTypes.includes(typeId);
}

// 🔔 If a player picks up a fortunate pickaxe from a miner class, and this player doesn't have the fortunate_miner perk, the item will be unenchanted.
function perk_fortunate_miner(player, { itemStack, slot }) {

    if(!player.hasTag("perk_fortunate_miner")) {

        removeFortuneEnchantment(player, slot, itemStack);

    } else {

        addFortuneEnchantment(player, slot, itemStack, fortune_enchantment_level);
    }
}

// When an item is added to the inventory:
inventoryWatcher.onItemAdded(perk_fortunate_miner);

// When the user closes their resignation GUI:
system.afterEvents.scriptEventReceive.subscribe(event => {

  const { id, message, sourceEntity: player } = event;

  if (id !== 'r4isen1920_originspe:gui' || !player || message.length === 0 || !message.startsWith('on_close')) return

    const inventory = player.getComponent("inventory").container;

    for (let slot = 0; slot < inventory.size; slot++) {
        const itemStack = inventory.getItem(slot);
        perk_fortunate_miner(player, { itemStack, slot });
    }
  

}, { namespaces: [ 'r4isen1920_originspe' ] })