<script>

	import { getContext } from "svelte";
	import { get, writable } from "svelte/store";
	import DropZone from "~/applications/auctioneer/Components/DropZone.svelte";
	import CurrencyList from "~/applications/auctioneer/Auctions/CurrencyList.svelte";
	import CONSTANTS from "~/constants.js";
	import { getCurrencies, getPriceFromData } from "~/lib.js";
	import CurrencyStore from "~/applications/auctioneer/Auctions/currency-store.js";
	import ReactiveButton from "~/applications/auctioneer/Components/ReactiveButton.svelte";

	const store = getContext("store");

	const flagStore = store.auctioneerFlags;
	const flags = get(flagStore);

	const itemDocStore = store.auctionItemStore;
	const actorDoc = store.actorDoc;
	const newAuctionStore = store.newAuctionStore;

	let showPrice = "bids";
	const useSecondaryCurrencies = writable(false);
	const currencies = getCurrencies(store.auctioneer);
	const hasSecondaryCurrencies = currencies.some(currency => currency.secondary);

	const bidCurrencies = CurrencyStore(store);
	const buyoutCurrencies = CurrencyStore(store);
	const minBidCurrencies = CurrencyStore(store);
	const reserveCurrencies = CurrencyStore(store);
	const bidVisibility = writable(flags.auctionBidVisibility === "user" ? "visible" : flags.auctionBidVisibility);
	const reserveLimitVisibility = writable(flags.reserveLimitVisibility === "user" ? "visible" : flags.reserveLimitVisibility);

	const auctionTimeLimitsKeys = Object.keys(CONSTANTS.AUCTION_TIME_LIMITS);
	let validTimeLimits = [];
	$: {
		const minIndex = auctionTimeLimitsKeys.indexOf($flagStore.minTimeLimit);
		const maxIndex = Math.max(minIndex, auctionTimeLimitsKeys.indexOf($flagStore.maxTimeLimit));
		validTimeLimits = Object.entries(CONSTANTS.AUCTION_TIME_LIMITS).filter((_, index) => {
			return index >= minIndex && index <= maxIndex;
		});
	}

	let baseDepositPrice;
	let depositCurrenciesString;
	let depositCurrencies;
	$: {
		baseDepositPrice = $newAuctionStore.depositPrice && $newAuctionStore.quantityPerAuction
			? game.itempiles.API.calculateCurrencies(getPriceFromData($newAuctionStore.depositPrice)?.basePriceString, $newAuctionStore.quantityPerAuction, false) ?? false
			: false;
		depositCurrenciesString = baseDepositPrice
			? game.itempiles.API.calculateCurrencies(baseDepositPrice, $newAuctionStore.numAuctions, false) ?? false
			: false;
		depositCurrencies = depositCurrenciesString
			? getPriceFromData(depositCurrenciesString, $actorDoc)
			: false;
	}

	const durationStore = writable(get(flagStore).minTimeLimit);

	function setMaxAuctions() {
		newAuctionStore.update(data => {
			data.numAuctions = game.itempiles.API.getItemQuantity($itemDocStore);
			data.quantityPerAuction = 1;
			return data;
		});
	}

	function setMaxPerAuction() {
		const itemQuantity = game.itempiles.API.getItemQuantity($itemDocStore);
		newAuctionStore.update(data => {
			data.quantityPerAuction = Math.max(1, Math.floor(itemQuantity / data.numAuctions));
			return data;
		});
	}

	function numAuctionsChanged() {
		const itemQuantity = game.itempiles.API.getItemQuantity($itemDocStore);
		newAuctionStore.update(data => {
			data.numAuctions = Math.min(data.numAuctions, itemQuantity);
			data.quantityPerAuction = Math.min(data.quantityPerAuction, Math.floor(itemQuantity / data.numAuctions));
			return data;
		});
	}

	function numQuantityPerAuctionChanged() {
		const itemQuantity = game.itempiles.API.getItemQuantity($itemDocStore);
		newAuctionStore.update(data => {
			data.quantityPerAuction = Math.min(data.quantityPerAuction, itemQuantity);
			data.numAuctions = Math.min(data.numAuctions, Math.floor(itemQuantity / data.quantityPerAuction));
			return data;
		});
	}

	async function createAuctions(withoutDeposit = false) {
		const result = await store.createAuctions({
			numAuctions: $newAuctionStore.numAuctions,
			quantityPerAuction: $newAuctionStore.quantityPerAuction,
			itemData: $newAuctionStore.itemData,
			uuid: $newAuctionStore.uuid,
			priceIsPerQuantity: $newAuctionStore.priceIsPerQuantity,
			baseDepositPrice: withoutDeposit ? false : baseDepositPrice,
			depositPrice: withoutDeposit ? false : depositCurrenciesString,
			bidVisibility: $bidVisibility,
			reserveLimitVisibility: $reserveLimitVisibility,
			bidCurrencies: bidCurrencies.exportCurrencies(),
			buyoutCurrencies: buyoutCurrencies.exportCurrencies(),
			minBidCurrencies: minBidCurrencies.exportCurrencies(),
			reserveCurrencies: reserveCurrencies.exportCurrencies(),
			duration: $durationStore
		});
		if (!result) return;
		itemDocStore.set(undefined);
		newAuctionStore.set({
			itemData: false,
			numAuctions: 1,
			quantityPerAuction: 1,
			hiddenQuantity: false,
			priceIsPerQuantity: false,
			uuid: false,
			depositPrice: false,
		});
		bidCurrencies.reset();
		buyoutCurrencies.reset();
		minBidCurrencies.reset();
		reserveCurrencies.reset();
	}

