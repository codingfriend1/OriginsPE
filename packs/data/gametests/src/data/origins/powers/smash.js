import { system, world, EntityDamageCause } from "@minecraft/server";
import { toAllPlayers } from "../../../origins/player";
import { Vector3 } from "../../../utils/Vec3";
import { usepower } from "../../../utils/PubSub";
import { removeTags } from "../../../utils/tags";

const POWER_CONTROL_ITEM_NAME = 'r4isen1920_originspe:origins_power.smash';
const AOE_RADIUS = 8;
const SMASH_DAMAGE = 12;
const COOLDOWN_TAG = "smash_cooldown";
const LEAP_POWER = 25

usepower.subscribe(POWER_CONTROL_ITEM_NAME, function({ player }) {
  if (player.hasTag("power_smash") && !player.hasTag("airborne")) {
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

    // ⚡ Explosive visuals
    player.runCommandAsync(`particle minecraft:explosion_emitter ~ ~1 ~`);
    player.runCommandAsync(`particle minecraft:lava_particle ~ ~0.5 ~ 0.5 0.2 0.5 0.01 20 force`);
    player.runCommandAsync(`particle minecraft:block_dust stone ~ ~ ~ 1 0.5 1 0.2 50 force`);
    player.runCommandAsync(`particle r4isen1920_originspe:air_burst ~ ~0.5 ~`);

    // 🔊 Sound stack
    player.runCommandAsync(`playsound random.explode @a[r=16] ~ ~ ~ 1 1`);
    player.runCommandAsync(`playsound mob.irongolem.hit @a[r=16] ~ ~ ~ 0.6 0.8`);
    
  }
}

toAllPlayers(checkHasLanded, 2);
