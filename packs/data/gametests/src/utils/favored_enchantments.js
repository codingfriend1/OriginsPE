import { world, system, ItemStack, EntityComponentTypes, EnchantmentTypes } from "@minecraft/server";
import { inventoryWatcher } from "./custom_events";

export function favoredEnchantment({ perkName, enchantmentName, exclusiveTools, lore }) {

    const specificEnchantment = EnchantmentTypes.get(enchantmentName);
    const perkOriginalEnchantmentLevel = `${perkName}_original_enchantment_level`;
    const isPerkEnchantedProperty = `is_enchanted_with_${perkName}`;

    if(!specificEnchantment) {
        throw new Error(`Enchantment ${enchantmentName} not found`);
    }

    function addSpecificEnchantment(player, slotIndex, itemStack) {

        if (!verifyIsExclusiveTool(itemStack)) return false;

        const itemName = getItemName(itemStack);

        const enchantmentComponent = itemStack.getComponent("minecraft:enchantable");
        if (!enchantmentComponent) return false;

        const currentLevel = getEnchantmentLevel(itemStack, specificEnchantment);
        const alreadyPerked = itemStack.getDynamicProperty(isPerkEnchantedProperty);

        // Don't reapply if already perked or already at max level
        if (alreadyPerked || currentLevel >= specificEnchantment.maxLevel) return false;

        const newLevel = Math.min(currentLevel + 1, specificEnchantment.maxLevel);

        enchantmentComponent.removeEnchantment(specificEnchantment);
        enchantmentComponent.addEnchantment({ type: specificEnchantment, level: newLevel });

        itemStack.setDynamicProperty(perkOriginalEnchantmentLevel, currentLevel);
        itemStack.setDynamicProperty(isPerkEnchantedProperty, true);

        addLore(itemStack);

        player.getComponent('inventory').container.setItem(slotIndex, itemStack);
        player.sendMessage(`✨ Blessed your ${itemName} with ${specificEnchantment.id} Level ${newLevel}!`);
    }

    function removeSpecificEnchantment(player, slotIndex, itemStack) {

        if (!verifyIsExclusiveTool(itemStack)) return false;

        const itemName = getItemName(itemStack);

        const enchantmentComponent = itemStack.getComponent("minecraft:enchantable");
        if (!enchantmentComponent) return false;

        
        const wasPerked = itemStack.getDynamicProperty(isPerkEnchantedProperty);

        console.log(wasPerked ? `${itemName} was previously favored`: `${itemName} was not a favored item.`);

        if (!wasPerked) return;

        const currentLevel = getEnchantmentLevel(itemStack, specificEnchantment);
        const originalLevel = itemStack.getDynamicProperty(perkOriginalEnchantmentLevel) || 0;


        // If the current level = original + 1, the perk was the only increase
        if (currentLevel === originalLevel + 1) {
            enchantmentComponent.removeEnchantment(specificEnchantment);

            if (originalLevel > 0) {
                enchantmentComponent.addEnchantment({ type: specificEnchantment, level: originalLevel });
            }

            removeLore(itemStack);
            itemStack.setDynamicProperty(isPerkEnchantedProperty, false);

            player.getComponent('inventory').container.setItem(slotIndex, itemStack);
            player.sendMessage(`⚠️ Your ${itemName} is no longer favored with ${specificEnchantment.id}!`);

            return itemStack;
        }

        // If the level increased beyond perk's effect (e.g. manually), reset internal flags but preserve enchantment
        itemStack.setDynamicProperty(isPerkEnchantedProperty, false);
        itemStack.setDynamicProperty(perkOriginalEnchantmentLevel, currentLevel);
    }

    function getItemName(itemStack) {
        return itemStack?.typeId
            .replace('minecraft:', '')
            .replace('r4isen1920_originspe:', '');
    }
    
    function verifyIsExclusiveTool(itemStack) {
    
        if (!itemStack?.typeId) return false; // No item in hand
        
        const itemName = getItemName(itemStack);
    
        return exclusiveTools.includes(itemName);
    }

    function addLore(itemStack) {
        let currentLore = itemStack.getLore() || [];

        if(currentLore.includes(lore)) {
            return false
        } else {
            currentLore.push(lore);
            itemStack.setLore(currentLore);
        }
    }

    function removeLore(itemStack) {
        let currentLore = itemStack.getLore();

        const index = currentLore.indexOf(lore);

        if(index > -1) {
            currentLore.splice(index, 1);
            itemStack.setLore(currentLore);
        } else {
            return false
        }
    }
    
    // 🔔 If a player picks up a fortunate pickaxe from a miner class, and this player doesn't have the fortunate_miner perk, the item will be unenchanted.
    function favoredPerk(player, { itemStack, slot }) {
    
        if(player.hasTag(perkName)) {

            addSpecificEnchantment(player, slot, itemStack);
    
        } else {
    
            removeSpecificEnchantment(player, slot, itemStack);
        }
    }
    
    function getEnchantmentLevel(itemStack, enchantmentType) {
        if (!itemStack || !enchantmentType) return 0;
    
        const enchantmentComponent = itemStack.getComponent("minecraft:enchantable");
        if (!enchantmentComponent) return 0;
    
        const currentEnchantments = enchantmentComponent.getEnchantments();
    
        const match = currentEnchantments.find(e => e.type.id === enchantmentType.id);
        return match ? match.level : 0;
    }
    
    // When an item is added to the inventory:
    inventoryWatcher.onItemAdded(favoredPerk);
    
    // When the user closes their resignation GUI:
    system.afterEvents.scriptEventReceive.subscribe(event => {
    
      const { id, message, sourceEntity: player } = event;
    
      if (id !== 'r4isen1920_originspe:gui' || !player || message.length === 0 || !message.startsWith('on_close')) return
    
        const inventory = player.getComponent("inventory").container;
    
        for (let slot = 0; slot < inventory.size; slot++) {
            
            const itemStack = inventory.getItem(slot);

            favoredPerk(player, { itemStack, slot });
        }
      
    
    }, { namespaces: [ 'r4isen1920_originspe' ] })
}