</script>


<div class="create-auctions-sidebar">

	<div class="create-auctions">

		<span class="auction-title" style="font-size: 1rem;">Auction Item</span>
		<DropZone callback={store.onDropData} class="item-container">
			<img class="item-image" src={$itemDocStore ? $itemDocStore.img : "icons/svg/coins.svg"}/>
			{$itemDocStore ? $itemDocStore.name : "Drag & drop item"}
		</DropZone>
		{#if !$newAuctionStore.hiddenQuantity}
			<div class="stack-container auction-border-top">
				<div class="auction-title">Num. Auctions</div>
				<input bind:value={$newAuctionStore.numAuctions} disabled={!$itemDocStore || $newAuctionStore.hiddenQuantity}
				       on:change={numAuctionsChanged}
				       type="number"/>
				<button disabled={!$itemDocStore || $newAuctionStore.hiddenQuantity} on:click={setMaxAuctions} type="button">
					Max
				</button>
				<span class="auction-title">Qty/Auctions</span>
				<input type="number" bind:value={$newAuctionStore.quantityPerAuction}
				       disabled={!$itemDocStore || $newAuctionStore.hiddenQuantity}
				       on:change={numQuantityPerAuctionChanged}/>
				<button type="button" on:click={setMaxPerAuction} disabled={!$itemDocStore || $newAuctionStore.hiddenQuantity}>
					Max
				</button>
			</div>
			<div class="auction-title"
			     data-tooltip="When enabled, this makes the price of the auction be multiplied by the quantity of the item in that auction"
			     data-tooltip-direction="UP">
				<span>Price is per quantity:</span>
				<input bind:checked={$newAuctionStore.priceIsPerQuantity} type="checkbox"
				       disabled={!$itemDocStore || $newAuctionStore.hiddenQuantity}/>
			</div>
		{:else}
			<div class="auction-border-top">
				<div class="auction-title small-warning">Item cannot be stacked, only 1 auction can be created at a time.</div>
			</div>
		{/if}
		{#if $flagStore.allowSecondaryCurrencies && hasSecondaryCurrencies}
			<div class="auction-title auction-border-top" data-tooltip-direction="UP"
			     data-tooltip="When enabled, this switches the currencies for this auction to use the alternative currencies">
				<input bind:checked={$useSecondaryCurrencies} type="checkbox"/> Use Other Currencies
			</div>
		{/if}
		{#if $flagStore.auctionDeposit}
			<div class="auction-title auction-border-top auction-deposit" data-tooltip-direction="UP"
			     data-tooltip="The amount you must pay in order to create this auction. If the auction succeeds, you get this back.">
				<span>Auction deposit:</span>
				<span
					class:cant-afford={depositCurrencies && !depositCurrencies.canBuy}>{depositCurrenciesString || "None"}</span>
			</div>
		{/if}
		{#if $flagStore.auctionBidVisibility === CONSTANTS.VISIBILITY_KEYS.USER}
			<div class="auction-title auction-border-top" data-tooltip-direction="UP"
			     data-tooltip="This setting makes bids either visible or blind - the latter meaning people can only see their own bids">
				Bids Visibility
			</div>
		{/if}
		{#if $flagStore.auctionBidVisibility === CONSTANTS.VISIBILITY_KEYS.USER}
			<div class="auction-title auction-visibility">
				<div>
					<input id="visible-bid-input" type="radio" bind:group={$bidVisibility}
					       value={CONSTANTS.VISIBILITY_KEYS.VISIBLE}/>
					<label for="visible-bid-input">Visible</label>
				</div>
				<div>
					<input id="hidden-bid-input" type="radio" bind:group={$bidVisibility}
					       value={CONSTANTS.VISIBILITY_KEYS.HIDDEN}/>
					<label for="hidden-bid-input">Hidden</label>
				</div>
			</div>
		{:else if $flagStore.auctionBidVisibility === CONSTANTS.VISIBILITY_KEYS.VISIBLE}
			<div class="auction-title auction-border-top" data-tooltip-direction="UP"
			     data-tooltip="Bids for this auction will always be visible">
				<span>Visible Bids</span>
			</div>
		{:else if $flagStore.auctionBidVisibility === CONSTANTS.VISIBILITY_KEYS.HIDDEN}
			<div class="auction-title auction-border-top" data-tooltip-direction="UP"
			     data-tooltip="Bids for this auction will always be blind - people can only see their own bids">
				<span>Hidden Bids</span>
			</div>
		{/if}
		<div class="price-currencies-container-pair auction-border-top">
			<CurrencyList bind:showPrice clickable={$flagStore.enableMinimumBid || $flagStore.enableReserveLimit}
			              currencyStore={bidCurrencies} label="Starting Bid" name="bids"
			              tooltip="Starting price for bids" {useSecondaryCurrencies}/>
			<CurrencyList bind:showPrice caret={$flagStore.enableMinimumBid || $flagStore.enableReserveLimit}
			              clickable={$flagStore.enableMinimumBid || $flagStore.enableReserveLimit}
			              currencyStore={buyoutCurrencies} label="Buyout Price"
			              name="bids"
			              tooltip="Price to pay to instantly win this auction" {useSecondaryCurrencies}/>
		</div>
		{#if $flagStore.enableMinimumBid || $flagStore.enableReserveLimit}
			<div class="price-currencies-container-pair auction-border-top">
				{#if $flagStore.enableMinimumBid}
					<CurrencyList bind:showPrice currencyStore={minBidCurrencies} label="Minimum Bid" name="minmax"
					              tooltip="This is the minimum amount someone must pay to be able to bid on this auction"
					              {useSecondaryCurrencies} caret={!$flagStore.enableReserveLimit}/>
				{/if}
				{#if $flagStore.enableReserveLimit}
					<CurrencyList bind:showPrice currencyStore={reserveCurrencies} label="Reserve" name="minmax"
					              tooltip="This is the amount that the bids of this auction must reach in order for the auction to succeed"
					              {useSecondaryCurrencies} caret={!$flagStore.enableMinimumBid}/>
				{/if}
			</div>
		{/if}
		{#if $flagStore.enableReserveLimit}
			{#if $flagStore.reserveLimitVisibility === CONSTANTS.VISIBILITY_KEYS.USER}
				<div class="auction-title auction-border-top" data-tooltip-direction="UP"
				     data-tooltip="This setting controls whether the reserve amount is visible or not">Reserve Visibility
				</div>
			{/if}
			{#if $flagStore.reserveLimitVisibility === CONSTANTS.VISIBILITY_KEYS.USER}
				<div class="auction-title auction-visibility">
					<div>
						<input id="visible-reserve-input" type="radio" bind:group={$reserveLimitVisibility}
						       value={CONSTANTS.VISIBILITY_KEYS.VISIBLE}/>
						<label for="visible-reserve-input">Visible</label>
					</div>
					<div>
						<input id="hidden-reserve-input" type="radio" bind:group={$reserveLimitVisibility}
						       value={CONSTANTS.VISIBILITY_KEYS.HIDDEN}/>
						<label for="hidden-reserve-input">Hidden</label>
					</div>
				</div>
			{:else if $flagStore.reserveLimitVisibility === CONSTANTS.VISIBILITY_KEYS.VISIBLE}
				<div class="auction-title auction-border-top" data-tooltip-direction="UP"
				     data-tooltip="Reserve amount is always visible">
					<span>Visible Reserve</span>
				</div>
			{:else if $flagStore.reserveLimitVisibility === CONSTANTS.VISIBILITY_KEYS.HIDDEN}
				<div class="auction-title auction-border-top" data-tooltip-direction="UP"
				     data-tooltip="Reserve amount is always hidden">
					<span>Hidden Reserve</span>
				</div>
			{/if}
		{/if}
		<div class="auction-title auction-border-top auction-duration" data-tooltip="How long this auction will remain active"
		     data-tooltip-direction="UP">
			<span>Duration:</span>
			<select bind:value={$durationStore}>
				{#each validTimeLimits as [key, value]}
					<option value={key}>{value}</option>
				{/each}
			</select>
		</div>

	</div>

	<div class="auction-post-buttons">
		<ReactiveButton callback={() => createAuctions()}
		                disabled={!$newAuctionStore.itemData || (depositCurrencies && !depositCurrencies?.canBuy)}>
			Post Auctions
		</ReactiveButton>
		{#if game.user.isGM}
			<ReactiveButton callback={() => createAuctions(true)} disabled={!$newAuctionStore.itemData}>
				Post Auctions Without Deposit
			</ReactiveButton>
		{/if}
	</div>

</div>
