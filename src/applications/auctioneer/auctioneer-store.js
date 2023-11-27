import { get, writable } from "svelte/store";
import { TJSDocument } from "@typhonjs-fvtt/runtime/svelte/store/fvtt/document";
import CONSTANTS from "~/constants.js";
import * as lib from "~/lib.js";
import Browse from "~/applications/auctioneer/Browse/Browse.svelte";
import Bids from "~/applications/auctioneer/Bids/Bids.svelte";
import Auctions from "~/applications/auctioneer/Auctions/Auctions.svelte";
import Winnings from "~/applications/auctioneer/Winnings/Winnings.svelte";
import Logs from "~/applications/auctioneer/Logs/Logs.svelte";
import { getPriceFromData } from "~/lib.js";

export default function (auctioneer) {

	const store = writable({
		itemsPerPage: 12,
		currentPage: 1,
		totalPages: 1,
		tabs: {
			"browse": {
				label: "Browse",
				component: Browse,
				selected: "",
				sortBy: "name",
				sortByInverse: false,
				switch: "price",
				sortByColumns: {
					"name": { label: "Name", sort: (a, b) => a.item.name > b.item.name ? 1 : -1 },
					"time": { label: "Time Left", sort: (a, b) => b.timeLeft.value - a.timeLeft.value },
					"seller": { label: "Seller", sort: (a, b) => a.actor.name > b.actor.name ? 1 : -1 },
					"bid-type": { label: "Bid Type", sort: (a, b) => a.bidVisibility > b.bidVisibility ? 1 : -1 },
					"price": {
						label: "Price / Buyout",
						sort: (a, b) => b.bidPriceData.totalPrice - a.bidPriceData.totalPrice,
						tooltip: "Current Bid Price & Buyout Price",
						visible: (_, store) => {
							return store.tabs.browse.switch === "price";
						},
						switch: "reserve",
						showSwitch: (flags) => {
							return flags.reserveLimitVisibility !== "hidden";
						},
					},
					"reserve": {
						label: "Reserve",
						tooltip: "Reserve Price - price must reach this before getting sold",
						visible: (flags, store) => {
							return flags.reserveLimitVisibility !== "hidden"
								&& store.tabs.browse.switch === "reserve"
						},
						switch: "price",
						sort: (a, b) => b.reservePriceData.totalPrice - a.reservePriceData.totalPrice
					},
				}
			},
			"bids": {
				label: "Bids",
				component: Bids,
				selected: "",
				sortBy: "name",
				sortByInverse: false,
				sortByColumns: {
					"name": { label: "Name", sort: (a, b) => a.auction.item.name > b.auction.item.name ? 1 : -1 },
					"time": { label: "Time Left", sort: (a, b) => b.auction.timeLeft.value - a.auction.timeLeft.value },
					"price": {
						label: "Buyout Price", sort: (a, b) => {
							if (!b.auction.buyoutPrice && a.auction.buyoutPrice) {
								return 1;
							} else if (b.auction.buyoutPrice && !a.auction.buyoutPrice) {
								return -1;
							}
							return b.auction.buyoutPriceData.totalPrice - a.auction.buyoutPriceData.totalPrice;
						}
					},
					"bid-type": { label: "Bid Type", sort: (a, b) => a.auction.bidVisibility > b.auction.bidVisibility ? 1 : -1 },
					"bid-status": { label: "Bid Status", sort: (a, b) => b.bidStatus.value - a.bidStatus.value },
					"bid": {
						label: "Current Bid",
						sort: (a, b) => b.bidPriceData.totalPrice - a.bidPriceData.totalPrice
					},
				}
			},
			"auctions": {
				label: "Auctions",
				component: Auctions,
				selected: "",
				sortBy: "name",
				sortByInverse: false,
				switch: "price",
				sortByColumns: {
					"name": { label: "Name", sort: (a, b) => a.item.name > b.item.name ? 1 : -1 },
					"time": { label: "Time Left", sort: (a, b) => b.timeLeft.value - a.timeLeft.value },
					"high-bidder": { label: "High Bidder", sort: (a, b) => a.actor.name > b.actor.name ? 1 : -1 },
					"bid-type": { label: "Bid Type", sort: (a, b) => a.bidVisibility > b.bidVisibility ? 1 : -1 },
					"price": {
						label: "Bid/Reserve Price",
						sort: (a, b) => {
							return b.bidPriceData.totalPrice - a.bidPriceData.totalPrice
						},
						tooltip: "Current Bid Price & Reserve Price",
						visible: (_, store) => {
							return store.tabs.auctions.switch === "price";
						},
						switch: "start-price"
					},
					"start-price": {
						label: "Start/Buyout Price",
						sort: (a, b) => b.totalPrice - a.totalPrice,
						tooltip: "Start Price & Buyout Price",
						visible: (_, store) => {
							return store.tabs.auctions.switch === "start-price";
						},
						switch: "price"
					},
				}
			},
			"wins": {
				label: "Winnings",
				component: Winnings,
				selected: "",
				sortBy: "name",
				sortByInverse: false,
				sortByColumns: {
					"name": { label: "Name", sort: (a, b) => a.item.name > b.item.name ? 1 : -1 },
					"seller": { label: "Seller", sort: (a, b) => a.actor.name > b.actor.name ? 1 : -1 },
					"original-price": {
						label: "Orig. Price",
						sort: (a, b) => b.totalPrice - a.totalPrice
					},
					"price": {
						label: "Winning Price",
						sort: (a, b) => b.won.totalPrice - a.won.totalPrice
					},
				}
			},
			"logs": {
				label: "Logs",
				hidden: () => !game.user.isGM,
				component: Logs
			}
		},
		activeTab: "browse",
		auctionData: {
			auctionsMap: {},
			auctions: [],
			bids: [],
			buyouts: []
		},
		filteredAuctions: [],
		visibleAuctions: [],
		sortedBids: [],
		bidCurrencies: []
	});

	const { set, update, subscribe } = store;

	// Debounced method to update the auctioneer's auction data when data is changed
	function updateAuctionData() {
		update((data) => {
			data.auctionData = getAuctioneerActorData(auctioneer);
			return data;
		});
	}

	const debounceUpdateAuctionData = foundry.utils.debounce(() => {
		updateAuctionData();
	}, 100);

	const userHookId = Hooks.on("updateUser", (doc, data) => {
		if (!(hasProperty(data, CONSTANTS.FLAG) || hasProperty(data, CONSTANTS.DELETE_FLAG))) return false;
		debounceUpdateAuctionData();
	});

	/*
	Simple calendar tends to touch update world time, the date updated hook is only local, meaning other users do not get
	the updated date
  */
	const calendarHookId = Hooks.on("updateWorldTime", () => {
		if (!window?.SimpleCalendar) return;
		debounceUpdateAuctionData();
	});

	updateAuctionData();

	// Used when clicking the titles in the header of any item list
	function setSortBy(sortBy, forcedInverse) {
		update(data => {
			const activeTab = data.tabs[data.activeTab];
			activeTab.sortByInverse = forcedInverse ?? (sortBy === activeTab.sortBy ? !activeTab.sortByInverse : false);
			activeTab.sortBy = sortBy;
			return data;
		});
	}

	// Selection method that runs when clicking on an item in a given tab
	function entryClicked(id) {
		update(data => {
			data.tabs[data.activeTab].selected = data.tabs[data.activeTab].selected !== id ? id : "";
			return data;
		});
	}

	function decrementPage() {
		update(data => {
			data.currentPage = Math.max(data.currentPage - 1, 1);
			return data;
		})
	}

	function incrementPage() {
		update(data => {
			data.currentPage = Math.min(data.currentPage + 1, data.totalPages);
			return data;
		})
	}

	const search = writable("");
	const searchRegex = writable("");

	function searchClicked() {
		const searchValue = get(search)
		searchRegex.update(() => {
			return searchValue
				? new RegExp(searchValue.toLowerCase(), "g")
				: "";
		})
	}

	const systemCategories = game.itempiles.API.getItemCategories();
	const itemFilters = game.itempiles.API.ITEM_FILTERS;
	const categories = writable(Object.entries(systemCategories).map(([key, value]) => {
		if (itemFilters.some(filter => filter.path === "type" && filter.filters.includes(key))) return false;
		return {
			value: key,
			label: value
		}
	}).filter(Boolean));
	const selectedCategories = writable([]);

	async function bidOnItem(auction, bidCurrencies) {

		if (!bidCurrencies) {
			return false;
		}

		const targetActor = get(actorDoc);

		const bidPaymentData = lib.getPriceFromData(bidCurrencies, targetActor);

		if (!bidPaymentData.canBuy) {
			ui.notifications.warn("Insufficient funds");
			return false;
		}

		const latestBidPrice = (auction.bidVisibility === CONSTANTS.VISIBILITY_KEYS.HIDDEN
			? auction?.bids.filter(bid => bid.user === game.user)?.[0]
			: auction?.bids?.[0])?.price;

		let minimumBidPrice = latestBidPrice ?? auction.startPrice;

		if(auction.minBidPrice) {
			minimumBidPrice = game.itempiles.API.calculateCurrencies(minimumBidPrice, auction.minBidPrice, false);
		}

		const latestBidPaymentData = lib.getPriceFromData(minimumBidPrice);

		if(lib.isPriceHigherThan(latestBidPaymentData, bidPaymentData)){
			ui.notifications.warn(`Insufficient bid - you must bid more than ${minimumBidPrice}`);
			return;
		}

		const existingBids = lib.getUserBids();

		const existingBidForAuctionIndex = existingBids.findIndex(bid => bid.auctionUuid === auction.uuid)

		existingBids.push({
			id: randomID(),
			auctionUuid: existingBids?.[existingBidForAuctionIndex]?.uuid ?? auction.uuid,
			price: bidPaymentData.basePriceString,
			date: lib.evaluateFoundryTime(auctioneer)
		});

		const currencyCost = existingBids[existingBidForAuctionIndex]?.price
			? game.itempiles.API.calculateCurrencies(bidPaymentData.basePriceString, existingBids[existingBidForAuctionIndex]?.price)
			: bidPaymentData.basePriceString;

		await game.itempiles.API.removeCurrencies(targetActor, currencyCost);

		await game.user.setFlag(CONSTANTS.MODULE_NAME, CONSTANTS.BIDS_FLAG, existingBids);

		return true;

	}

	async function buyoutItem(auction) {
		if (!auction.buyoutPrice) return;
		const targetActor = get(actorDoc);
		const buyoutPaymentData = lib.getPriceFromData(auction.buyoutPrice, targetActor);
		if (!buyoutPaymentData.canBuy) {
			ui.notifications.warn("Insufficient funds - you do not have enough funds to buy out this auction");
			return false;
		}
		const existingBuyouts = lib.getUserBuyouts();
		existingBuyouts.push({
			id: randomID(),
			auctionUuid: auction.uuid,
			price: auction.buyoutPrice,
			date: lib.evaluateFoundryTime(auctioneer)
		});
		await game.itempiles.API.removeCurrencies(targetActor, auction.buyoutPrice);
		return game.user.setFlag(CONSTANTS.MODULE_NAME, CONSTANTS.BUYOUTS_FLAG, existingBuyouts);
	}

	const selectedActorUuids = game.user.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.USER_AUCTIONEER_FLAGS) ?? {};

	const selectedCharacterUuid = selectedActorUuids?.[auctioneer.id] ?? game.user.character?.uuid;
	const actorUuid = writable(selectedCharacterUuid);
	const actorDoc = new TJSDocument();
	const actorCurrencies = writable(lib.getCurrencies(auctioneer));

	const actorUuidUnsubscribe = actorUuid.subscribe((uuid) => {
		if (!uuid) return;
		const actor = fromUuidSync(uuid);
		if (!actor) return;
		actorDoc.set(actor);
		game.user.setFlag(CONSTANTS.MODULE_NAME, CONSTANTS.USER_AUCTIONEER_FLAGS, {
			[auctioneer.id]: uuid
		});
	});

	function updateActorCurrencies() {
		const doc = get(actorDoc);
		if (!doc) return;
		const flags = lib.getAuctioneerActorFlags(auctioneer);
		const actorNewCurrencies = game.itempiles.API.getActorCurrencies(doc, {
			getAll: true,
			secondary: flags.allowSecondaryCurrencies
		});
		actorCurrencies.update(data => {
			return data.map((currency, index) => {
				currency.quantity = actorNewCurrencies?.[index]?.quantity ?? 0;
				return currency;
			});
		});
	}

	const actorDocUnsubscribe = actorDoc.subscribe((doc) => {
		if (!doc) return;
		updateActorCurrencies();
	})

	const auctioneerDoc = new TJSDocument(auctioneer);

	/**
	 * {ActorFlagDefaults}
	 */
	const auctioneerFlags = writable(CONSTANTS.ACTOR_DEFAULTS);
	const auctioneerUnsubscribe = auctioneerDoc.subscribe(() => {
		auctioneerFlags.update(() => {
			updateActorCurrencies();
			return lib.getAuctioneerActorFlags(auctioneer);
		})
	});

	function unsubscribe() {
		Hooks.off("updateUser", userHookId);
		Hooks.off("simple-calendar-date-time-change", calendarHookId);
		actorDocUnsubscribe();
		actorUuidUnsubscribe();
		auctioneerUnsubscribe();
	}

	async function postAuctions(data) {

		const bidPriceString = lib.turnCurrenciesIntoString(data.bidCurrencies);
		const bidPriceData = bidPriceString ? lib.getPriceFromData(bidPriceString) : false;

		const buyoutPriceString = lib.turnCurrenciesIntoString(data.buyoutCurrencies);
		const buyoutPriceData = buyoutPriceString ? lib.getPriceFromData(buyoutPriceString) : false;

		if (!bidPriceString && !buyoutPriceString) {
			ui.notifications.error("The item cannot be free!")
			return false;
		}

		if (bidPriceData && buyoutPriceData && lib.isPriceHigherThan(bidPriceData, buyoutPriceData)) {
			ui.notifications.error("The buyout price cannot be lower or equal to the starting bid price!")
			return false;
		}

		const reservePriceString = lib.turnCurrenciesIntoString(data.reserveCurrencies);
		const reservePriceData = reservePriceString ? lib.getPriceFromData(reservePriceString) : false;

		if (bidPriceData && reservePriceData && lib.isPriceHigherThan(bidPriceData, reservePriceData)) {
			ui.notifications.error("The reserve price cannot be lower or equal to the starting bid price!")
			return false;
		}

		const minBidPriceString = lib.turnCurrenciesIntoString(data.minBidCurrencies);

		const actor = get(actorDoc);

		const baseFlagData = {
			actorUuid: actor.uuid,
			itemData: data.itemData,
			startPrice: bidPriceString,
			buyoutPrice: buyoutPriceString,
			minBidPrice: minBidPriceString,
			reservePrice: reservePriceString,
			quantity: data.quantityPerAuction,
			bidVisibility: data.bidVisibility,
			reserveLimitVisibility: data.reserveLimitVisibility,
			duration: data.duration,
			date: lib.evaluateFoundryTime(auctioneer),
			expiryDate: lib.evaluateFoundryTime(auctioneer, data.duration)
		}

		const auctions = lib.getUserAuctions();

		for (let i = 0; i < data.numAuctions; i++) {
			const id = randomID();
			auctions.push({
				id,
				uuid: `${id}-${auctioneer.uuid}-${game.user.uuid}`,
				...baseFlagData
			});
		}

		const item = await fromUuid(data.uuid);
		if (item.parent && actor) {
			await game.itempiles.API.removeItems(actor, [{
				_id: item.id, quantity: data.quantityPerAuction * data.numAuctions
			}]);
		}

		return game.user.setFlag(CONSTANTS.MODULE_NAME, CONSTANTS.AUCTIONS_FLAG, auctions);

	}

	async function claimAuctions(auctions, cancelled = false) {
		const ownedAuctions = auctions.filter(auction => auction.user === game.user && !auction.claimed);
		const otherAuctions = auctions.filter(auction => auction.user !== game.user && !auction.claimed);
		const actor = get(actorDoc);
		const flags = get(auctioneerFlags);
		const itemsToCreate = [];
		let successfulAuctionCurrencies = [];
		let failedBidCurrencies = [];

		let ownAuctions = lib.getUserAuctions();
		let ownBids = lib.getUserBids();
		let ownBuyouts = lib.getUserBuyouts();

		if (ownedAuctions.length) {
			const successfulAuctions = ownedAuctions.filter(auction => auction.won);
			const failedAuctions = ownedAuctions.filter(auction => !auction.won);
			itemsToCreate.push(...failedAuctions.map(auction => {
				return {
					item: auction.item,
					quantity: auction.quantity
				}
			}));

			for (const auction of successfulAuctions) {
				successfulAuctionCurrencies.push(auction.won.price);
			}

			ownAuctions = ownAuctions.map(existingAuction => {
				if (existingAuction.claimed || !ownedAuctions.some(ownAuction => ownAuction.uuid === existingAuction.uuid)) {
					return existingAuction;
				}
				return {
					claimed: true,
					claimedDate: lib.evaluateFoundryTime(auctioneer),
					cancelled,
					...existingAuction
				}
			});
		}

		if (otherAuctions.length) {

			for (const auction of otherAuctions) {

				if (auction.won.user === game.user) {
					itemsToCreate.push({
						item: auction.item.toObject(),
						quantity: auction.quantity
					});
				} else {
					const auctionBids = auction.bids.filter(bid => bid.user === game.user);
					if (auctionBids.length) {
						failedBidCurrencies.push(auctionBids[0].price);
					}
				}

				ownBids = ownBids.map(existingBid => {
					if (existingBid.claimed || auction.won.uuid !== existingBid.uuid) return existingBid;
					return {
						claimed: true,
						claimedDate: lib.evaluateFoundryTime(auctioneer),
						...existingBid
					}
				});

				if (auction.won.type === "buyout") {
					ownBuyouts = ownBuyouts.map(existingBuyout => {
						if (existingBuyout.claimed || auction.won.uuid !== existingBuyout.uuid) return existingBuyout;
						return {
							claimed: true,
							claimedDate: lib.evaluateFoundryTime(auctioneer),
							...existingBuyout
						}
					});
				}
			}
		}

		if (actor && itemsToCreate.length) await game.itempiles.API.addItems(actor, itemsToCreate);
		if (actor && (successfulAuctionCurrencies.length || failedBidCurrencies.length)){
			let totalFee = "";
			let totalCurrenciesToAdd = ""
			const auctionFee = Math.max(0, flags.auctionFee ?? 0);
			for(const successfulAuctionCurrency of successfulAuctionCurrencies){

				if(flags.auctionFee) {
					const fee = game.itempiles.API.calculateCurrencies(successfulAuctionCurrency, auctionFee / 100);
					totalFee = totalFee
						? game.itempiles.API.calculateCurrencies(totalFee, fee, false)
						: fee;
				}

				const currency = game.itempiles.API.calculateCurrencies(successfulAuctionCurrency, (100-auctionFee) / 100);
				totalCurrenciesToAdd = totalCurrenciesToAdd
					? game.itempiles.API.calculateCurrencies(totalCurrenciesToAdd, currency, false)
					: currency;
			}

			for(const failedBidCurrency of failedBidCurrencies){
				totalCurrenciesToAdd = totalCurrenciesToAdd
					? game.itempiles.API.calculateCurrencies(totalCurrenciesToAdd, failedBidCurrency, false)
					: failedBidCurrency;
			}

			await game.itempiles.API.addCurrencies(actor, totalCurrenciesToAdd);
			let message = `${totalCurrenciesToAdd} was added to ${actor.name}`;
			if(totalFee){
				message += ` - ${totalFee} was claimed as auction fees.`
			}
			ui.notifications.info(message)
		}

		return game.user.update({
			[`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.AUCTIONS_FLAG}`]: ownAuctions,
			[`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.BIDS_FLAG}`]: ownBids,
			[`flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.BUYOUTS_FLAG}`]: ownBuyouts
		});

	}

	async function relistAuction(auction) {
		const existingAuctions = lib.getUserAuctions();
		const indexToRefresh = existingAuctions.findIndex(existingAuction => existingAuction.uuid === auction.uuid);
		existingAuctions[indexToRefresh].date = lib.evaluateFoundryTime(auctioneer)
		existingAuctions[indexToRefresh].expiryDate = lib.evaluateFoundryTime(auctioneer, existingAuctions[indexToRefresh].duration);
		ui.notifications.notify(`The auction for ${auction.item.name} has been relisted.`);
		return game.user.setFlag(CONSTANTS.MODULE_NAME, CONSTANTS.AUCTIONS_FLAG, existingAuctions);
	}

	return {
		set,
		update,
		subscribe,
		unsubscribe,
		searchClicked,
		decrementPage,
		incrementPage,
		setSortBy,
		entryClicked,
		bidOnItem,
		buyoutItem,

		postAuctions,
		claimAuctions,
		relistAuction,

		auctioneer,
		auctioneerDoc,
		auctioneerFlags,

		actorDoc,
		actorUuid,
		actorCurrencies,

		categories,
		selectedCategories,
		search,
		searchRegex,
	}

}

