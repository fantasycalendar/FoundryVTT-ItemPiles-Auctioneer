<script>

	import { getContext } from "svelte";
	import { VirtualScroll } from "svelte-virtual-scroll-list";
	import SortByTabs from "~/applications/auctioneer/Components/SortByTabs.svelte";
	import OwnAuctionItem from "~/applications/auctioneer/Auctions/OwnAuctionItem.svelte";
	import CreateAuctionSidebar from "~/applications/auctioneer/Auctions/CreateAuctionSidebar.svelte";
	import { writable } from "svelte/store";

	const store = getContext("store");

	let sortedAuctions = [];
	$: {
		const tab = $store.tabs.auctions;
		const sortAlg = tab.sortByColumns[tab.sortBy].sort;
		sortedAuctions = $store.auctionData.auctions
			.filter(auction => {
				return auction.user === game.user && !auction.claimed && !auction.cancelled;
			})
			.sort((a, b) => {
				const inverse = tab.sortByInverse;
				const _a = inverse ? b : a;
				const _b = inverse ? a : b;
				return sortAlg(_a, _b);
			})
	}

</script>

<div class="auctions">

	<CreateAuctionSidebar/>

	<div class="item-list">

		<SortByTabs tab={$store.tabs.auctions} class="auctions" numVisibleElements={sortedAuctions.length}/>

		<VirtualScroll
			data={sortedAuctions}
			estimateSize={39}
			key="uuid"
			let:data
		>
			<OwnAuctionItem auction={data} class="auctions"/>
		</VirtualScroll>

	</div>

</div>

<style lang="scss">

	.auctions {
		display: grid;
		grid-template-columns: 200px auto;
		grid-column-gap: 0.25rem;
	}

  .item-list {
    display: flex;
    flex-direction: column;
    border: var(--item-piles-auctioneer-border);
    border-radius: var(--item-piles-auctioneer-border-radius);
    height: calc(var(--item-piles-auctioneer-ui-height) - 83px);
	  max-height: calc(var(--item-piles-auctioneer-ui-height) - 83px);
    overflow: hidden;
  }

  :global.virtual-scroll-root{
    overflow-x: hidden;
  }

</style>
