import { world, system, TicksPerSecond  } from "@minecraft/server";
import { ResourceBar } from "../../../origins/resource_bar";
import { usepower } from "../../../utils/PubSub";

const POWER_CONTROL_ITEM_NAME = 'r4isen1920_originspe:origins_power.empowering_aura';

usepower.subscribe(POWER_CONTROL_ITEM_NAME, empowering_aura);

const DURATION = 4 * TicksPerSecond; // 4 seconds (in ticks)
const COOLDOWN = 9; // 9 seconds (in ticks)
const AURA_RADIUS = 64;
const EFFECT_TAG = "aura_active";
const COOLDOWN_TAG = "aura_cooldown";

function empowering_aura({ player, itemStack }) {

  if (!player.hasTag("power_empowering_aura")) return;

  if (player.hasTag(COOLDOWN_TAG)) {
    player.sendMessage({ translate: "origins.trait.empowering_aura.cooldown" });
    return;
  }

  // Begin aura effect
  player.addTag(EFFECT_TAG);
  player.addTag(COOLDOWN_TAG);
  new ResourceBar(1, 0, 100, COOLDOWN).push(player);

  player.addEffect("resistance", DURATION, { amplifier: 255, showParticles: true }); // Invincible
  player.addEffect("glowing", DURATION);
  player.playSound("note.chime", { volume: 1, pitch: 2 });

  for (const target of world.getPlayers()) {
    if (target === player) continue;
    if (player.location.distanceTo(target.location) > AURA_RADIUS) continue;

    target.playSound("note.chime", { volume: 1, pitch: 2 });
    target.addEffect("speed", DURATION, { amplifier: 1, showParticles: true });
    target.addEffect("strength", DURATION, { amplifier: 2, showParticles: true });
    target.addEffect("resistance", DURATION, { amplifier: 1, showParticles: true });
    target.addEffect("regeneration", DURATION, { amplifier: 1 });
    target.addEffect("glowing", DURATION);
  }

  system.runTimeout(() => {
    player.removeTag(EFFECT_TAG);
  }, DURATION);

  system.runTimeout(() => {
    player.removeTag(COOLDOWN_TAG);
  }, DURATION);
}