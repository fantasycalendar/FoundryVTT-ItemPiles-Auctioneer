import CONSTANTS from "~/constants.js";
import Auctioneer from "~/applications/auctioneer/auctioneer.js";
import moment from "moment";

export function auctioneerRendered(itemPile) {

	const auctioneer = itemPile?.actor ?? itemPile;

	const flags = auctioneer.getFlag("item-piles", 'data');

	if (flags?.type !== CONSTANTS.AUCTIONEER) return;

	Auctioneer.show({ auctioneer });

	return false;

}


export function getActiveApps(id, single = false) {
	const apps = Object.values(ui.windows).filter(app => {
		return app.id.startsWith(id) && app._state > Application.RENDER_STATES.CLOSED;
	});
	if (single) {
		return apps?.[0] ?? false;
	}
	return apps;
}


export function abbreviateNumbers(number, decPlaces = 2) {

	// 2 decimal places => 100, 3 => 1000, etc
	decPlaces = Math.pow(10, decPlaces)

	// Enumerate number abbreviations
	let abbrev = ['k', 'm', 'b', 't']

	// Go through the array backwards, so we do the largest first
	for (let i = abbrev.length - 1; i >= 0; i--) {

		// Convert array index to "1000", "1000000", etc
		let size = Math.pow(10, (i + 1) * 3)

		// If the number is bigger or equal do the abbreviation
		if (size <= number) {
			// Here, we multiply by decPlaces, round, and then divide by decPlaces.
			// This gives us nice rounding to a particular decimal place.
			number = Math.round((number * decPlaces) / size) / decPlaces

			// Handle special case where we round up to the next abbreviation
			if (number === 1000 && i < abbrev.length - 1) {
				number = 1
				i++
			}

			// Add the letter for the abbreviation
			number += abbrev[i]

			// We are done... stop
			break;
		}
	}

	return number
}


const relativeDateStrings = [
	[0, "Auction Failed"],
	[0.5, "Short"],
	[2, "Medium"],
	[12, "Long"],
	[24, "Very Long"],
]

export function dateNumberToRelativeString(auctioneer, date) {
	const flags = getAuctioneerActorFlags(auctioneer);

	const now = evaluateFoundryTime(auctioneer);

	if (flags.visibleTimeLeft) {
		const value = (date - now);
		return {
			value: value,
			label: value > 0 ? dateTimeToString(auctioneer, date, true) : "Auction Expired"
		}
	}

	const hours = (date - now) / 1000 / 60 / 60;

	for (const [value, label] of relativeDateStrings) {
		if (hours <= value) return { value, label };
	}

	return {
		value: hours,
		label: Math.floor(hours / 24) + " day" + (Math.floor(hours / 24) > 1 ? "s" : "")
	};

}

/**
 * @param {string} priceFlag
 * @param {boolean|Actor} actor
 * @returns {{basePriceString: string, valid: boolean, totalPrice: number, canBuy: boolean, currencies: *[]}|(*&{valid: boolean, totalPrice: *, currencies: *})}
 */
export function getPriceFromData(priceFlag, actor = false) {

	if (!priceFlag) {
		return {
			valid: false,
			canBuy: false,
			currencies: [],
			totalPrice: 0
		};
	}

	const paymentData = game.itempiles.API.getPaymentData(priceFlag, { target: actor });

	const currencies = paymentData.finalPrices.reverse();

	let primaryCurrency;
	for (const currency of currencies) {
		if (!currency.exchangeRate || currency.exchangeRate < 1) continue;
		if (currency.exchangeRate === 1) {
			primaryCurrency = currency;
		} else if (primaryCurrency && primaryCurrency.quantity >= (currency.exchangeRate * 1000)) {
			currency.quantity = Math.floor(primaryCurrency.quantity / currency.exchangeRate)
			primaryCurrency.quantity -= Math.floor(primaryCurrency.quantity / currency.exchangeRate) * currency.exchangeRate;
		}
	}

	return {
		...paymentData,
		valid: true,
		currencies: currencies.reverse().filter(currency => currency.quantity),
		totalPrice: paymentData.totalCurrencyCost + paymentData.finalPrices
			.filter(currency => currency.secondary && currency.quantity)
			.reduce((acc, currency) => {
				return acc + currency.quantity;
			}, 0)
	};

}

