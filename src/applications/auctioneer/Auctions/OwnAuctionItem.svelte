<script>
	import CONSTANTS from "~/constants.js";

	import { getContext } from "svelte";
	import ItemName from "~/applications/auctioneer/Components/ItemName.svelte";
	import AuctionEntryButtons from "~/applications/auctioneer/Components/AuctionEntryButtons.svelte";
	import * as lib from "~/lib.js"

	export let auction;

	const store = getContext("store");

	$: selected = auction.uuid === $store.tabs[$store.activeTab].selected;
	$: showStartPrice = $store.tabs.auctions.switch === "start-price";

</script>


<div class="item-list-entry" class:selected={selected}>

	<div class="item-row {$$props.class ?? ''}"
	     class:auction-expired={auction.expired && !auction.won}
	     class:auction-won={auction.won}
	     class:scrollbar-nudge={$store.visibleAuctions.length > 10}
	     on:click={() => { store.entryClicked(auction.uuid) }}
	>
		<ItemName {auction}/>
		<div class="auction-entry-text auction-status">
			{auction.timeLeft.label}
		</div>
		<div class="auction-entry-text">
			{auction.highBidder?.name ?? "No bids"}
		</div>
		<div class="auction-entry-text">
			{CONSTANTS.BID_VISIBILITY_UI_LABELS[auction.bidVisibility]}
		</div>
		<div class="item-prices">
			{#if showStartPrice}
				{#if auction.startPrice}
					<div class="item-price">
						{#each auction.bidPriceData.currencies as currency (currency.id)}
							<div class="price">
								<span>{currency.quantity}</span>
								<img src={currency.img}>
							</div>
						{/each}
					</div>
				{/if}
				{#if auction.reservePrice}
					<div class="item-price">
						{#each auction.reservePriceData.currencies as currency (currency.id)}
							<div class="price">
								<span>{currency.quantity}</span>
								<img src={currency.img}>
							</div>
						{/each}
					</div>
				{/if}
			{:else}
				<div class="item-price">
					{#each auction.startPriceData.currencies as currency (currency.id)}
						<div class="price">
							<span>{currency.quantity}</span>
							<img src={currency.img}>
						</div>
					{/each}
				</div>
				{#if auction.buyoutPriceData}
					<div class="item-price buyout-price">
						{#each auction.buyoutPriceData.currencies as currency (currency.id)}
							<div class="price">
								<span>{currency.quantity}</span>
								<img src={currency.img}>
							</div>
						{/each}
					</div>
				{/if}
			{/if}
		</div>
	</div>

	{#if selected}
		<AuctionEntryButtons {auction} showCurrency=""/>
	{/if}
</div>
