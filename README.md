# OriginsPE

OriginsPE (Portable Edition) is a Minecraft: Bedrock Edition Add-On that allows you to select an Origin at the start of the game. Each Origin has their own unique abilities, advantages, and disadvanatages. Moreoever, you can also be able to pick your Class. Classes, on the other hand, may complement whatever Origin of your choosing. Or just be a Human, a regular playthrough of Minecraft as is.

This repository is intended for developers and modders, if you'd like to download the Add-On, please visit the CurseForge / MCPEDL page.

## Setting up the development environment

1. Download and install necessary programs:
   - [Regolith](https://github.com/Bedrock-OSS/regolith/releases) - [Regolith documentation](https://bedrock-oss.github.io/regolith/guide/installing)
   - [NodeJS](https://nodejs.org/en/download/)
   - [Python](https://www.python.org/downloads/)
   - A text editor of your choice (preferrably [VSCode](https://code.visualstudio.com/))
2. Execute `regolith install-all` in the root directory of the project
3. Execute `regolith run` in the root directory of the project to build the project

## Creating custom Origins and Classes

- You need to learn a bit of JavaScript / TypeScript
- Check the [Scripts API documentation](https://jaylydev.github.io/scriptapi-docs/latest/index.html) for your reference
- The base logic for the abilities are found at `packs/data/gametests/src/data` 
  - New files that are added within this directory are automatically imported

## Building

Execute `regolith run` in the root directory of the project to build the project. It is recommended to build the project.

# Language Translations

Language translations were performed by:

[https://solveddev.github.io/AnyLanguage/](https://solveddev.github.io/AnyLanguage/)

## Balance Updates

This branch attempts to balance some of the Origins:

- Phantoms origin can now be hurt when outside of spectator mode. Spiritual Body Perk has been removed.
- Headwear on Phantoms only reduce 50% of sunlight damage no longer 100%.
- Miner Class is blessed with Fortune +1 on all their pickaxes. No other players share this blessed status.

## Bug Fixes

- Solves issue where normal tools wouldn't show up in crafting recipes. 
- Fixes an issue where tools made by the blacksmith class would never wear out or break.
- Remove bug where blacksmith could convert tools from other players into Quality Equiptment simply by placing it in their inventory.
- Fixes issue where Enderian origin could teleport outside of their render distance causing errors and spontoneous teleportation when the chunk loaded.
