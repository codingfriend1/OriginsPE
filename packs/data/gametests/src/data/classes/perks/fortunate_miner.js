import { favoredEnchantment } from "../../../utils/favored_enchantments";

favoredEnchantment({
  perkName: "perk_fortunate_miner", 
  enchantmentName: "minecraft:fortune", 
  exclusiveTools: [
    "wooden_pickaxe",
    "stone_pickaxe",
    "iron_pickaxe",
    "golden_pickaxe",
    "diamond_pickaxe",
    "netherite_pickaxe",

    "blacksmith_wooden_pickaxe",
    "blacksmith_stone_pickaxe",
    "blacksmith_iron_pickaxe",
    "blacksmith_golden_pickaxe",
    "blacksmith_diamond_pickaxe",
    "blacksmith_netherite_pickaxe"
  ], 
  lore: "§6Fortunate Miner Blessing§r"
});