export function getValidCurrenciesForPrice(currencies) {

	const defaultIncomingCurrencies = currencies.filter(currency => !currency.secondary);

	const defaultCurrencies = defaultIncomingCurrencies.length > 0
		? game.itempiles.API.CURRENCIES.map(currency => {
			currency.quantity = 0;
			currency.secondary = false;
			return currency;
		}) : [];

	const secondaryIncomingCurrencies = currencies.filter(currency => currency.secondary);
	const secondaryCurrencies = game.itempiles.API.SECONDARY_CURRENCIES
		.filter(currency => secondaryIncomingCurrencies.some(inCurrency =>
			(currency.data.uuid && inCurrency.data.uuid && currency.data.uuid === inCurrency.data.uuid)
			|| (currency.data.path && inCurrency.data.path && currency.data.path === inCurrency.data.path))
		).map(currency => {
			currency.quantity = 0;
			currency.secondary = true;
			return currency;
		});

	return defaultCurrencies.concat(secondaryCurrencies)

}

/**
 * @param {Actor} actor
 * @returns {ActorFlagDefaults}
 */
export function getAuctioneerActorFlags(actor) {
	return foundry.utils.mergeObject(
		foundry.utils.deepClone(CONSTANTS.ACTOR_DEFAULTS),
		game.itempiles.API.getActorFlagData(actor)
	);
}


export function getCurrencies(actor) {

	const flags = getAuctioneerActorFlags(actor);

	const defaultCurrencies = foundry.utils.deepClone(game.itempiles.API.CURRENCIES).map(currency => {
		currency.quantity = 0;
		currency.secondary = false;
		return currency;
	}).filter(currency => {
		return !flags.showOnlyPrimaryCurrency || currency.primary;
	});

	const secondaryCurrencies = flags.allowSecondaryCurrencies
		? foundry.utils.deepClone(game.itempiles.API.SECONDARY_CURRENCIES).map(currency => {
			currency.quantity = 0;
			currency.secondary = true;
			return currency;
		})
		: [];

	return defaultCurrencies.concat(secondaryCurrencies);

}

export function turnCurrenciesIntoString(currencies, abbreviate = false) {
	return currencies.filter(currencies => currencies.quantity)
		.reduce((acc, currency) => {
			const quantity = abbreviate ? abbreviateNumbers(currency.quantity) + " " : currency.quantity;
			return `${acc} ${currency.abbreviation.replace('{#}', quantity)}`;
		}, "").trim();
}

export function isPriceHigherThan(priceDataA, priceDataB) {
	if (priceDataA.primary) {
		return priceDataA.totalPrice >= priceDataB.totalPrice;
	}
	const mixedPrices = priceDataB.currencies.map(currencyB => {
		const currencyA = priceDataA.currencies.find(currencyA => currencyA.id === currencyB.id) ?? { quantity: -Infinity };
		return [currencyA, currencyB];
	})
	return mixedPrices.some(([currencyA, currencyB]) => currencyA.quantity >= currencyB.quantity);
}

const DATE_REGEX = new RegExp("^(\\d+)(\\w+)$", "g")

export function evaluateFoundryTime(auctioneer, duration = "now") {
	const flags = getAuctioneerActorFlags(auctioneer);

	if (flags.timeType === CONSTANTS.AUCTION_TIME_TYPE_KEYS.REAL_TIME || !window?.SimpleCalendar?.api) {
		if (duration === "now") return Date.now();
		const parts = [...duration.matchAll(DATE_REGEX)];
		const [_, number, dateType] = parts[0];
		return moment().add(Number(number), dateType).valueOf();
	}

	const currentTimestamp = window?.SimpleCalendar.api.timestamp();
	if (duration === "now") return currentTimestamp;

	const parts = [...duration.matchAll(DATE_REGEX)];
	const [_, number, dateType] = parts[0];

	const newDateType = {
		"minutes": "minute",
		"hours": "hour",
		"days": "day",
		"months": "month",
		"years": "year",
	}[dateType] ?? dateType;

	return window?.SimpleCalendar.api.timestampPlusInterval(currentTimestamp, {
		[newDateType]: Number(number)
	});
}

