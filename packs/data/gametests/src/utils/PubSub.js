export class PubSub {
  constructor() {
    this.events = new Map(); // Map<string, Set<Function>>
  }

  /**
   * Subscribe to a specific event name.
   * @param {string} eventName 
   * @param {(payload: any) => void} callback 
   * @returns {() => void} Unsubscribe function
   */
  subscribe(eventName, callback) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set());
    }

    const subs = this.events.get(eventName);
    subs.add(callback);

    // Return unsubscribe function
    return () => {
      subs.delete(callback);
      if (subs.size === 0) this.events.delete(eventName);
    };
  }

  /**
   * Emit an event with a payload.
   * @param {string} eventName 
   * @param {any} payload 
   */
  publish(eventName, payload) {
    const subs = this.events.get(eventName);
    if (!subs) return;

    for (const callback of subs) {
      try {
        callback(payload);
      } catch (e) {
        console.warn(`[PubSub] Error in '${eventName}' subscriber: ${e}`);
      }
    }
  }

  /**
   * Remove all subscribers for an event.
   * @param {string} eventName 
   */
  unsubscribeAll(eventName) {
    this.events.delete(eventName);
  }

  /**
   * Clear all events.
   */
  clear() {
    this.events.clear();
  }
}

export const usepower = new PubSub();
export const releasePower = new PubSub();
export const setup = new PubSub();
export const playerEvents = new PubSub();