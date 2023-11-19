<script>
	import { getContext } from "svelte";
	import ItemName from "~/applications/auctioneer/Components/ItemName.svelte";
	import AuctionEntryButtons from "~/applications/auctioneer/Components/AuctionEntryButtons.svelte";
	import * as lib from "~/lib.js"

	export let auction;

	const store = getContext("store");

	$: selected = auction.uuid === $store.tabs[$store.activeTab].selected;

</script>

<div class="item-list-entry" class:selected={selected}>

	<div class="item-row {$$props.class ?? ''}"
	     class:scrollbar-nudge={$store.visibleAuctions.length > 10}
	     on:click={() => { store.entryClicked(auction.uuid) }}
	>
		<ItemName {auction}/>
		<div class="auction-entry-text">
			{auction.user.name}
		</div>
		<div class="item-prices">
			<div class="item-price">
				{#each auction.startPriceData.currencies as currency (currency.id)}
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
		<div class="item-prices">
			<div class="item-price">
				{#each auction.won.priceData.currencies as currency (currency.id)}
					<div class="price">
						<span>{lib.abbreviateNumbers(currency.quantity)}</span>
						<img src={currency.img}>
					</div>
				{/each}
			</div>
		</div>
	</div>

	{#if selected}
		<AuctionEntryButtons {auction} showCurrency={false}/>
	{/if}

</div>
