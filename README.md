# Mammobits Survival (Web)
Vanilla JS/Canvas top-down survival prototype scaffold.

## Run
Open `index.html` directly or serve the folder (any static host / GitHub Pages / GoDaddy).

## Structure
See `/src` for modules and `/config` for tunables. Assets are referenced by filename but not included here.

## Controls
- Move: WASD / Arrows
- Abilities: [2]=Stomp, [3]=Water, [4]=Charge
- Pause: P, Mute: button
- Debug overlay: ` (backtick)

## Notes
- NFT gate & scoreboard are stubbed for now; wire your provider in `/src/services/` and fill `/config/nft.json` & `/config/backend.json`.
- Missing assets fall back to debug shapes so you can run immediately.
