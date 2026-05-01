import { HERO_CLASSES, LOOT_CATEGORIES, PRISM_DICE, ROOM_TYPES } from "../shared/game-data.js";
import "./styles.css";

const summary = [
  `${HERO_CLASSES.length} hero classes`,
  `${PRISM_DICE.length} PRISM die faces`,
  `${ROOM_TYPES.length} room types`,
  `${LOOT_CATEGORIES.length} loot categories`
];

const badge = document.createElement("aside");
badge.className = "system-badge";
badge.innerHTML = `
  <strong>Scaffold Online</strong>
  <span>${summary.join(" / ")}</span>
`;

document.body.appendChild(badge);