export function dateTimeToString(auctioneer, datetime, relative = false) {

	const flags = getAuctioneerActorFlags(auctioneer);

	if (flags.timeType === CONSTANTS.AUCTION_TIME_TYPE_KEYS.REAL_TIME || !window?.SimpleCalendar?.api) {
		const diffDate = moment(datetime);
		return relative ? capitalize(moment.duration(diffDate.diff(moment())).humanize()) : diffDate.format("Y-M-D - HH:mm:ss")
	}

	if (relative) {
		const currentTimestamp = window?.SimpleCalendar.api.timestamp();
		const interval = Object.entries(window?.SimpleCalendar.api.secondsToInterval(datetime - currentTimestamp)).filter(e => e[1])
		const biggestInterval = interval[interval.length - 1];
		let [label, value] = biggestInterval;
		label = pluralize(label, value > 1);
		return `${value} ${label}`
	}

	const timestamp = window?.SimpleCalendar.api.timestampToDate(datetime);
	return `${timestamp.display.year}-${timestamp.display.month}-${timestamp.display.day} - ${timestamp.display.time}`;

}

function capitalize(str) {
	return str.slice(0, 1).toUpperCase() + str.slice(1);
}

function pluralize(str, doPluralize = true) {
	if (doPluralize) {
		return str.endsWith("s") ? str : str + "s";
	}
	return str.endsWith("s") ? str.slice(0, -1) : str;
}

export function getUserAuctions(user = false) {
	if (!user) user = game.user;
	return foundry.utils.deepClone(user.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.AUCTIONS_FLAG) ?? []);
}

export function getUserBids(user = false) {
	if (!user) user = game.user;
	return foundry.utils.deepClone(user.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.BIDS_FLAG) ?? []);
}

export function getUserBuyouts(user = false) {
	if (!user) user = game.user;
	return foundry.utils.deepClone(user.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.BUYOUTS_FLAG) ?? []);
}

export function getItemColorElement(item) {
	const color = game.modules.get("rarity-colors")?.active && game.modules.get("rarity-colors")?.api
		? game.modules.get("rarity-colors").api.getColorFromItem(item)
		: false;
	const rarity = capitalize(CONFIG?.DND5E?.itemRarity?.[item?.system?.rarity] ?? "");
	return color ? `<i class="fas fa-circle rarity" data-tooltip="${rarity}" style="color: ${color};"></i> ` : "";
}

export function evaluateFormula(formula, data, warn = false) {
	const rollFormula = Roll.replaceFormulaData(formula, data, { warn });
	return new Roll(rollFormula).evaluate({ async: false });
}

export function isActiveGM(user) {
	return user.active && user.isGM;
}

export function getActiveGMs() {
	return game.users.filter(isActiveGM);
}

export function isResponsibleGM() {
	if (!game.user.isGM) {
		return false;
	}
	return !getActiveGMs().some(other => other.id < game.user.id);
}

function cleanUserFlags(acc, entry, flagPath) {
	const userEntries = acc[entry.userId] ?? game.users.get(entry.userId).getFlag(CONSTANTS.MODULE_NAME, flagPath);
	if (userEntries.length) {
		const auctionIndex = userEntries.findIndex(userAuction => userAuction.uuid === entry.uuid);
		userEntries.splice(auctionIndex, 1);
		acc[entry.userId] = {
			[`flags.${CONSTANTS.MODULE_NAME}.${flagPath}`]: userEntries
		};
	}
	return acc;
}


