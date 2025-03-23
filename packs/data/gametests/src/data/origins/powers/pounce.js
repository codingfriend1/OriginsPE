import { system, EntityDamageCause, world } from "@minecraft/server";
import { ResourceBar } from "../../../origins/resource_bar";
import { Vector3 } from "../../../utils/Vec3";
import { removeTags } from "../../../utils/tags";
import { usepower, releasePower } from "../../../utils/PubSub";

const MAX_DISTANCE = 20;
const MAX_CHARGE_TICKS = 40; // 2 seconds (20 ticks per second)
const POWER_CONTROL_ITEM_NAME = 'r4isen1920_originspe:origins_power.pounce';

usepower.subscribe(POWER_CONTROL_ITEM_NAME, chargePounce);
releasePower.subscribe(POWER_CONTROL_ITEM_NAME, pounce);

function chargePounce({ player }) {

  if (!player.hasTag('power_pounce')) return;

  // Save the tick when the player starts charging
  if (!player.hasTag('_pounce_charge')) {
    player.setDynamicProperty('r4isen1920_originspe:pounce_start_tick', system.currentTick);
    new ResourceBar(6, 0, 100, 4, true).push(player);
    player.addTag('_pounce_charge');
  }
}

function pounce({ player }) {

  if (!player.hasTag('power_pounce') || !player.hasTag('_pounce_charge')) return;

  const startTick = player.getDynamicProperty('r4isen1920_originspe:pounce_start_tick');
  if (typeof startTick !== 'number') return;

  const heldTicks = Math.min(system.currentTick - startTick, MAX_CHARGE_TICKS);
  const pouncePercent = Math.floor((heldTicks / MAX_CHARGE_TICKS) * 100);
  const pounceStrength = Math.min((heldTicks / MAX_CHARGE_TICKS) * MAX_DISTANCE, MAX_DISTANCE);

  // Visual bar and knockback
  new ResourceBar(6, pouncePercent, 0, 1).pop(player);

  const dir = player.getViewDirection();
  const horizontal = pounceStrength / 4;
  const vertical = (pounceStrength / 4) * Math.min(Math.max(dir.y + 0.25, 0), 0.75) * 0.5;

  player.applyKnockback(dir.x, dir.z, horizontal, vertical);

  world.playSound('firework.launch', player.location);
  player.addTag('_pounce');

  // Cleanup
  player.setDynamicProperty('r4isen1920_originspe:pounce_start_tick', undefined);
  player.removeTag('_pounce_charge');

  // Pounce hit mechanic
  if (player.hasTag('_pounce') && !player.isOnGround) {
    player.addTag('_pounce_flew');
  }

  if (player.hasTag('_pounce_flew') && player.isOnGround) {
    const nearbyEntities = player.dimension.getEntities({
      location: player.location,
      maxDistance: 4,
      excludeFamilies: ['inanimate'],
      excludeTags: ['power_pounce']
    });

    nearbyEntities.forEach(entity => {
      entity.applyDamage(6, { cause: EntityDamageCause.entityAttack, damagingEntity: player });
    });

    player.dimension.spawnParticle('r4isen1920_originspe:air_burst', Vector3.add(player.location, new Vector3(0, 0.5, 0)));
    removeTags(player, '_pounce');
  }
}

