<script>

	import { getContext } from "svelte";
	import CONSTANTS from "~/constants.js";
	import ItemName from "~/applications/auctioneer/Components/ItemName.svelte";
	import AuctionEntryButtons from "~/applications/auctioneer/Components/AuctionEntryButtons.svelte";

	export let bid;

	const store = getContext("store");

	$: selected = bid.auction.uuid === $store.tabs[$store.activeTab].selected;
	$: auctionSucceeded = bid.auction.won ? bid.auction.won.user === game.user : false;
	$: auctionFailed = bid.auction.cancelled || (bid.auction.won ? bid.auction.won.user !== game.user : false);

</script>

<div class="item-list-entry" class:selected={selected}>

	<div class="item-row {$$props.class ?? ''}"
	     class:auction-failed={auctionFailed}
	     class:auction-won={auctionSucceeded}
	     on:click={() => { store.entryClicked(bid.auction.uuid) }}
	>
		<ItemName auction={bid.auction}/>
		<div class="auction-entry-text auction-status">
			{bid.auction.timeLeft.label}
		</div>
		{#if bid.auction.buyoutPriceData}
			<div class="item-prices">
				<div class="item-price">
					{#each bid.auction.buyoutPriceData.currencies as currency (currency.id)}
						<div class="price">
							<span>{currency.cost}</span>
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
		<div class="auction-entry-text" class:auction-entry-bid-low={bid.bidStatus.value}>
			{bid.bidStatus.label}
		</div>
		<div class="item-prices">
			<div class="item-price">
				{#each bid.auction.bidPriceData.currencies as currency (currency.id)}
					<div class="price">
						<span>{currency.cost}</span>
						<img src={currency.img}>
					</div>
				{/each}
			</div>
			{#if bid.auction.bidVisibility === CONSTANTS.VISIBILITY_KEYS.HIDDEN}
				<div class="item-price blind-price">
					{#each bid.auction.startPriceData.currencies as currency (currency.id)}
						<div class="price">
							<span>{currency.cost}</span>
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
