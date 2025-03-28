import { world, system } from "@minecraft/server";
import { ResourceBar } from "../../../origins/resource_bar";
import { usepower } from "../../../utils/PubSub";

const POWER_CONTROL_ITEM_NAME = 'r4isen1920_originspe:origins_power.invisibility';

const DURATION = 20 * 20; // 20 seconds in ticks
const COOLDOWN = 12; // 12 seconds in ticks
const COOLDOWN_TAG = "invisibility_cooldown";

function hasNegativeEffects(player) {
  const negativeEffects = [
    "poison",
    "wither",
    "weakness",
    "blindness",
    "slowness",
    "hunger",
    "levitation",
    "unluck",
    "darkness",
  ];

  for (const effect of negativeEffects) {
    if (player.hasEffect(effect)) {
      return true;
    }
  }
  return false;
}

function turnInvisible({ player }) {
  if (!player.hasTag("power_invisibility")) return;

  if (player.hasTag(COOLDOWN_TAG)) {
    player.sendMessage({ translate: "origins.trait.invisibility.cooldown" });
    return;
  }

  if (hasNegativeEffects(player)) {
    player.sendMessage({ translate: "origins.trait.invisibility.hindered" });
    return;
  }

  player.addTag(COOLDOWN_TAG);
  new ResourceBar(1, 0, 100, COOLDOWN).push(player);

  player.runCommandAsync(`playsound random.totem @s ~ ~ ~ 0.2 1.5`);
  player.runCommandAsync(`particle minecraft:enchanting_table_particle ~ ~1.5 ~ 0 0 0 0.01 10 force @s`);

  // Apply invisibility and speed boost
  player.addEffect("invisibility", DURATION, { showParticles: false });
  player.addEffect("speed", DURATION, { amplifier: 0 });

  system.runTimeout(() => {
    player.removeTag(COOLDOWN_TAG);
  }, COOLDOWN);
}

usepower.subscribe(POWER_CONTROL_ITEM_NAME, turnInvisible);
