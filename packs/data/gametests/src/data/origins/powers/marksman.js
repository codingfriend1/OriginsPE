
import { world, system, TicksPerSecond, EntityDamageCause } from "@minecraft/server";

import { Vector3 } from "../../../utils/Vec3";

const damage_increase = 0.3;

system.runTimeout(() => {

  world.afterEvents.entityHurt.subscribe(
    event => {

      const { damageSource, hurtEntity, damage } = event;
      if (
        !damageSource.damagingEntity?.hasTag('power_marksman') ||
        damageSource.cause !== EntityDamageCause.projectile
      ) return;

      let additionalDamage = damage * damage_increase;

      hurtEntity.applyDamage(Math.round(additionalDamage), { cause: EntityDamageCause.override, damagingEntity: damageSource.damagingEntity });

      damageSource.damagingEntity.runCommand('particle r4isen1920_originspe:elven_bow_charge ^^1^1.25');
      hurtEntity.dimension.spawnParticle('r4isen1920_originspe:elven_bow_impact', Vector3.add(hurtEntity.location, new Vector3(0, 1, 0)));
      world.playSound('ender_eye.dead', hurtEntity.location);
      damageSource.damagingEntity.playSound('ender_eye.dead');

    }
  )

}, TicksPerSecond * 6)
