import { world, system } from "@minecraft/server";
import { memorizeHotbar, getRecentDeaths } from "../../../utils/remember-inventory";
import { toAllPlayers } from "../../../origins/player";
import { playerEvents } from "../../../utils/PubSub";

const tag = "power_essentials";

function memorize(player) {
  if (player?.hasTag(tag) && !getRecentDeaths().has(player.id)) {
    memorizeHotbar(player, true);
  }
}

toAllPlayers(memorize, 30);