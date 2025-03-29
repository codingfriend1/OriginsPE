import { world, system, TicksPerSecond  } from "@minecraft/server";
import { ResourceBar } from "../../../origins/resource_bar";
import { usepower } from "../../../utils/PubSub";

const POWER_CONTROL_ITEM_NAME = 'r4isen1920_originspe:origins_power.empowering_aura';

usepower.subscribe(POWER_CONTROL_ITEM_NAME, empowering_aura);

const INVINCIBILITY_DURATION_SECONDS = 4;
const COOLDOWN = 9;
const INVINCIBILITY_DURATION_TICKS = INVINCIBILITY_DURATION_SECONDS * TicksPerSecond;
const COOLDOWN_TAG = "cooldown_1";
let timer = null;
const AURA_RADIUS = 64;
const EFFECT_TAG = "aura_active";

function resetCooldown(player, seconds) {
  timer = new ResourceBar(1, 0, 100, seconds).push(player);
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
  // Play sound
  player.playSound("note.chime", { volume: 1, pitch: 2 });

  // Invincibility
  player.addEffect("resistance", INVINCIBILITY_DURATION_TICKS, { amplifier: 255, showParticles: true });
  player.addEffect("glowing", INVINCIBILITY_DURATION_TICKS);

  for (const target of world.getPlayers()) {
    if (target === player) continue;
    if (player.location.distanceTo(target.location) > AURA_RADIUS) continue;

    target.playSound("note.chime", { volume: 1, pitch: 2 });
    target.addEffect("speed", INVINCIBILITY_DURATION_TICKS, { amplifier: 1, showParticles: true });
    target.addEffect("strength", INVINCIBILITY_DURATION_TICKS, { amplifier: 2, showParticles: true });
    target.addEffect("resistance", INVINCIBILITY_DURATION_TICKS, { amplifier: 1, showParticles: true });
    target.addEffect("regeneration", INVINCIBILITY_DURATION_TICKS, { amplifier: 1 });
    target.addEffect("glowing", INVINCIBILITY_DURATION_TICKS);
  }

  resetCooldown(player, INVINCIBILITY_DURATION_SECONDS + COOLDOWN);
}