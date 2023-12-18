<script>

	import { getContext } from "svelte";
	import { VirtualScroll } from "svelte-virtual-scroll-list";
	import AuctionLog from "~/applications/auctioneer/Logs/AuctionLog.svelte";
	import ExpiredAuctionLog from "~/applications/auctioneer/Logs/ExpiredAuctionLog.svelte";
	import BidLog from "~/applications/auctioneer/Logs/BidLog.svelte";
	import BuyoutLog from "~/applications/auctioneer/Logs/BuyoutLog.svelte";
	import ClaimedAuctionLog from "~/applications/auctioneer/Logs/ClaimedAuctionLog.svelte";
	import CancelledAuctionLog from "~/applications/auctioneer/Logs/CancelledAuctionLog.svelte";
	import { getLogData } from "~/lib.js";
	import { writable } from "svelte/store";

	const store = getContext("store");

	const componentTypes = {
		AuctionLog,
		ExpiredAuctionLog,
		BidLog,
		BuyoutLog,
		ClaimedAuctionLog,
		CancelledAuctionLog,
	}

	const auctioneerDoc = store.auctioneerDoc;
	let allEntries = writable([]);
	$: $allEntries = getLogData($auctioneerDoc, $store.auctionData).logs;

	const searchDebounce = foundry.utils.debounce((searchText) => {
		allEntries.update(entries => {
			searchText = searchText.trim();
			for (const entry of entries) {
				if (!searchText) {
					entry.visible = true;
				} else {
					for (const part of searchText.split(" ")) {
						entry.visible = entry.visible && (
							entry.data.user.name.toLowerCase().includes(part.toLowerCase())
							||
							(entry.data?.auction?.item ?? entry.data?.item).name.toLowerCase().includes(part.toLowerCase())
						);
					}
				}
			}
			return entries;
		});
	}, 300);

	const search = writable("");

	$: searchDebounce($search);
	$: visibleEntries = $allEntries.filter(entry => entry.visible)

</script>

<div class="logs">

	<div class="top-bar">
		<input bind:value={$search} placeholder="Search logs..." type="text"/>
	</div>

	<div class="log-list">
		<VirtualScroll
			data={visibleEntries}
			estimateSize={25}
			key="id"
			let:data
		>
			<svelte:component entry={data} this={componentTypes[data.type]}/>
		</VirtualScroll>
	</div>
</div>

<style lang="scss">

  .top-bar {
    display: flex;
    margin-bottom: 0.25rem;

    input {
      margin: 0;
      max-width: 250px;
      height: 27px;
      border: var(--item-piles-auctioneer-border);
      border-radius: var(--item-piles-auctioneer-border-radius);
    }
  }

  .logs {

    display: flex;
    flex-direction: column;

    .log-list {
      display: flex;
      flex-direction: column;
      border: var(--item-piles-auctioneer-border);
      border-radius: var(--item-piles-auctioneer-border-radius);
      height: calc(var(--item-piles-auctioneer-ui-height) - 114px);
      overflow: hidden;
      width: 100%;
    }

  }

</style>
