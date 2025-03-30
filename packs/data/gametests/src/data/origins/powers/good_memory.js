import { world, system } from "@minecraft/server";
import { memorizeInventory, getRecentDeaths } from "../../../utils/remember-inventory";
import { toAllPlayers } from "../../../origins/player";
import { playerEvents } from "../../../utils/PubSub";

function memorize(player) {
  if ((player?.hasTag("power_good_memory") || player?.hasTag("perk_good_memory")) && !getRecentDeaths().has(player.id)) {
    memorizeInventory(player, true);
  }
}

toAllPlayers(memorize, 30);