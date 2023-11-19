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

	const now = evaluateFoundryTime(auctioneer);

	const hours = (date - now) / 1000 / 60 / 60;

	for (const [value, label] of relativeDateStrings) {
		if (hours <= value) return { value, label };
	}

	return {
		value: hours,
		label: Math.floor(hours / 24) + " day" + (Math.floor(hours / 24) > 1 ? "s" : "")
	};

}

export function getPriceFromData(priceFlag) {

	if (!priceFlag) {
		return {
			valid: false,
			currencies: [],
			totalPrice: 0
		};
	}

	const paymentData = game.itempiles.API.getPaymentData(priceFlag);

	return {
		...paymentData,
		valid: true,
		currencies: paymentData.finalPrices.filter(currency => currency.quantity),
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
	const defaults = foundry.utils.deepClone(CONSTANTS.ACTOR_DEFAULTS);
	return foundry.utils.mergeObject(defaults, actor ? actor.getFlag(CONSTANTS.ITEM_PILES_MODULE, "data") : {});
}


export function getCurrencies(actor) {

	const flags = getAuctioneerActorFlags(actor);

	const defaultCurrencies = foundry.utils.deepClone(game.itempiles.API.CURRENCIES).map(currency => {
		currency.quantity = 0;
		currency.secondary = false;
		return currency;
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

export function turnCurrenciesIntoString(currencies) {
	return currencies.filter(currencies => currencies.quantity)
		.reduce((acc, currency) => {
			return `${acc} ${currency.abbreviation.replace('{#}', currency.quantity)}`;
		}, "").trim();
}

export function isPriceHigherThan(priceDataA, priceDataB){
	if(priceDataA.primary){
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

	if(flags.timeType === CONSTANTS.AUCTION_TIME_TYPE_KEYS.REAL_TIME || !SimpleCalendar?.api) {
		if(duration === "now") return Date.now();
		const parts = [...duration.matchAll(DATE_REGEX)];
		const [_, number, dateType] = parts[0];
		return moment().add(Number(number), dateType).valueOf();
	}

	const currentTimestamp = SimpleCalendar.api.timestamp();
	if(duration === "now") return currentTimestamp;

	const parts = [...duration.matchAll(DATE_REGEX)];
	const [_, number, dateType] = parts[0];

	const newDateType = {
		"minutes": "minute",
		"hours": "hour",
		"days": "day",
		"months": "month",
		"years": "year",
	}[dateType] ?? dateType;

	return SimpleCalendar.api.timestampPlusInterval(currentTimestamp, {
		[newDateType]: Number(number)
	});
}

export function getUserAuctions(user = false){
	if(!user) user = game.user;
	return foundry.utils.deepClone(user.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.AUCTIONS_FLAG) ?? []);
}

export function getUserBids(user = false){
	if(!user) user = game.user;
	return foundry.utils.deepClone(user.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.BIDS_FLAG) ?? []);
}

export function getUserBuyouts(user = false){
	if(!user) user = game.user;
	return foundry.utils.deepClone(user.getFlag(CONSTANTS.MODULE_NAME, CONSTANTS.BUYOUTS_FLAG) ?? []);
}
