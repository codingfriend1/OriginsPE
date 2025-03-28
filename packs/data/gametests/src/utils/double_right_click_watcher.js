import { world, system } from "@minecraft/server";


class RightClickDoubleClickWatcher {
  constructor() {
    this.clicks = new Map(); // Map<player.id, { firstClick: number }>
    this.doubleClickWindow = 400;
    this.doubleClickSubscribers = new Set();

    world.beforeEvents.itemUse.subscribe((event) => {
      const player = event.source;
      const item = event.item;
      const itemId = item?.typeId ?? "undefined";

      // Only register right-click into air (no block clicked)
      if (!item || itemId === "minecraft:air" || itemId === "undefined") {
        if (event.block) return; // Ignore clicks on blocks

        const now = Date.now();
        const lastClick = this.clicks.get(player.id);

        if (!lastClick) {
          // First click — store timestamp
          this.clicks.set(player.id, now);

          // Auto-expire after the double-click window
          system.runTimeout(() => {
            if (this.clicks.get(player.id) === now) {
              this.clicks.delete(player.id);
            }
          }, this.doubleClickWindow / 50); // Convert ms to ticks
        } else {
          const diff = now - lastClick;
          if (diff <= this.doubleClickWindow) {
            this.emitDoubleClick(player);
            this.clicks.delete(player.id); // Clear after match
          } else {
            // Too late — treat as new first click
            this.clicks.set(player.id, now);
          }
        }
      }
    });
  }

  onDoubleClick(callback) {
    this.doubleClickSubscribers.add(callback);

    // Return unsubscribe function
    return () => {
      this.doubleClickSubscribers.delete(callback);
    };
  }

  emitDoubleClick(player) {
    for (const callback of this.doubleClickSubscribers) {
      system.run(() => callback(player));
    }
  }
}


export const rightClickDoubleClickWatcher = new RightClickDoubleClickWatcher();