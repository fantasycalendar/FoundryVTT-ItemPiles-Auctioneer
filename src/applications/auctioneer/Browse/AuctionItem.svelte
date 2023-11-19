<script>
	import CONSTANTS from "~/constants.js";

	import { getContext } from "svelte";
	import ItemName from "~/applications/auctioneer/Components/ItemName.svelte";
	import AuctionEntryButtons from "~/applications/auctioneer/Components/AuctionEntryButtons.svelte";
	import * as lib from "~/lib.js"

	export let auction;
	export let showOwnership = false;

	const store = getContext("store");

	const flagStore = store.auctioneerFlags;

	$: selected = auction.uuid === $store.tabs[$store.activeTab].selected;
	$: showReserve = $flagStore.reserveLimitVisibility !== "hidden";

</script>

<div class="item-list-entry" class:selected={selected} style="{$$props.style ?? ''}">

	<div class="item-row {$$props.class ?? ''}"
	     class:auction-won={auction.bidStatus?.won ?? false}
	     class:scrollbar-nudge={$store.visibleAuctions.length > 10}
	     on:click={() => { store.entryClicked(auction.uuid) }}
	>
		<ItemName {auction}/>
		<div class="auction-entry-text">
			{auction.timeLeft.label}
		</div>
		<div class="auction-entry-text">
		<span class:auction-owner={showOwnership && auction.user === game.user}>
			{auction.user.name}
		</span>
		</div>
		<div class="auction-entry-text auction-status">
			{CONSTANTS.BID_VISIBILITY_UI_LABELS[auction.bidVisibility]}
		</div>
		{#if showReserve}
			{#if auction.reservePrice}
				<div class="item-prices">
					<div class="item-price">
						{#each auction.reservePriceData.currencies as currency (currency.id)}
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
		{/if}
		<div class="item-prices">
			<div class="item-price">
				{#each auction.bidPriceData.currencies as currency (currency.id)}
					<div class="price">
						<span>{lib.abbreviateNumbers(currency.quantity)}</span>
						<img src={currency.img}>
					</div>
				{/each}
			</div>
			{#if auction.buyoutPriceData}
				<div class="item-price buyout-price">
					{#each auction.buyoutPriceData.currencies as currency (currency.id)}
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
		<AuctionEntryButtons {auction}/>
	{/if}

</div>

