import { world, system } from "@minecraft/server";
import { memorizeInventory, getRecentDeaths } from "../../../utils/remember-inventory";
import { toAllPlayers } from "../../../origins/player";
import { playerEvents } from "../../../utils/PubSub";

const tag = "power_good_memory";

function memorize(player) {
  if (player?.hasTag(tag) && !getRecentDeaths().has(player.id)) {
    memorizeInventory(player, true);
  }
}

toAllPlayers(memorize, 30);