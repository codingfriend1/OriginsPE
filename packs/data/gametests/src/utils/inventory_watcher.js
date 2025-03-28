import { world, system } from "@minecraft/server";

class InventoryWatcher {
    constructor() {
        this.lastInventories = new Map(); // Store previous inventory state
        this.itemRemovedSubscribers = []; // Callbacks for item removal
        this.itemAddedSubscribers = []; // Callbacks for item addition
        this.itemPersistenceMap = new Map(); // Map<playerId, Array<{slot, typeId, tag}>>

        system.runInterval(() => this.checkInventoryChanges(), 10); // Check every 10 ticks
        // system.runInterval(() => this.savePersistenceToPlayer(), 200); // Persist every 10 seconds

        world.afterEvents.playerJoin.subscribe(({ player }) => {
            if(player) {
                console.log("Restoring Persistance for player")
                this.restorePersistenceFromPlayer(player);
            }
        });
    }

    onItemRemoved(callback) {
        this.itemRemovedSubscribers.push(callback);
    }

    onItemAdded(callback) {
        this.itemAddedSubscribers.push(callback);
    }

    checkInventoryChanges() {
        for (const player of world.getAllPlayers()) {
            const inventory = player.getComponent("inventory")?.container;
            if (!inventory) continue;

            const playerId = player.id;
            const lastInventory = this.lastInventories.get(playerId) || new Array(inventory.size).fill(null);
            const currentInventory = [];

            for (let i = 0; i < inventory.size; i++) {
                currentInventory[i] = inventory.getItem(i);
                const lastItem = lastInventory[i];
                const currentItem = currentInventory[i];

                if (lastItem && !currentItem) {
                    this.emitItemRemoved(player, lastItem);
                }

                if (!lastItem && currentItem) {
                    this.emitItemAdded(player, currentItem, i);
                }
            }

            this.lastInventories.set(playerId, currentInventory);
        }
    }

    emitItemRemoved(player, itemStack) {
        for (const callback of this.itemRemovedSubscribers) {
            callback(player, itemStack);
        }
    }

    emitItemAdded(player, itemStack, slot) {
        for (const callback of this.itemAddedSubscribers) {
            callback(player, itemStack, slot);
        }
    }

    persistStack(player, itemStack, slot, tag) {
        const playerId = player.id;
        console.warn(`[persistStack] Called for player ${player.name}, slot: ${slot}, type: ${itemStack.typeId}, tag: ${tag}`);

        if (!this.itemPersistenceMap.has(playerId)) {
            console.warn(`[persistStack] No existing entry for player ${player.name}, creating new list.`);
            this.itemPersistenceMap.set(playerId, []);
        }

        const list = this.itemPersistenceMap.get(playerId);
        const exists = list.find(entry =>
            entry.slot === slot &&
            entry.typeId === itemStack.typeId &&
            entry.tag === tag
        );

        if (exists) {
            console.warn(`[persistStack] Entry already exists for slot ${slot}, type: ${itemStack.typeId}, tag: ${tag}`);
        } else {
            console.warn(`[persistStack] Adding new persistence entry.`);
            list.push({ slot: slot, typeId: itemStack.typeId, tag });
            this.savePersistenceToPlayer(player);
            console.warn(`[persistStack] Persistence saved for player ${player.name}`);
        }
    }

    removePersistence(player, itemStack, slot, tag) {
        const playerId = player.id;
        console.warn(`[removePersistence] Called for player ${player.name}, slot: ${slot}, type: ${itemStack.typeId}, tag: ${tag}`);

        if (!this.itemPersistenceMap.has(playerId)) {
            console.warn(`[removePersistence] No persistence list found for player ${player.name}`);
            return;
        }

        const list = this.itemPersistenceMap.get(playerId);
        const index = list.findIndex(entry =>
            entry.slot === slot &&
            entry.typeId === itemStack.typeId &&
            entry.tag === tag
        );

        if (index !== -1) {
            console.warn(`[removePersistence] Removing entry at index ${index}`);
            list.splice(index, 1);
            this.savePersistenceToPlayer(player);
            console.warn(`[removePersistence] Persistence updated for player ${player.name}`);
        } else {
            console.warn(`[removePersistence] No matching entry found to remove.`);
        }
    }

    isPersisted(player, itemStack, slot, tag) {
        const playerId = player.id;
        console.warn(`[isPersisted] Checking for player ${player.name}, slot: ${slot}, type: ${itemStack.typeId}, tag: ${tag}`);

        if (!this.itemPersistenceMap.has(playerId)) {
            console.warn(`[isPersisted] No persistence list found for player ${player.name}`);
            return false;
        }

        const result = this.itemPersistenceMap.get(playerId).some(entry =>
            entry.slot === slot &&
            entry.typeId === itemStack.typeId &&
            entry.tag === tag
        );

        console.warn(`[isPersisted] Result for player ${player.name}: ${result}`);
        return result;
    }

    savePersistenceToPlayer(player) {
        const playerId = player.id;
        const data = this.itemPersistenceMap.get(playerId);
        if (!data) return;

        try {
            player.setDynamicProperty("inventory_persistence", JSON.stringify(data));
        } catch (e) {
            console.warn(`[InventoryWatcher] Failed to save persistence for ${player.name}:`, e);
        }
    }

    restorePersistenceFromPlayer(player) {
        const raw = player.getDynamicProperty("inventory_persistence");
        if (!raw) return;

        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                this.itemPersistenceMap.set(player.id, parsed);
            }
        } catch (e) {
            console.warn(`[InventoryWatcher] Failed to load persistence for ${player.name}:`, e);
        }
    }
}

// 🏁 Initialize the InventoryWatcher
export const inventoryWatcher = new InventoryWatcher();

