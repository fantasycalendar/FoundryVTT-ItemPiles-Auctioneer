<script>

	import { getContext } from "svelte";
	import CONSTANTS from "~/constants.js";
	import ItemName from "~/applications/auctioneer/Components/ItemName.svelte";
	import AuctionEntryButtons from "~/applications/auctioneer/Components/AuctionEntryButtons.svelte";
	import * as lib from "~/lib.js"

	export let bid;

	const store = getContext("store");

	$: selected = bid.auction.uuid === $store.tabs[$store.activeTab].selected;

</script>

<div class="item-list-entry" class:selected={selected}>

	<div class="item-row {$$props.class ?? ''}"
	     class:auction-won={bid.bidStatus.won ?? false}
	     on:click={() => { store.entryClicked(bid.auction.uuid) }}
	>
		<ItemName auction={bid.auction}/>
		<div class="auction-entry-text">
			{bid.auction.timeLeft.label}
		</div>
		{#if bid.auction.buyoutPriceData}
			<div class="item-prices">
				<div class="item-price">
					{#each bid.auction.buyoutPriceData.currencies as currency (currency.id)}
						<div class="price">
							<span>{lib.abbreviateNumbers(currency.quantity)}</span>
							<img src={currency.img}>
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<div class="auction-entry-text">
				None
			</div>
		{/if}
		<div class="auction-entry-text">
			{CONSTANTS.BID_VISIBILITY_UI_LABELS[bid.auction.bidVisibility]}
		</div>
		<div class="auction-entry-text auction-status">
			{bid.bidStatus.label}
		</div>
		<div class="item-prices">
			<div class="item-price">
				{#each bid.auction.bidPriceData.currencies as currency (currency.id)}
					<div class="price">
						<span>{lib.abbreviateNumbers(currency.quantity)}</span>
						<img src={currency.img}>
					</div>
				{/each}
			</div>
			{#if bid.auction.bidVisibility === CONSTANTS.VISIBILITY_KEYS.HIDDEN}
				<div class="item-price blind-price">
					{#each bid.auction.startPriceData.currencies as currency (currency.id)}
						<div class="price">
							<span>{lib.abbreviateNumbers(currency.quantity)}</span>
							<img src={currency.img}>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	{#if selected}
		<AuctionEntryButtons auction={bid.auction}/>
	{/if}

</div>
