
import { world, system, TicksPerSecond, EntityDamageCause } from "@minecraft/server";

import { Vector3 } from "../../../utils/Vec3";

const damage_increase = 0.3;
const effect_duration_ticks = TicksPerSecond * 4;

system.runTimeout(() => {

  world.afterEvents.entityHurt.subscribe(
    event => {

      const { damageSource, hurtEntity, damage } = event;
      if (!damageSource.damagingEntity?.hasTag('power_debilitating_strikes')) return;

      hurtEntity.addEffect("slowness", effect_duration_ticks, { amplifier: 2, showParticles: true });
      world.playSound('ender_eye.dead', hurtEntity.location);
      damageSource.damagingEntity.playSound('ender_eye.dead');
    }
  )

}, TicksPerSecond * 6)
