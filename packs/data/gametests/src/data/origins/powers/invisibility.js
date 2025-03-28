import { world, system } from "@minecraft/server";
import { ResourceBar } from "../../../origins/resource_bar";
import { usepower } from "../../../utils/PubSub";

const POWER_CONTROL_ITEM_NAME = 'r4isen1920_originspe:origins_power.invisibility';

const INVISIBILITY_DURATION_SECONDS = 60;
const COOLDOWN = 12;
const COOLDOWN_TAG = "cooldown_1";
let timer = null;

function hasNegativeEffects(player) {
  const negativeEffects = [
    "poison", "wither", "weakness", "blindness", "slowness",
    "hunger", "levitation"
  ];

  return negativeEffects.some(effect => player.getEffect(effect)?.typeId);
}

function resetCooldown(player, seconds) {
  timer = new ResourceBar(1, 0, 100, seconds).push(player);
}

function turnInvisible({ player }) {

  if (!player.hasTag("power_invisibility")) return;

  if (player.hasTag(COOLDOWN_TAG)) {
    player.sendMessage({ translate: "origins.trait.invisibility.cooldown" });
    if(!timer) resetCooldown(player, COOLDOWN);

    return;
  }

  if (hasNegativeEffects(player)) {
    player.sendMessage({ translate: "origins.trait.invisibility.hindered" });
    return;
  }

  
  player.playSound('random.totem', { volume: 0.2, pitch: 1.5 })
  player.dimension.spawnParticle('minecraft:enchanting_table_particle', player.location)
  player.addEffect("invisibility", 20 * INVISIBILITY_DURATION_SECONDS, { showParticles: false });
  player.addEffect("speed", 20 * INVISIBILITY_DURATION_SECONDS, { amplifier: 1.4, showParticles: false });

  resetCooldown(player, INVISIBILITY_DURATION_SECONDS + COOLDOWN);
}

usepower.subscribe(POWER_CONTROL_ITEM_NAME, turnInvisible);