export function getLogData(auctioneer) {

	const flags = getAuctioneerActorFlags(auctioneer);

	const auctioneerAuctionsData = auctioneer.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.AUCTIONS_FLAG) ?? [];
	const auctioneerBidsData = auctioneer.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.BIDS_FLAG) ?? [];
	const auctioneerBuyoutsData = auctioneer.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.BUYOUTS_FLAG) ?? [];

	const { auctions, bids, buyouts} = getAuctioneerData(auctioneer);

	const claimedAuctions = auctions.filter(auction => auction.claimed && auction.origin === "user").map(auction => auction._source);
	const claimedBids = bids.filter(bid => bid.claimed && bid.origin === "user").map(bid => bid._source);
	const claimedBuyouts = buyouts.filter(buyout => buyout.claimed && buyout.origin === "user").map(buyout => buyout._source);

	let recipientCurrencies = "";
	const actorUpdates = {};
	if (claimedAuctions.length) {

		if (!actorUpdates["_id"]) actorUpdates["_id"] = auctioneer.id;
		actorUpdates[CONSTANTS.AUCTIONS_FULL_FLAG] = auctioneerAuctionsData.concat(claimedAuctions);

		for (const claimedAuction of claimedAuctions) {
			if (!claimedAuction.won) {
				recipientCurrencies = recipientCurrencies && claimedAuction.depositPrice
					? game.itempiles.API.calculateCurrencies(recipientCurrencies, claimedAuction.depositPrice, false)
					: claimedAuction.depositPrice || recipientCurrencies;
			} else if (flags.auctionFee) {
				const auctionFee = Math.max(0, flags.auctionFee ?? 0);
				const fee = game.itempiles.API.calculateCurrencies(price, auctionFee / 100);
				recipientCurrencies = recipientCurrencies
					? game.itempiles.API.calculateCurrencies(recipientCurrencies, fee, false)
					: fee;
			}
		}
	}

	if (claimedBids.length) {
		if (!actorUpdates["_id"]) actorUpdates["_id"] = auctioneer.id;
		actorUpdates[CONSTANTS.BIDS_FULL_FLAG] = auctioneerBidsData.concat(claimedBids)
	}
	if (claimedBuyouts.length) {
		if (!actorUpdates["_id"]) actorUpdates["_id"] = auctioneer.id;
		actorUpdates[CONSTANTS.BUYOUTS_FULL_FLAG] = auctioneerBuyoutsData.concat(claimedBuyouts)
	}

	let userUpdates = {};
	const userAuctionUpdates = claimedAuctions.reduce((acc, auction) => {
		return cleanUserFlags(acc, auction, CONSTANTS.AUCTIONS_FLAG);
	}, {});
	if (!foundry.utils.isEmpty(userAuctionUpdates)) {
		userUpdates = foundry.utils.mergeObject(userUpdates, userAuctionUpdates);
	}

	const userBidUpdates = claimedBids.reduce((acc, bid) => {
		return cleanUserFlags(acc, bid, CONSTANTS.BIDS_FLAG);
	}, {})
	if (!foundry.utils.isEmpty(userBidUpdates)) {
		userUpdates = foundry.utils.mergeObject(userUpdates, userBidUpdates);
	}

	const userBuyoutUpdates = claimedBuyouts.reduce((acc, buyout) => {
		return cleanUserFlags(acc, buyout, CONSTANTS.BUYOUTS_FLAG);
	}, {})
	if (!foundry.utils.isEmpty(userBuyoutUpdates)) {
		userUpdates = foundry.utils.mergeObject(userUpdates, userBuyoutUpdates);
	}

	userUpdates = Object.entries(userUpdates).map(([userId, updates]) => {
		return {
			_id: userId,
			...updates
		}
	})

	const currentDatetime = evaluateFoundryTime(auctioneer);

	const auctionLogs = auctions
		.reduce((acc, auction, index) => {
			if (!acc[auction.id]) {
				acc[auction.id] = {
					data: auction,
					type: "AuctionLog",
					id: auction.id,
					date: auction.date,
					visible: true,
					priority: index
				};
			}
			if (auction.expired && !auction.cancelled) {
				if (!auction.won && !acc[auction.id + "-expired"]) {
					acc[auction.id + "-expired"] = {
						data: auction,
						type: "ExpiredAuctionLog",
						id: auction.id + "-expired",
						date: auction.expiryDate,
						visible: true,
						priority: index
					};
				}
				if (auction.claimed && currentDatetime >= auction.claimedDate && !acc[auction.id + "-claimed"]) {
					acc[auction.id + "-claimed"] = {
						data: auction,
						type: "ClaimedAuctionLog",
						id: auction.id + "-claimed",
						date: auction.claimedDate,
						visible: true,
						priority: index
					};
				}
			}
			if (auction.cancelled && auction.claimed && currentDatetime >= auction.claimedDate && !acc[auction.id + "-cancelled"]) {
				acc[auction.id + "-cancelled"] = {
					data: auction,
					type: "CancelledAuctionLog",
					id: auction.id + "-cancelled",
					date: auction.claimedDate,
					visible: true,
					priority: index
				};
			}
			return acc;
		}, {});

	const bidLogs = bids.reduce((acc, bid, index) => {
		if (acc[bid.id]) return acc;
		acc[bid.id] = {
			data: bid,
			type: "BidLog",
			id: bid.id,
			date: bid.date,
			visible: true,
			priority: index
		}
		return acc;
	}, {});

	const buyoutLogs = buyouts.reduce((acc, buyout, index) => {
		if (acc[buyout.id]) return acc;
		acc[buyout.id] = {
			data: buyout,
			type: "BuyoutLog",
			id: buyout.id,
			date: buyout.date,
			visible: true,
			priority: index
		}
		return acc;
	}, {});

	return {
		logs: Object.values(auctionLogs)
			.concat(Object.values(bidLogs))
			.concat(Object.values(buyoutLogs))
			.map((entry, index) => ({
				index, ...entry
			}))
			.sort((a, b) => {
				return b.date === a.date
					? (a.priority === b.priority ? b.index - a.index : a.priority - b.priority)
					: b.date - a.date;
			}),
		userUpdates,
		actorUpdates,
		recipientCurrencies
	};

}

