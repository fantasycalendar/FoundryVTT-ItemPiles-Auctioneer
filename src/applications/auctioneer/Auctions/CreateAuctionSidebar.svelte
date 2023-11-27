<script>

	import { getContext } from "svelte";
	import { get, writable } from "svelte/store";
	import { TJSDocument } from "#runtime/svelte/store/fvtt/document";
	import DropZone from "~/applications/auctioneer/Components/DropZone.svelte";
	import CurrencyList from "~/applications/auctioneer/Auctions/CurrencyList.svelte";
	import CONSTANTS from "~/constants.js";
	import { getCurrencies } from "~/lib.js";
	import CurrencyStore from "~/applications/auctioneer/Auctions/currency-store.js";
	import ReactiveButton from "~/applications/auctioneer/Components/ReactiveButton.svelte";

	const store = getContext("store");

	const flagStore = store.auctioneerFlags;
	const flags = get(flagStore);

	const itemDocStore = new TJSDocument();

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

	const potentialAuctionStore = writable({
		itemData: false,
		numAuctions: 1,
		quantityPerAuction: 1,
		hiddenQuantity: false,
		priceIsPerQuantity: false
	});

	const durationStore = writable(get(flagStore).minTimeLimit);

	async function dropItem(dropData) {

		const item = await Item.implementation.fromDropData(dropData);

		if (!item.parent?.isOwner && !game.user.isGM) return;

		if (currencies.some(currency => {
			return currency.data.item
				&& currency.data.item.name === item.name
				&& currency.data.item.type === item.type
				&& currency.data.item.img === item.img
		})) {
			return;
		}

		if (game.itempiles.API.isItemInvalid(item)) {
			return;
		}

		const canItemStack = game.itempiles.API.canItemStack(item);
		const itemQuantity = game.itempiles.API.getItemQuantity(item);

		potentialAuctionStore.update(data => {
			data.numAuctions = 1;
			data.quantityPerAuction = itemQuantity;
			data.hiddenQuantity = !canItemStack;
			data.itemData = item.toObject();
			data.itemCost = game.itempiles.API.getCostOfItem(item);
			data.uuid = dropData.uuid;
			return data;
		});

		itemDocStore.set(item);

	}

	function setMaxAuctions() {
		const itemQuantity = game.itempiles.API.getItemQuantity($itemDocStore);
		potentialAuctionStore.update(data => {
			data.numAuctions = itemQuantity;
			data.quantityPerAuction = 1;
			return data;
		});
	}

	function setMaxPerAuction() {
		const itemQuantity = game.itempiles.API.getItemQuantity($itemDocStore);
		potentialAuctionStore.update(data => {
			data.quantityPerAuction = Math.max(1, Math.floor(itemQuantity / data.numAuctions));
			return data;
		});
	}

	function numAuctionsChanged() {
		const itemQuantity = game.itempiles.API.getItemQuantity($itemDocStore);
		potentialAuctionStore.update(data => {
			data.numAuctions = Math.min(data.numAuctions, itemQuantity);
			data.quantityPerAuction = Math.min(data.quantityPerAuction, Math.floor(itemQuantity / data.numAuctions));
			return data;
		});
	}

	function numQuantityPerAuctionChanged() {
		const itemQuantity = game.itempiles.API.getItemQuantity($itemDocStore);
		potentialAuctionStore.update(data => {
			data.quantityPerAuction = Math.min(data.quantityPerAuction, itemQuantity);
			data.numAuctions = Math.min(data.numAuctions, Math.floor(itemQuantity / data.quantityPerAuction));
			return data;
		});
	}

	async function postAuctions() {
		const result = await store.postAuctions({
			numAuctions: $potentialAuctionStore.numAuctions,
			quantityPerAuction: $potentialAuctionStore.quantityPerAuction,
			itemData: $potentialAuctionStore.itemData,
			uuid: $potentialAuctionStore.uuid,
			bidVisibility: $bidVisibility,
			reserveLimitVisibility: $reserveLimitVisibility,
			bidCurrencies: bidCurrencies.exportCurrencies(),
			buyoutCurrencies: buyoutCurrencies.exportCurrencies(),
			minBidCurrencies: minBidCurrencies.exportCurrencies(),
			reserveCurrencies: reserveCurrencies.exportCurrencies(),
			duration: $durationStore
		});
		if(!result) return;
		potentialAuctionStore.set({
			itemData: false,
			numAuctions: 1,
			quantityPerAuction: 1,
			hiddenQuantity: false,
			priceIsPerQuantity: false
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
		<DropZone callback={dropItem} class="item-container">
			<img class="item-image" src={$itemDocStore ? $itemDocStore.img : "icons/svg/coins.svg"}/>
			{$itemDocStore ? $itemDocStore.name : "Drag & drop item"}
		</DropZone>
		<div class="stack-container auction-border-top">
			<div class="auction-title">Num. Auctions</div>
			<input bind:value={$potentialAuctionStore.numAuctions} disabled={!$itemDocStore} on:change={numAuctionsChanged}
			       type="number"/>
			<button disabled={!$itemDocStore} on:click={setMaxAuctions} type="button">Max</button>
			{#if !$potentialAuctionStore.hiddenQuantity}
				<span class="auction-title">Qty/Auctions</span>
				<input type="number" bind:value={$potentialAuctionStore.quantityPerAuction} disabled={!$itemDocStore}
				       on:change={numQuantityPerAuctionChanged}/>
				<button type="button" on:click={setMaxPerAuction} disabled={!$itemDocStore}>Max</button>
			{/if}
		</div>
		<div class="auction-title" data-tooltip-direction="UP" data-tooltip="When enabled, this makes the price of the auction be multiplied by the quantity of the item in that auction">
			<span>Price is per quantity:</span>
			<input bind:checked={$potentialAuctionStore.priceIsPerQuantity} type="checkbox"/>
		</div>
		{#if $flagStore.allowSecondaryCurrencies && hasSecondaryCurrencies}
			<div class="auction-title auction-border-top" data-tooltip-direction="UP" data-tooltip="When enabled, this switches the currencies for this auction to use the alternative currencies">
				<input bind:checked={$useSecondaryCurrencies} type="checkbox"/> Use Other Currencies
			</div>
		{/if}
		{#if $flagStore.auctionBidVisibility === CONSTANTS.VISIBILITY_KEYS.USER}
			<div class="auction-title auction-border-top" data-tooltip-direction="UP" data-tooltip="This setting makes bids either visible or blind - the latter meaning people can only see their own bids">Bids Visibility</div>
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
			<div class="auction-title auction-border-top" data-tooltip-direction="UP" data-tooltip="Bids for this auction will always be visible">
				<span>Visible Bids</span>
			</div>
		{:else if $flagStore.auctionBidVisibility === CONSTANTS.VISIBILITY_KEYS.HIDDEN}
			<div class="auction-title auction-border-top" data-tooltip-direction="UP" data-tooltip="Bids for this auction will always be blind - people can only see their own bids">
				<span>Hidden Bids</span>
			</div>
		{/if}
		<div class="price-currencies-container-pair auction-border-top">
			<CurrencyList bind:showPrice clickable={$flagStore.enableMinimumBid || $flagStore.enableReserveLimit}
			              currencyStore={bidCurrencies} label="Starting Bid" tooltip="Starting price for bids"
			              name="bids" {useSecondaryCurrencies}/>
			<CurrencyList bind:showPrice caret={$flagStore.enableMinimumBid || $flagStore.enableReserveLimit}
			              clickable={$flagStore.enableMinimumBid || $flagStore.enableReserveLimit}
			              currencyStore={buyoutCurrencies} label="Buyout Price" tooltip="Price to pay to instantly win this auction"
			              name="bids" {useSecondaryCurrencies}/>
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
				<div class="auction-title auction-border-top" data-tooltip-direction="UP" data-tooltip="This setting controls whether the reserve amount is visible or not">Reserve Visibility</div>
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
				<div class="auction-title auction-border-top" data-tooltip-direction="UP" data-tooltip="Reserve amount is always visible">
					<span>Visible Reserve</span>
				</div>
			{:else if $flagStore.reserveLimitVisibility === CONSTANTS.VISIBILITY_KEYS.HIDDEN}
				<div class="auction-title auction-border-top" data-tooltip-direction="UP" data-tooltip="Reserve amount is always hidden">
					<span>Hidden Reserve</span>
				</div>
			{/if}
		{/if}
		<div class="auction-title auction-border-top auction-duration">
			<span>Duration:</span>
			<select bind:value={$durationStore}>
				{#each validTimeLimits as [key, value]}
					<option value={key}>{value}</option>
				{/each}
			</select>
		</div>

	</div>

	<div class="auction-post-button">
		<ReactiveButton callback={postAuctions} disabled={!$potentialAuctionStore.itemData}>
			Post Auctions
		</ReactiveButton>
	</div>

</div>
