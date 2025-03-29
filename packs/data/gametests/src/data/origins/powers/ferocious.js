import { system, world, TicksPerSecond } from "@minecraft/server";

system.runInterval(() => {
  for (const player of world.getPlayers()) {
    if (player.hasTag("power_ferocious")) {
      player.addEffect("strength", TicksPerSecond * 3, {
        amplifier: 1,
        showParticles: false    // Hide particles
      });
    } else {
      player.removeEffect("strength");
    }
  }
}, TicksPerSecond * 2); // Runs every 2 seconds