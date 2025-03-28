import { system, world, EntityDamageCause } from "@minecraft/server";
import { toAllPlayers } from "../../../origins/player";
import { Vector3 } from "../../../utils/Vec3";
import { usepower } from "../../../utils/PubSub";
import { removeTags } from "../../../utils/tags";

const POWER_CONTROL_ITEM_NAME = 'r4isen1920_originspe:origins_power.smash';
const AOE_RADIUS = 6;
const SMASH_DAMAGE = 10;
const COOLDOWN_TAG = "smash_cooldown";
const LEAP_POWER = 25

usepower.subscribe(POWER_CONTROL_ITEM_NAME, function({ player }) {
  if (player.hasTag("power_smash")) {
    player.addTag("airborne");

    const dir = player.getViewDirection();
    const horizontal = LEAP_POWER / 4;
    const vertical = (LEAP_POWER / 4) * Math.min(Math.max(dir.y + 0.25, 0), 0.75) * 0.5;

    player.applyKnockback(dir.x, dir.z, horizontal, vertical);
    world.playSound("firework.launch", player.location);
  }
});

function checkHasLanded(player) {
  if(!player.hasTag("power_smash")) return;
  if (player.hasTag("airborne") && player.isOnGround) {
    player.removeTag("airborne");

    const nearbyEntities = player.dimension.getEntities({
      location: player.location,
      maxDistance: AOE_RADIUS,
      excludeFamilies: ['inanimate'],
      excludeTags: ['power_smash']
    });

    nearbyEntities.forEach(entity => {
      entity.applyDamage(SMASH_DAMAGE, { cause: EntityDamageCause.entityAttack, damagingEntity: player });
    });

    player.dimension.spawnParticle('r4isen1920_originspe:air_burst', Vector3.add(player.location, new Vector3(0, 0.5, 0)));

    player.playSound('random.explode', { volume: 0.5, pitch: 1.75 })
    player.playSound('mob.irongolem.hit', { volume: 0.5, pitch: 1.75 })
    
  }
}

toAllPlayers(checkHasLanded, 2);
