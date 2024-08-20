import "./styles/styles.scss";
import CONSTANTS from "./constants.js";
import * as lib from "./lib.js";

Hooks.once("item-piles-ready", () => {
	document.documentElement.style.setProperty("--item-piles-auctioneer-ui-height", `${CONSTANTS.AUCTION_UI_HEIGHT}px`);
	Hooks.on(game.itempiles.hooks.PRE_RENDER_INTERFACE, lib.auctioneerRendered);
	game.itempiles.API.registerItemPileType(CONSTANTS.AUCTIONEER, "Auctioneer", CONSTANTS.AUCTIONEER_SETTINGS);
	if (lib.isResponsibleGM()) lib.migrateData();

	game.itempilesauctioneer = {
		API: {
			getAuctioneerData: lib.getAuctioneerData
		}
	}
});
