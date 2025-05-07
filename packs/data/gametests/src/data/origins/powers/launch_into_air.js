
import { LocationOutOfWorldBoundariesError, TicksPerSecond, world } from "@minecraft/server";
import { ResourceBar } from "../../../origins/resource_bar";
import { Vector3 } from "../../../utils/Vec3";
import { usepower } from "../../../utils/PubSub";


const POWER_CONTROL_ITEM_NAME = 'r4isen1920_originspe:origins_power.launch_into_air';

usepower.subscribe(POWER_CONTROL_ITEM_NAME, launch_into_air);

/**
 * 
 * @param { import('@minecraft/server').Player } player 
 */
function launch_into_air({ player }) {
  if (
    !player.hasTag('power_launch_into_air') ||
    !player.hasTag('_control_use_launch_into_air')
  ) return


  if (!player.hasTag('cooldown_2')) {

    if (!player.hasTag('_heavy')) player.applyKnockback(0, 0, 0, 3);
    else player.applyKnockback(0, 0, 0, 1.5);
    player.addEffect('slow_falling', TicksPerSecond * 3, { amplifier: 255, showParticles: false })

    world.playSound('firework.launch', player.location, { volume: 1, pitch: 1.25 })

    try {
      player.dimension.spawnParticle('r4isen1920_originspe:air_burst', Vector3.add(player.location, new Vector3(0, 1, 0)))
    } catch (e) {
      if (!(e instanceof LocationOutOfWorldBoundariesError)) throw e
    }

    new ResourceBar(2, 0, 100, 10)
        .push(player)

  } else {

    player.playSound('note.bass', { volume: 1, pitch: 1.5 })

  }

  player.removeTag('_control_use_launch_into_air');

}
