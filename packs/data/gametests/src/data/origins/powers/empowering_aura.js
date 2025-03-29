import { world, system, TicksPerSecond  } from "@minecraft/server";
import { ResourceBar } from "../../../origins/resource_bar";
import { Vector3 } from "../../../utils/Vec3";
import { usepower } from "../../../utils/PubSub";

const POWER_CONTROL_ITEM_NAME = 'r4isen1920_originspe:origins_power.empowering_aura';

usepower.subscribe(POWER_CONTROL_ITEM_NAME, empowering_aura);

const INVINCIBILITY_DURATION_SECONDS = 4;
const COOLDOWN = 9;
const INVINCIBILITY_DURATION_TICKS = INVINCIBILITY_DURATION_SECONDS * TicksPerSecond;
const COOLDOWN_TAG = "cooldown_1";
let timer = null;
const AURA_RADIUS = 16;
const EFFECT_TAG = "aura_active";

function resetCooldown(player, seconds) {
  timer = new ResourceBar(1, 0, 100, seconds).push(player);
}

function boost(player) {
  player.dimension.spawnParticle("minecraft:crit_particle", player.location);
  player.playSound("note.chime", { volume: 1, pitch: 2 });
  player.addEffect("speed", INVINCIBILITY_DURATION_TICKS, { amplifier: 1.4, showParticles: true });
  player.addEffect("strength", INVINCIBILITY_DURATION_TICKS, { amplifier: 1.4, showParticles: true });
  player.addEffect("resistance", INVINCIBILITY_DURATION_TICKS, { amplifier: 1.4, showParticles: true });
  player.addEffect("regeneration", INVINCIBILITY_DURATION_TICKS, { amplifier: 1.4 });
}

function empowering_aura({ player, itemStack }) {

  if (!player.hasTag("power_empowering_aura")) return;

  if (player.hasTag(COOLDOWN_TAG)) {
    player.sendMessage({ translate: "origins.trait.empowering_aura.cooldown" });
    if(!timer) resetCooldown(player, COOLDOWN);

    return;
  }

  // Begin aura effect
  player.addTag(EFFECT_TAG);

  boost(player);
  player.addEffect("resistance", INVINCIBILITY_DURATION_TICKS, { amplifier: 10, showParticles: true });  
  player.dimension.spawnParticle('r4isen1920_originspe:air_burst', Vector3.add(player.location, new Vector3(0, 0.5, 0)));

  const nearbyPlayers = player.dimension.getPlayers({
    location: player.location,
    maxDistance: AURA_RADIUS
  }).forEach(target => boost(target));

  resetCooldown(player, INVINCIBILITY_DURATION_SECONDS + COOLDOWN);
}