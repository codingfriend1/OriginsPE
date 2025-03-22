import { world, system } from "@minecraft/server";


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