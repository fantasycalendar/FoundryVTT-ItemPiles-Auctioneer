import "./styles/styles.scss";
import CONSTANTS from "./constants.js";
import * as lib from "./lib.js";
import { getAuctioneerActorData } from "~/applications/auctioneer/auctioneer-store.js";

Hooks.once("ready", () => {
	document.documentElement.style.setProperty("--item-piles-auctioneer-ui-height", `${CONSTANTS.AUCTION_UI_HEIGHT}px`);
	Hooks.on(game.itempiles.hooks.PRE_RENDER_INTERFACE, lib.auctioneerRendered);
	game.itempiles.API.registerItemPileType(CONSTANTS.AUCTIONEER, "Auctioneer", CONSTANTS.AUCTIONEER_SETTINGS);
  migrateData();
});

async function migrateData() {
  if(!lib.isResponsibleGM()) return;
  const auctioneers = game.actors
    .filter(actor => {
      return actor.getFlag("item-piles", 'data')?.type === CONSTANTS.AUCTIONEER;
    })
    .map(auctioneer => {
      const auctioneerData = getAuctioneerActorData(auctioneer);
      const { userUpdates, actorUpdates } = lib.getLogs(auctioneer, auctioneerData);
      return {
        id: auctioneer.id,
        userUpdates,
        actorUpdates
      }
    })
    .filter(auctioneer => {
      return !foundry.utils.isEmpty(auctioneer.actorUpdates) || auctioneer.userUpdates.length;
    });
  if(!auctioneers.length) return;

  const actorUpdates = auctioneers.map(auctioneer => auctioneer.actorUpdates);
  const userUpdates = auctioneers.map(auctioneer => auctioneer.userUpdates)
    .deepFlatten()
    .reduce((acc, update) => {
      const foundIndex = acc.findIndex(pastUpdate => pastUpdate._id === update._id);
      if(foundIndex > -1){
        acc[foundIndex] = foundry.utils.mergeObject(acc[foundIndex], update);
      }else{
        acc.push(update);
      }
      return acc;
    }, []);

  await Actor.updateDocuments(actorUpdates)
  await User.updateDocuments(userUpdates);
}