/**
 * @typedef {Object} AuctionData
 * @property {Object<Auction>} auctionsMap
 * @property {Array<Auction>} auctions
 * @property {Array<Bid>} bids
 * @property {Array<Buyout>} buyouts
 */

/**
 * @param {Actor} auctioneer
 * @return {AuctionData}
 */
export function getAuctioneerData(auctioneer) {

	const flags = getAuctioneerActorFlags(auctioneer);

	const auctions = {};
	const bids = {};
	const buyouts = {};

	const { auctionFlags, bidFlags, buyoutFlags } = game.users.reduce((acc, user) => {
		const userAuctions = getUserAuctions(user);
		const userBids = getUserBids(user);
		const userBuyouts = getUserBuyouts(user);
		return {
			auctionFlags: acc.auctionFlags.concat(userAuctions),
			bidFlags: acc.bidFlags.concat(userBids),
			buyoutFlags: acc.buyoutFlags.concat(userBuyouts),
		}
	}, { auctionFlags: [], bidFlags: [], buyoutFlags: [] });

	auctionFlags.sort((a, b) => b.date - a.date);
	bidFlags.sort((a, b) => b.date - a.date);
	buyoutFlags.sort((a, b) => b.date - a.date);

	const auctioneerAuctionsData = auctioneer.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.AUCTIONS_FLAG) ?? [];
	const auctioneerBuyoutsData = auctioneer.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.BUYOUTS_FLAG) ?? [];
	const auctioneerBidsData = auctioneer.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.BIDS_FLAG) ?? [];

	auctionFlags.filter(source => {
		return source.uuid.endsWith(auctioneer.uuid + "-" + source.userId);
	}).forEach(source => {
		const auction = makeAuction(auctioneer, source, flags);
		auction.origin = "user";
		auctions[auction.uuid] = auction;
	});

	auctioneerAuctionsData.filter(source => {
		return source.uuid.endsWith(auctioneer.uuid + "-" + source.userId);
	}).forEach(source => {
		const auction = makeAuction(auctioneer, source, flags);
		auction.origin = "auctioneer";
		auctions[auction.uuid] = auction;
	});

	buyoutFlags.filter(source => {
		return source.auctionUuid.includes("-" + auctioneer.uuid + "-") && auctions[source.auctionUuid];
	}).forEach(source => {
		const buyout = makeBuyout(auctioneer, source, auctions, flags);
		buyout.origin = "user";
		buyouts[buyout.id] = buyout;
	});

	auctioneerBuyoutsData.filter(source => {
		return source.auctionUuid.includes("-" + auctioneer.uuid + "-") && auctions[source.auctionUuid];
	}).forEach(source => {
		const buyout = makeBuyout(auctioneer, source, auctions, flags);
		buyout.origin = "auctioneer";
		buyouts[buyout.id] = buyout;
	});

	bidFlags.filter(source => {
		return source.auctionUuid.includes("-" + auctioneer.uuid + "-")
			&& auctions[source.auctionUuid]
			&& !auctions[source.auctionUuid].won;
	}).forEach(source => {
		const bid = makeBid(auctioneer, source, auctions, flags);
		bid.origin = "user";
		bids[bid.id] = bid;
	});

	auctioneerBidsData.filter(source => {
		return source.auctionUuid.includes("-" + auctioneer.uuid + "-")
			&& auctions[source.auctionUuid]
			&& !auctions[source.auctionUuid].won;
	}).forEach(source => {
		const bid = makeBid(auctioneer, source, auctions, flags);
		bid.origin = "auctioneer";
		bids[bid.id] = bid;
	});

	for (const auction of Object.values(auctions)) {

		auction.bids.sort((a, b) => b.priceData.totalPrice - a.priceData.totalPrice);

		const ownedBids = auction.bids.filter(bid => bid.user === game.user);

		auction.bidPriceData = auction.bidVisibility === CONSTANTS.VISIBILITY_KEYS.VISIBLE || auction.user === game.user
			? (auction.bids.length ? auction.bids[0].priceData : auction.startPriceData)
			: (ownedBids.length ? ownedBids[0].priceData : auction.startPriceData);

		auction.bidPrice = auction.bidVisibility === CONSTANTS.VISIBILITY_KEYS.VISIBLE || auction.user === game.user
			? (auction.bids.length ? auction.bids[0].price : false)
			: (ownedBids.length ? ownedBids[0].price : false);

		auction.actualMininumBidPrice = auction.minBidPrice && auction.bidPrice
			? game.itempiles.API.calculateCurrencies(auction.bidPrice, auction.minBidPrice, false)
			: auction.bidPrice;

		auction.actualMininumBidPriceData = getPriceFromData(auction.actualMininumBidPrice);

		if (auction.bids.length && auction.buyoutPrice && isPriceHigherThan(auction.bids[0].priceData, auction.buyoutPriceData)) {
			auction.buyoutPriceData = false;
		}

		if (auction.won) {
			if (auction.user === game.user) {
				auction.timeLeft = {
					label: "Auction Succeeded",
					value: Infinity
				}
			}
			auction.highBidder = (auction.won.displayName || "Unknown") + " (buyout)";
		} else {
			auction.highBidder = auction.bids?.[0]?.displayName;
			if (auction.expired && auction.bids.length) {
				if (!auction.reservePrice || !isPriceHigherThan(auction.bids[0].priceData, auction.reservePriceData)) {
					auction.won = auction.bids[0];
					if (auction.user === game.user) {
						auction.timeLeft = {
							label: "Auction Succeeded",
							value: Infinity
						}
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


export function makeAuction(auctioneer, source, flags) {
	const auction = {};
	auction._source = foundry.utils.mergeObject(foundry.utils.deepClone(CONSTANTS.DEFAULTS.AUCTION), source);
	auction.type = "auction";
	auction.id = auction._source.id;
	auction.uuid = auction._source.uuid;
	auction.actorUuid = auction._source.actorUuid;
	auction.cancelled = auction._source.cancelled;
	auction.claimed = auction._source.claimed;
	auction.gmClaimed = auction._source.gmClaimed;
	auction.item = new Item.implementation(auction._source.itemData)
	auction.user = game.users.get(auction._source.userId) ?? false;
	auction.actor = auction._source.actorUuid ? fromUuidSync(auction._source.actorUuid) ?? false : false;
	auction.date = auction._source.date;
	auction.claimedDate = auction._source.claimedDate;
	auction.expiryDate = auction._source.expiryDate;
	auction.expired = evaluateFoundryTime(auctioneer) >= auction._source.expiryDate;
	auction.timeLeft = dateNumberToRelativeString(auctioneer, auction._source.expiryDate);
	auction.quantity = auction._source.quantity;
	auction.bidVisibility = auction._source.bidVisibility;
	auction.startPrice = auction._source.startPrice;
	auction.buyoutPrice = auction._source.buyoutPrice;
	auction.reservePrice = auction._source.reservePrice;
	auction.minBidPrice = auction._source.minBidPrice;
	auction.depositPrice = auction._source.depositPrice;

	auction.displayName = flags.showActorName
		? auction.actor?.name ?? auction.user?.name ?? "Unknown"
		: auction.user?.name ?? auction.actor?.name ?? "Unknown";

	auction.startPriceData = getPriceFromData(auction._source.startPrice);
	auction.buyoutPriceData = getPriceFromData(auction._source.buyoutPrice);
	auction.reservePriceData = getPriceFromData(auction._source.reservePrice);
	auction.minBidPriceData = getPriceFromData(auction._source.minBidPrice);
	auction.depositPriceData = getPriceFromData(auction._source.depositPrice);

	auction.won = false;
	auction.bids = [];
	auction.bidPriceData = false;
	auction.highestOwnedBid = false;
	return auction;
}

export function makeBuyout(auctioneer, source, auctions, flags) {
	const buyout = {};
	buyout._source = foundry.utils.mergeObject(foundry.utils.deepClone(CONSTANTS.DEFAULTS.BUYOUT), source);
	buyout.type = "buyout";
	buyout.id = buyout._source.id;
	buyout.date = buyout._source.date;
	buyout.user = game.users.get(buyout._source.userId) ?? false;
	buyout.actorUuid = buyout._source.actorUuid;
	buyout.actor = buyout._source.actorUuid ? fromUuidSync(buyout._source.actorUuid) ?? false : false;
	buyout.priceData = getPriceFromData(buyout._source.price);
	buyout.price = buyout._source.price;
	buyout.claimed = buyout._source.claimed;
	buyout.auctionUuid = buyout._source.auctionUuid;
	buyout.auction = auctions[buyout._source.auctionUuid];
	buyout.auction.won = buyout;
	buyout.displayName = flags.showActorName
			? buyout.actor?.name ?? buyout.user?.name ?? "Unknown"
			: buyout.user?.name ?? buyout.actor?.name ?? "Unknown";
	return buyout;
}

export function makeBid(auctioneer, source, auctions, flags) {
	const bid = {};
	bid._source = foundry.utils.mergeObject(foundry.utils.deepClone(CONSTANTS.DEFAULTS.BID), source);
	bid.type = "bid";
	bid.id = bid._source.id;
	bid.date = bid._source.date;
	bid.user = game.users.get(bid._source.userId) ?? false;
	bid.actorUuid = bid._source.actorUuid;
	bid.actor = bid._source.actorUuid ? fromUuidSync(bid._source.actorUuid) ?? false : false;
	bid.priceData = getPriceFromData(bid._source.price);
	bid.price = bid._source.price;
	bid.claimed = bid._source.claimed;
	bid.bidStatus = { value: -Infinity, label: "Low Bid" };
	bid.auctionUuid = bid._source.auctionUuid;
	bid.auction = auctions[bid._source.auctionUuid];
	if(bid.auction) {
		bid.auction.bids.push(bid);
	}else{
		console.warn(`Could not find auction for bid ${bid._source.id} and auction ${bid._source.auctionUuid} on user ${bid.user.name}!`);
	}
	bid.displayName = flags.showActorName
		? bid.actor?.name ?? bid.user?.name ?? "Unknown"
		: bid.user?.name ?? bid.actor?.name ?? "Unknown";
	return bid;
}

export async function migrateData(auctioneer = false) {

	if (!game.user.isGM) return;

	const auctioneersActors = auctioneer ? [auctioneer] : game.actors
		.filter(actor => {
			return actor.getFlag("item-piles", 'data')?.type === CONSTANTS.AUCTIONEER;
		})

	const auctioneers = auctioneersActors
		.map(auctioneer => {
			const flags = getAuctioneerActorFlags(auctioneer);
			const { userUpdates, actorUpdates, recipientCurrencies } = getLogData(auctioneer);
			const recipient = flags.owner?.uuid ? fromUuidSync(flags.owner?.uuid) ?? auctioneer : auctioneer;
			return {
				id: auctioneer.id,
				userUpdates,
				actorUpdates,
				recipientCurrencies,
				recipient
			}
		})
		.filter(data => {
			return !foundry.utils.isEmpty(data.actorUpdates) || data.userUpdates.length || data.recipientCurrencies;
		});

	if (!auctioneers.length) return;

	const actorUpdates = auctioneers.map(auctioneer => auctioneer.actorUpdates);
	const userUpdates = auctioneers.map(auctioneer => auctioneer.userUpdates)
		.deepFlatten()
		.reduce((acc, update) => {
			const foundIndex = acc.findIndex(pastUpdate => pastUpdate._id === update._id);
			if (foundIndex > -1) {
				acc[foundIndex] = foundry.utils.mergeObject(acc[foundIndex], update);
			} else {
				acc.push(update);
			}
			return acc;
		}, []);

	await Actor.updateDocuments(actorUpdates)
	await User.updateDocuments(userUpdates);
	for (const auctioneer of auctioneers) {
		if (!auctioneer.recipientCurrencies) continue;
		await game.itempiles.API.addCurrencies(auctioneer.recipient, auctioneer.recipientCurrencies);
	}

}
