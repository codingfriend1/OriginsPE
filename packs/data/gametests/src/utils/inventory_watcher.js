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



class RightClickDoubleClickWatcher {
    constructor() {
        this.clicks = new Map(); // Map<player.id, { count, firstClick }>
        this.doubleClickWindow = 400;
        this.doubleClickSubscribers = new Set();

        world.beforeEvents.itemUse.subscribe((event) => {
            const player = event.source;
            const item = event.item;
            const itemId = item?.typeId ?? "undefined";

            // Only register right-click into air (no block clicked)
            if (!item || itemId === "minecraft:air" || itemId === "undefined") {
                // Ignore if the right-click was on a block
                if (event.block) {
                    // Uncomment if you want to log what was clicked:
                    // console.warn(`[RightClick] Ignored on block: ${event.block.typeId}`);
                    return;
                }

                const now = Date.now();
                const clickData = this.clicks.get(player.id);

                if (!clickData) {
                    this.clicks.set(player.id, { count: 1, firstClick: now });
                } else {
                    clickData.count += 1;
                }
            }
        });

        system.runInterval(() => this.checkForDoubleClicks(), 1);
    }

    onDoubleClick(callback) {
        this.doubleClickSubscribers.add(callback);
    }

    emitDoubleClick(playerId) {
        const player = world.getAllPlayers().find(p => p.id === playerId);
        if (!player) {
            return;
        }

        for (const callback of this.doubleClickSubscribers) {
            system.run(() => callback(player));
        }
    }

    checkForDoubleClicks() {
        const now = Date.now();

        for (const [playerId, data] of this.clicks.entries()) {
            if (data.count >= 2 && now - data.firstClick <= this.doubleClickWindow) {
                this.emitDoubleClick(playerId);
                this.clicks.delete(playerId);
            } else if (now - data.firstClick > this.doubleClickWindow) {
                this.clicks.delete(playerId);
            }
        }
    }
}

export const rightClickDoubleClickWatcher = new RightClickDoubleClickWatcher();

