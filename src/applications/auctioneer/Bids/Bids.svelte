<script>

	import { getContext } from "svelte";
	import { VirtualScroll } from "svelte-virtual-scroll-list";
	import SortByTabs from "~/applications/auctioneer/Components/SortByTabs.svelte";
	import BidItem from "~/applications/auctioneer/Bids/BidItem.svelte";

	const store = getContext("store");

	let sortedBids = [];
	$: {
		const tab = $store.tabs['bids'];
		const sortAlg = tab.sortByColumns[tab.sortBy].sort;
		sortedBids = $store.auctionData.auctions
			.filter(auction => {
				return auction.highestOwnedBid
					&& (
						auction.cancelled
						||
						!auction.expired
						||
						(auction.expired && auction.won.user !== game.user && !auction.highestOwnedBid?.claimed)
					);
			})
			.map(auction => auction.highestOwnedBid)
			.sort((a, b) => {
				const inverse = tab.sortByInverse;
				const _a = inverse ? b : a;
				const _b = inverse ? a : b;
				return sortAlg(_a, _b);
			});

	}

</script>

<div class="item-list">

	<SortByTabs class="bids" numVisibleElements={sortedBids.length} tab={$store.tabs['bids']}/>

	<VirtualScroll
		data={sortedBids}
		estimateSize={38}
		key="id"
		let:data
	>
		<BidItem bid={data} class="bids"/>
	</VirtualScroll>

</div>

<style lang="scss">


  .item-list {
    display: flex;
    flex-direction: column;
    border: var(--item-piles-auctioneer-border);
    border-radius: var(--item-piles-auctioneer-border-radius);
    height: calc(var(--item-piles-auctioneer-ui-height) - 83px);
    overflow: hidden;
  }

  :global.virtual-scroll-root {
    overflow-x: hidden;
  }

</style>