/**
 * @typedef {Object} AuctionData
 * @property {Array<Auction>} auctions
 * @property {Array<Bid>} bids
 * @property {Array<Buyout>} buyouts
 *
 * @param {Actor} auctioneer
 * @return {AuctionData}
 */
function getAuctioneerActorData(auctioneer) {

	const auctions = {};
	const bids = {};
	const buyouts = {};

	const { auctionFlags, bidFlags, buyoutFlags } = game.users.reduce((acc, user) => {
		const userAuctions = lib.getUserAuctions(user);
		const userBids = lib.getUserBids(user);
		const userBuyouts = lib.getUserBuyouts(user);
		return {
			auctionFlags: acc.auctionFlags.concat(userAuctions.map(source => ({ ...source, userUuid: user.uuid }))),
			bidFlags: acc.bidFlags.concat(userBids.map(source => ({ ...source, userUuid: user.uuid }))),
			buyoutFlags: acc.buyoutFlags.concat(userBuyouts.map(source => ({ ...source, userUuid: user.uuid }))),
		}
	}, { auctionFlags: [], bidFlags: [], buyoutFlags: [] });

	auctionFlags.sort((a, b) => b.date - a.date);
	bidFlags.sort((a, b) => b.date - a.date);
	buyoutFlags.sort((a, b) => b.date - a.date);

	auctionFlags.filter(source => {
		return source.uuid.endsWith(auctioneer.uuid + "-" + source.userUuid);
	}).forEach(source => {
		const auction = {};
		auction._source = foundry.utils.mergeObject(foundry.utils.deepClone(CONSTANTS.DEFAULTS.AUCTION), source);
		auction.type = "auction";
		auction.id = auction._source.id;
		auction.uuid = auction._source.uuid;
		auction.cancelled = auction._source.cancelled;
		auction.claimed = auction._source.claimed;
		auction.item = new Item.implementation(auction._source.itemData)
		auction.user = fromUuidSync(auction._source.userUuid);
		auction.actor = auction._source.actorUuid ? fromUuidSync(auction._source.actorUuid) : false;
		auction.date = auction._source.date;
		auction.claimedDate = auction._source.claimedDate;
		auction.expiryDate = auction._source.expiryDate;
		auction.expired = lib.evaluateFoundryTime(auctioneer) >= auction._source.expiryDate;
		auction.timeLeft = lib.dateNumberToRelativeString(auctioneer, auction._source.expiryDate);
		auction.quantity = auction._source.quantity;
		auction.bidVisibility = auction._source.bidVisibility;
		auction.startPrice = auction._source.startPrice;
		auction.buyoutPrice = auction._source.buyoutPrice;
		auction.reservePrice = auction._source.reservePrice;
		auction.minBidPrice = auction._source.minBidPrice;

		auction.startPriceData = lib.getPriceFromData(auction._source.startPrice);
		auction.buyoutPriceData = lib.getPriceFromData(auction._source.buyoutPrice);
		auction.reservePriceData = lib.getPriceFromData(auction._source.reservePrice);
		auction.minBidPriceData = lib.getPriceFromData(auction._source.minBidPrice);

		auction.won = false;
		auction.bids = [];
		auction.bidPriceData = false;
		auction.highestOwnedBid = false;

		auctions[auction.uuid] = auction;
	});

	buyoutFlags.filter(source => {
		return source.auctionUuid.includes("-" + auctioneer.uuid + "-") && auctions[source.auctionUuid];
	}).forEach(source => {
		const buyout = {};
		buyout._source = foundry.utils.mergeObject(foundry.utils.deepClone(CONSTANTS.DEFAULTS.BUYOUT), source);
		buyout.type = "buyout";
		buyout.id = buyout._source.id;
		buyout.date = buyout._source.date;
		buyout.user = fromUuidSync(buyout._source.userUuid);
		buyout.actor = buyout._source.actorUuid ? fromUuidSync(buyout._source.actorUuid) : false;
		buyout.priceData = lib.getPriceFromData(buyout._source.price);
		buyout.price = buyout._source.price;
		buyout.claimed = buyout._source.claimed;
		buyout.auction = auctions[buyout._source.auctionUuid];
		buyout.auction.won = buyout;

		buyouts[buyout.id] = buyout;
	});

	bidFlags.filter(source => {
		return source.auctionUuid.includes("-" + auctioneer.uuid + "-")
			&& auctions[source.auctionUuid]
			&& !auctions[source.auctionUuid].won;
	}).forEach(source => {
		const bid = {};
		bid._source = foundry.utils.mergeObject(foundry.utils.deepClone(CONSTANTS.DEFAULTS.BID), source);

		bid.type = "bid";
		bid.id = bid._source.id;
		bid.date = bid._source.date;
		bid.user = fromUuidSync(bid._source.userUuid);
		bid.actor = bid._source.actorUuid ? fromUuidSync(bid._source.actorUuid) : false;
		bid.priceData = lib.getPriceFromData(bid._source.price);
		bid.price = bid._source.price;
		bid.claimed = bid._source.claimed;
		bid.bidStatus = { value: -Infinity, label: "Low Bid" };
		bid.auction = auctions[bid._source.auctionUuid];
		bid.auction.bids.push(bid);

		bids[bid.id] = bid;

	});

	for (const auction of Object.values(auctions)) {

		auction.bids.sort((a, b) => b.priceData.totalPrice - a.priceData.totalPrice);

		const ownedBids = auction.bids.filter(bid => bid.user === game.user);

		if (auction.bidVisibility === CONSTANTS.VISIBILITY_KEYS.VISIBLE || auction.user === game.user) {
			auction.bidPriceData = auction.bids.length ? auction.bids[0].priceData : auction.startPriceData;
			auction.bidPrice = auction.bids.length ? auction.bids[0].price : false;
		} else {
			auction.bidPriceData = ownedBids.length ? ownedBids[0].priceData : auction.startPriceData;
			auction.bidPrice = auction.bids.length ? ownedBids[0].price : false;
		}

		auction.minBidPrice = auction.minBidPrice
			? game.itempiles.API.calculateCurrencies(auction.bidPrice, auction.minBidPrice, false)
			: auction.bidPrice || auction.startPrice;
		auction.minBidPriceData = lib.getPriceFromData(auction.minBidPrice);

		if (auction.bids.length && auction.buyoutPrice) {
			if (lib.isPriceHigherThan(auction.bids[0].priceData, auction.buyoutPriceData)) {
				auction.buyoutPriceData = false;
			}
		}

		auction.highBidder = auction.bids?.[0]?.user;

		if (auction.expired && auction.bids.length) {
			if(!auction.reservePrice || !lib.isPriceHigherThan(auction.bids[0].priceData, auction.reservePriceData)){
				auction.won = auction.bids[0];
				if(auction.user === game.user) {
					auction.timeLeft = {
						label: "Auction Succeeded",
						value: Infinity
					}
				}
			}
		}

		if (ownedBids.length && !auction.claimed) {
			const highestOwnedBid = ownedBids[0];
			auction.highestOwnedBid = highestOwnedBid;
			const bidIndex = auction.bids.indexOf(highestOwnedBid);
			if (auction.bidVisibility === CONSTANTS.VISIBILITY_KEYS.VISIBLE) {
				let label = "Low Bid";
				if (bidIndex === 0) {
					label = "Highest Bid"
				} else if (bidIndex === 1 || bidIndex === 2) {
					label = "High Bid"
				}
				highestOwnedBid.bidStatus = {
					value: Math.min(bidIndex, 3),
					label
				}
			} else {
				highestOwnedBid.bidStatus = {
					value: 0,
					label: CONSTANTS.BID_VISIBILITY_UI_LABELS[auction.bidVisibility]
				}
			}
		}
	}

	return {
		auctionsMap: auctions,
		auctions: Object.values(auctions),
		bids: Object.values(bids),
		buyouts: Object.values(buyouts)
	}

}
