import { world, system } from "@minecraft/server";

class InventoryWatcher {
    constructor() {
        this.lastInventories = new Map(); // Store previous inventory state
        this.itemRemovedSubscribers = []; // Callbacks for item removal
        this.itemAddedSubscribers = []; // Callbacks for item addition
        system.runInterval(() => this.checkInventoryChanges(), 10); // Check every 10 ticks
    }

    // ✅ Subscribe to item removed events
    onItemRemoved(callback) {
        this.itemRemovedSubscribers.push(callback);
    }

    // ✅ Subscribe to item added events
    onItemAdded(callback) {
        this.itemAddedSubscribers.push(callback);
    }

    // 🔄 Function to check inventory changes
    checkInventoryChanges() {
        for (const player of world.getAllPlayers()) {
            const inventory = player.getComponent("inventory").container;
            const playerId = player.id;

            // Get previous inventory state
            const lastInventory = this.lastInventories.get(playerId) || new Array(inventory.size).fill(null);
            const currentInventory = [];

            for (let i = 0; i < inventory.size; i++) {
                currentInventory[i] = inventory.getItem(i);
                const lastItem = lastInventory[i];
                const currentItem = currentInventory[i];

                // 📢 If an item was removed, trigger the event
                if (lastItem && !currentItem) {
                    this.emitItemRemoved(player, lastItem);
                }

                // ✅ If an item was added, trigger the event
                if (!lastItem && currentItem) {
                    this.emitItemAdded(player, currentItem, i);
                }
            }

            // Update stored inventory state
            this.lastInventories.set(playerId, currentInventory);
        }
    }

    // 🚀 Emit the custom event when an item is removed
    emitItemRemoved(player, itemStack) {
        for (const callback of this.itemRemovedSubscribers) {
            callback(player, itemStack);
        }
    }

    // 🚀 Emit the custom event when an item is added
    emitItemAdded(player, itemStack, slot) {
        for (const callback of this.itemAddedSubscribers) {
            callback(player, { itemStack, slot });
        }
    }
}

// 🏁 Initialize the InventoryWatcher
export const inventoryWatcher = new InventoryWatcher();
