import { get, writable } from "svelte/store";
import { TJSDocument } from "@typhonjs-fvtt/runtime/svelte/store/fvtt/document";
import CONSTANTS from "~/constants.js";
import * as lib from "~/lib.js";
import { getCurrencies } from "~/lib.js";
import Browse from "~/applications/auctioneer/Browse/Browse.svelte";
import Bids from "~/applications/auctioneer/Bids/Bids.svelte";
import Auctions from "~/applications/auctioneer/Auctions/Auctions.svelte";
import Winnings from "~/applications/auctioneer/Winnings/Winnings.svelte";
import Logs from "~/applications/auctioneer/Logs/Logs.svelte";

export function createStore(auctioneer) {

	const store = writable({
		itemsPerPage: 12,
		currentPage: 1,
		totalPages: 1,
		access: true,
		closed: false,
		tabs: {
			"browse": {
				label: "Browse",
				component: Browse,
				selected: "",
				sortBy: "name",
				sortByInverse: false,
				switch: "price",
				sortByColumns: {
					"name": { label: "Name", sort: (a, b) => a.item?.name > b.item?.name ? 1 : -1 },
					"time": { label: "Time", sort: (a, b) => b.timeLeft.value - a.timeLeft.value },
					"seller": { label: "Seller", sort: (a, b) => a.actor?.name > b.actor?.name ? 1 : -1 },
					"bid-type": { label: "Type", sort: (a, b) => a.bidVisibility > b.bidVisibility ? 1 : -1 },
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
					"time": { label: "Time", sort: (a, b) => b.auction.timeLeft.value - a.auction.timeLeft.value },
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
					"bid-type": { label: "Bid", sort: (a, b) => a.auction.bidVisibility > b.auction.bidVisibility ? 1 : -1 },
					"bid-status": { label: "Status", sort: (a, b) => b.bidStatus.value - a.bidStatus.value },
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
					"time": { label: "Time", sort: (a, b) => b.timeLeft.value - a.timeLeft.value },
					"high-bidder": { label: "High Bidder", sort: (a, b) => a.actor.name > b.actor.name ? 1 : -1 },
					"bid-type": { label: "Type", sort: (a, b) => a.bidVisibility > b.bidVisibility ? 1 : -1 },
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
		bidCurrencies: [],
	});

	/**
	 * @type {TJSDocument<Item>}
	 */
	const auctionItemStore = new TJSDocument();
	const newAuctionStore = writable({
		uuid: false,
		numAuctions: 1,
		quantityPerAuction: 1,
		hiddenQuantity: false,
		itemData: false,
		itemCost: false,
		depositPrice: false,
	});
	const { set, update, subscribe } = store;

	/**
	 * Handles drag and drop data, specifically items being dropped into the auction
	 * @param dropData
	 * @returns {Promise<void>}
	 */
	async function onDropData(dropData) {

		// Create item and check whether the item has a parent; only GMs can add items to the auctioneer without an owner
		const item = await Item.implementation.fromDropData(dropData);
		if (!item?.parent?.isOwner && !game.user.isGM) return;

		// Switch to the auctions tab, as that is the only place items can be added
		update(data => {
			data.activeTab = "auctions";
			return data;
		})

		// If the dropped item is exactly the same as a currency, bail out;
		const currencies = getCurrencies(auctioneer);
		if (currencies.some(currency => {
			return currency.data.item
				&& currency.data.item.name === item.name
				&& currency.data.item.type === item.type
				&& currency.data.item.img === item.img
		})) {
			return;
		}

		// If item piles has been configured to consider this item a non-physical item (ie, spells, classes), bail out
		if (game.itempiles.API.isItemInvalid(item)) {
			return;
		}

		// Determine the deposit cost & item cost
		const itemCost = game.itempiles.API.getCostOfItem(item);
		let depositPrice = 0;
		const flags = get(auctioneerFlags);
		if (flags?.auctionDeposit) {
			const auctionDepositRoll = lib.evaluateFormula(flags?.auctionDeposit, { itemCost });
			depositPrice = auctionDepositRoll ? auctionDepositRoll.total : flags?.auctionDeposit;
		}

		// Set up new auction store to reflect this newly dropped item
		const canItemStack = game.itempiles.API.canItemStack(item);
		const itemQuantity = game.itempiles.API.getItemQuantity(item);
		auctionItemStore.set(item);
		newAuctionStore.set({
			uuid: dropData.uuid,
			numAuctions: 1,
			quantityPerAuction: canItemStack ? itemQuantity : 1,
			hiddenQuantity: !canItemStack,
			itemData: item.toObject(),
			itemCost,
			depositPrice,
		});
	}

	// Debounced method to update the auctioneer's auction data when data is changed
	function updateAuctionData() {
		update((data) => {
			data.auctionData = lib.getAuctioneerData(auctioneer);
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
	Simple calendar tends to touch update world time, the module's hook for date updated is only local to the gm, meaning
	other users do not get the updated date - also handles regular time, but throttled to once per minute
  */
	let lastUpdate = null;
	const calendarHookId = Hooks.on("updateWorldTime", () => {
		if (Date.now() < (lastUpdate + 10000)
			|| get(auctioneerFlags).timeType === CONSTANTS.AUCTION_TIME_TYPE_KEYS.REAL_TIME
			|| !window?.SimpleCalendar) {
			return;
		}
		debounceUpdateAuctionData();
		lastUpdate = Date.now();
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

		if (!bidCurrencies) return false;

		const targetActor = get(actorDoc);

		const bidPaymentData = lib.getPriceFromData(bidCurrencies, targetActor);

		if (lib.isPriceHigherThan(auction.actualMininumBidPriceData, bidPaymentData)) {
			ui.notifications.warn(`Insufficient bid - you must bid more than ${auction.actualMininumBidPrice}`);
			return false;
		}

		if (!bidPaymentData.canBuy) {
			ui.notifications.warn(`Insufficient funds - you cannot afford to bid ${bidCurrencies}`);
			return false;
		}

		const existingBids = lib.getUserBids();

		const existingBidForAuctionIndex = existingBids.findIndex(bid => bid.auctionUuid === auction.uuid)

		existingBids.push({
			id: randomID(),
			userId: game.userId,
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
			userId: game.userId,
			auctionUuid: auction.uuid,
			actorUuid: targetActor.uuid,
			price: auction.buyoutPrice,
			date: lib.evaluateFoundryTime(auctioneer)
		});
		await game.itempiles.API.removeCurrencies(targetActor, auction.buyoutPrice);
		return game.user.setFlag(CONSTANTS.MODULE_NAME, CONSTANTS.BUYOUTS_FLAG, existingBuyouts);
	}

	/**
	 * @type {TJSDocument<Actor>}
	 */
	const auctioneerDoc = new TJSDocument(auctioneer);

	/**
	 * {ActorFlagDefaults}
	 */
	const auctioneerFlags = writable(lib.getAuctioneerActorFlags(auctioneer));

	const selectedActorUuids = game.user.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.USER_AUCTIONEER_FLAGS) ?? {};

	const selectedCharacterUuid = selectedActorUuids?.[auctioneer.id] ?? game.user.character?.uuid;
	const actorUuid = writable("");

	/**
	 * @type {TJSDocument<Actor>}
	 */
	const actorDoc = new TJSDocument();
	const actorCurrencies = writable([]);

	const actorUuidUnsubscribe = actorUuid.subscribe((uuid) => {
		if (!uuid) return;
		const actor = fromUuidSync(uuid);
		if (!actor) return;
		const flags = get(auctioneerFlags);
		actorDoc.set(actor);
		game.user.setFlag(CONSTANTS.MODULE_NAME, CONSTANTS.USER_AUCTIONEER_FLAGS, {
			[auctioneer.id]: uuid
		});
		updateActorCurrencies();
		evaluateAccess();
	});

	const auctioneerUnsubscribe = auctioneerDoc.subscribe(() => {
		updateActorCurrencies();
		auctioneerFlags.set(lib.getAuctioneerActorFlags(auctioneer));
		evaluateAccess();
	});

	actorUuid.set(selectedCharacterUuid);

	function updateActorCurrencies() {
		const doc = get(actorDoc);
		if (!doc) return;
		const flags = lib.getAuctioneerActorFlags(auctioneer);
		actorCurrencies.set(game.itempiles.API.getActorCurrencies(doc, {
			getAll: true,
			secondary: flags.allowSecondaryCurrencies
		}));
	}

	function evaluateAccess() {
		update(data => {
			const flags = get(auctioneerFlags);
			const doc = get(actorDoc);
			if (flags.entryItem?.data && doc){
				const foundSimilarItem = game.itempiles.API.findSimilarItem(doc.items, flags.entryItem.data);
				data.access = !!foundSimilarItem || game.user.isGM;
			}
			data.closed = flags.auctioneerClosed && !game.user.isGM;
			return data;
		})
	}

	const actorDocUnsubscribe = actorDoc.subscribe((doc) => {
		if (!doc) return;
		updateActorCurrencies();
	})

	function unsubscribe() {
		Hooks.off("updateUser", userHookId);
		Hooks.off("simple-calendar-date-time-change", calendarHookId);
		actorDocUnsubscribe();
		actorUuidUnsubscribe();
		auctioneerUnsubscribe();
	}

	async function createAuctions(data) {

		let bidPriceString = lib.turnCurrenciesIntoString(data.bidCurrencies);
		let bidPriceData = false;
		if (bidPriceString) {
			if (data.priceIsPerQuantity) {
				bidPriceString = game.itempiles.API.calculateCurrencies(bidPriceString, data.quantityPerAuction);
			}
			bidPriceData = lib.getPriceFromData(bidPriceString);
		}

		let buyoutPriceString = lib.turnCurrenciesIntoString(data.buyoutCurrencies);
		let buyoutPriceData = false;
		if (buyoutPriceString) {
			if (data.priceIsPerQuantity) {
				buyoutPriceString = game.itempiles.API.calculateCurrencies(buyoutPriceString, data.quantityPerAuction);
			}
			buyoutPriceData = lib.getPriceFromData(buyoutPriceString);
		}

		if (!bidPriceString && !buyoutPriceString) {
			ui.notifications.error("The item cannot be free - the auction must have a start bid price or a buyout price!");
			return false;
		}

		if (bidPriceData && buyoutPriceData && lib.isPriceHigherThan(bidPriceData, buyoutPriceData)) {
			ui.notifications.error("The buyout price cannot be lower or equal to the starting bid price!")
			return false;
		}

		let reservePriceString = lib.turnCurrenciesIntoString(data.reserveCurrencies);
		let reservePriceData = false;
		if (reservePriceString) {
			if (data.priceIsPerQuantity) {
				reservePriceString = game.itempiles.API.calculateCurrencies(reservePriceString, data.quantityPerAuction);
			}
			reservePriceData = lib.getPriceFromData(reservePriceString);
		}

		if (bidPriceData && reservePriceData && lib.isPriceHigherThan(bidPriceData, reservePriceData)) {
			ui.notifications.error("The reserve price cannot be lower or equal to the starting bid price!")
			return false;
		}

		let minBidPriceString = lib.turnCurrenciesIntoString(data.minBidCurrencies);
		if (minBidPriceString && data.priceIsPerQuantity) {
			minBidPriceString = game.itempiles.API.calculateCurrencies(minBidPriceString, data.quantityPerAuction);
		}

		const actor = get(actorDoc);

		setProperty(data.itemData, game.itempiles.API.ITEM_QUANTITY_ATTRIBUTE, data.quantityPerAuction);

		const baseFlagData = {
			userId: game.userId,
			actorUuid: actor.uuid,
			itemData: data.itemData,
			startPrice: bidPriceString,
			buyoutPrice: buyoutPriceString,
			minBidPrice: minBidPriceString,
			reservePrice: reservePriceString,
			depositPrice: data.baseDepositPrice,
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
				uuid: `${id}-${auctioneer.uuid}-${game.user.id}`,
				...baseFlagData
			});
		}

		const item = await fromUuid(data.uuid);
		if (item?.parent && actor) {
			await game.itempiles.API.removeItems(actor, [{
				_id: item.id, quantity: data.quantityPerAuction * data.numAuctions
			}]);
			if (data.depositPrice) {
				await game.itempiles.API.removeCurrencies(actor, data.depositPrice);
			}
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

		if (cancelled) {
			let content = `<p>Are you sure you want to cancel this auction?</p>`;
			content += flags.auctionDeposit && ownedAuctions[0].depositPrice
				? `<p>You will lose the deposit of <strong>${ownedAuctions[0].depositPrice}</strong>.</p>`
				: '';
			const proceed = await Dialog.confirm({
				title: "Cancel Auction", content, options: { classes: ["dialog", "item-piles-auctioneer"] }
			});
			if (!proceed) return;
		}

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
				successfulAuctionCurrencies.push({ price: auction.won.price, deposit: auction.depositPrice });
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
					if (existingBid.claimed || auction.won.id !== existingBid.id) return existingBid;
					return {
						claimed: true,
						claimedDate: lib.evaluateFoundryTime(auctioneer),
						...existingBid
					}
				});

				if (auction.won.type === "buyout") {
					ownBuyouts = ownBuyouts.map(existingBuyout => {
						if (existingBuyout.claimed || auction.won.id !== existingBuyout.id) return existingBuyout;
						return {
							claimed: true,
							claimedDate: lib.evaluateFoundryTime(auctioneer),
							...existingBuyout
						}
					});
				}
			}
		}

		if (actor && itemsToCreate.length) {
			await game.itempiles.API.addItems(actor, itemsToCreate);
		}
		if (actor && (successfulAuctionCurrencies.length || failedBidCurrencies.length)) {
			let totalFee = "";
			let totalCurrenciesToAdd = "";
			const auctionFee = Math.max(0, flags.auctionFee ?? 0);
			for (const { price, deposit } of successfulAuctionCurrencies) {

				if (flags.auctionFee) {
					const fee = game.itempiles.API.calculateCurrencies(price, auctionFee / 100);
					totalFee = totalFee
						? game.itempiles.API.calculateCurrencies(totalFee, fee, false)
						: fee;
				}

				const currency = game.itempiles.API.calculateCurrencies(price, (100 - auctionFee) / 100);
				totalCurrenciesToAdd = totalCurrenciesToAdd
					? game.itempiles.API.calculateCurrencies(totalCurrenciesToAdd, currency, false)
					: currency;

				if (deposit) {
					totalCurrenciesToAdd = game.itempiles.API.calculateCurrencies(totalCurrenciesToAdd, deposit, false);
				}
			}

			for (const failedBidCurrency of failedBidCurrencies) {
				totalCurrenciesToAdd = totalCurrenciesToAdd
					? game.itempiles.API.calculateCurrencies(totalCurrenciesToAdd, failedBidCurrency, false)
					: failedBidCurrency;
			}

			await game.itempiles.API.addCurrencies(actor, totalCurrenciesToAdd);
			let message = `${totalCurrenciesToAdd} was added to ${actor.name}`;
			if (totalFee) {
				message += ` - ${totalFee} was claimed as auction fees.`;
			}
			ui.notifications.info(message);
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
		const duplicatedAuction = foundry.utils.duplicate(existingAuctions[indexToRefresh]);
		existingAuctions[indexToRefresh].claimed = true;
		duplicatedAuction.date = lib.evaluateFoundryTime(auctioneer)
		duplicatedAuction.expiryDate = lib.evaluateFoundryTime(auctioneer, duplicatedAuction.duration);
		const actor = get(actorDoc);
		const flags = get(auctioneerFlags);
		if (flags.auctionDeposit && duplicatedAuction.depositPrice) {
			const depositPriceData = lib.getPriceFromData(duplicatedAuction.depositPrice, actor);
			if (!depositPriceData.canBuy) {
				if (game.user.isGM) {
					const proceed = await Dialog.confirm({
						title: "Relist Failed Auction",
						content: `<p>${actor.name} can't afford the deposit of <strong>${duplicatedAuction.depositPrice}</strong> - are you sure you want to relist this auction?</p>`,
						options: { classes: ["dialog", "item-piles-auctioneer"] }
					});
					if (!proceed) return;
				} else {
					return Dialog.prompt({
						title: "Cannot Relist Failed Auction",
						content: `<p>You cannot relist this auction, as ${actor.name} cannot afford the deposit of <strong>${duplicatedAuction.depositPrice}</strong> to do so.</p>`,
						options: { classes: ["dialog", "item-piles-auctioneer"] }
					});
				}
			} else {
				if (game.user.isGM) {
					let ignoreDeposit = false;
					const proceed = await Dialog.confirm({
						title: "Relist Failed Auction",
						content: `
							<p>By relisting this auction, ${actor.name} must pay <strong>${duplicatedAuction.depositPrice}</strong> - are you sure you want to do this?</p>
							<p class="dialog-center"><input type="checkbox"><span>Ignore deposit payment</span></p>
						`,
						yes: (html) => {
							ignoreDeposit = html.find("input").is(":checked")
						},
						options: { classes: ["dialog", "item-piles-auctioneer"] }
					});
					if (!proceed) return;
					if (!ignoreDeposit) {
						await game.itempiles.API.removeCurrencies(actor, duplicatedAuction.depositPrice);
					}
				} else {
					const proceed = await Dialog.confirm({
						title: "Relist Failed Auction",
						content: `<p>By relisting this auction, ${actor.name} must pay <strong>${duplicatedAuction.depositPrice}</strong> - are you sure you want to do this?</p>`,
						options: { classes: ["dialog", "item-piles-auctioneer"] }
					});
					if (!proceed) return;
					await game.itempiles.API.removeCurrencies(actor, duplicatedAuction.depositPrice);
				}
			}
		}
		existingAuctions.push(duplicatedAuction);
		ui.notifications.notify(`The auction for ${auction.item.name} has been relisted.`);
		return game.user.setFlag(CONSTANTS.MODULE_NAME, CONSTANTS.AUCTIONS_FLAG, existingAuctions);
	}

	return {
		set,
		update,
		subscribe,
		unsubscribe,

		auctionItemStore,
		onDropData,
		newAuctionStore,

		searchClicked,
		decrementPage,
		incrementPage,
		setSortBy,
		entryClicked,
		bidOnItem,
		buyoutItem,

		createAuctions,
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
