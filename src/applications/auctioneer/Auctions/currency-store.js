import { get, writable } from "svelte/store";
import { getCurrencies } from "~/lib.js";

export default function CurrencyStore(store) {

	const currencies = getCurrencies(store.auctioneer);

	const currencyStore = writable({
		primaryCurrencies: currencies.filter(currency => !currency.secondary),
		secondaryCurrencies: currencies.filter(currency => currency.secondary),
		activeCurrencies: []
	});

	const { set, update, subscribe } = currencyStore;

	function reset(){
		update(data => {
			data.primaryCurrencies = data.primaryCurrencies.map(currency => {
				currency.quantity = 0;
				return currency;
			})
			data.secondaryCurrencies = data.secondaryCurrencies.map(currency => {
				currency.quantity = 0;
				return currency;
			})
			return data;
		})
	}

	function exportCurrencies() {
		const data = get(currencyStore);
		return data.activeCurrencies;
	}

	return {
		set,
		update,
		subscribe,
		reset,
		exportCurrencies
	}

}
