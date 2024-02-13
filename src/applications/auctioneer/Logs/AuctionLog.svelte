<script>

	import { dateTimeToString, getItemColorElement, turnCurrenciesIntoString } from "~/lib.js";
	import { getContext } from "svelte";
	import ExpiredAuctionLog from "~/applications/auctioneer/Logs/ExpiredAuctionLog.svelte";
	import BidLog from "~/applications/auctioneer/Logs/BidLog.svelte";
	import BuyoutLog from "~/applications/auctioneer/Logs/BuyoutLog.svelte";
	import ClaimedAuctionLog from "~/applications/auctioneer/Logs/ClaimedAuctionLog.svelte";
	import CancelledAuctionLog from "~/applications/auctioneer/Logs/CancelledAuctionLog.svelte";
	import ClaimedBidLog from "~/applications/auctioneer/Logs/ClaimedBidLog.svelte";
	import ClaimedExpiredAuctionLog from "~/applications/auctioneer/Logs/ClaimedExpiredAuctionLog.svelte";
	import SuccessfulExpiredAuctionLog from "~/applications/auctioneer/Logs/SuccessfulExpiredAuctionLog.svelte";
	import ClaimedLostBidLog from "~/applications/auctioneer/Logs/ClaimedLostBidLog.svelte";
	import SuccessfulBuyoutAuctionLog from "~/applications/auctioneer/Logs/SuccessfulBuyoutAuctionLog.svelte";
	import ClaimedBuyoutLog from "~/applications/auctioneer/Logs/ClaimedBuyoutLog.svelte";
	import AuctionCreatedLog from "~/applications/auctioneer/Logs/AuctionCreatedLog.svelte";
	import BidUpdateLog from "~/applications/auctioneer/Logs/BidUpdateLog.svelte";

	const componentTypes = {
		AuctionCreatedLog,
		ExpiredAuctionLog,
		SuccessfulExpiredAuctionLog,
		SuccessfulBuyoutAuctionLog,
		ClaimedAuctionLog,
		ClaimedExpiredAuctionLog,
		CancelledAuctionLog,

		BidLog,
		BidUpdateLog,
		ClaimedBidLog,
		ClaimedLostBidLog,

		BuyoutLog,
		ClaimedBuyoutLog
	}

	const store = getContext("store")

	export let entry;

	let expanded = false;

	const visibleEvents = entry.events.slice(1);

</script>

<div class="log-entry outer-log-entry">
	<div class="inner-auction-container">
		<div class="text">
			{#if visibleEvents.length}
				<i class="fas item-piles-clickable item-piles-clickable-link" class:fa-chevron-down={expanded}
				   class:fa-chevron-right={!expanded} on:click={() => { expanded = !expanded; }}></i>
			{/if}
			{#if !expanded}
				<AuctionCreatedLog {entry}/>
			{:else}
				<svelte:component entry={entry.events[0]} this={componentTypes[entry.events[0].type]}/>
			{/if}
		</div>
		<div class="date">
			{#if !expanded}
				{dateTimeToString(store.auctioneer, entry.date)}
			{:else}
				{dateTimeToString(store.auctioneer, entry.events[0].date)}
			{/if}
		</div>
	</div>
	{#if expanded && visibleEvents.length}
		<div class="log-events">
			{#each visibleEvents as event}
				<div class="log-entry">
					<div class="inner-auction-container inner-child-container">
						<div class="text">
							<svelte:component entry={event} this={componentTypes[event.type]}/>
						</div>
						<div class="date">
							{dateTimeToString(store.auctioneer, event.date)}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style lang="scss">

  i {
    margin: 0 0.25rem 0 0;
    min-width: 14px;
    text-align: center;
  }

  .outer-log-entry {
    border-bottom: var(--item-piles-auctioneer-border);
  }

  .inner-auction-container {
    display: flex;
    flex: 1;

	  &.inner-child-container {
		  padding-left: 1.1rem;
      border-top: var(--item-piles-auctioneer-border);
      border-color: rgba(0, 0, 0, 0.2);
	  }
  }

  .log-entry {

    flex: 1;
    display: flex;
    flex-direction: column;

    .text {
	    display: flex;
      flex: 1 0 auto;
      padding-left: 0.35rem;
      padding-top: 0.15rem;
      padding-bottom: 0.15rem;
    }

    .date {
      flex: 0 1 auto;
      padding: 0.15rem;
      border-left: var(--item-piles-auctioneer-border);
      vertical-align: middle;
      min-width: 140px;
      max-width: 140px;
      text-align: center;
    }

    .rarity {
      font-size: 0.5rem;
      text-shadow: var(--item-piles-auctioneer-text-shadow-weak);
      line-height: inherit !important;
      vertical-align: middle;
    }

  }

</style>
