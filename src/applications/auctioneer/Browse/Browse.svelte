<script>
	import AuctionItem from "./AuctionItem.svelte";
	import { VirtualScroll } from "svelte-virtual-scroll-list";

	import { getContext } from "svelte";
	import TopBar from "./TopBar.svelte";
	import SortByTabs from "../Components/SortByTabs.svelte";

	const store = getContext("store");

	const searchRegexStore = store.searchRegex;
	const selectedCategoriesStore = store.selectedCategories;

	$: {
		const tab = $store.tabs["browse"];
		const sortAlg = tab.sortByColumns[tab.sortBy].sort;

		const activeCategories = ($selectedCategoriesStore ?? []).map(category => category.value);

		$store.filteredAuctions = $store.auctionData.auctions
			.filter(auction => {
				if (auction.expired || auction.won || auction.claimed || auction.cancelled) return false;
				const nameMatch = (!$searchRegexStore || auction.item.name.toLowerCase().match($searchRegexStore));
				const itemCategory = foundry.utils.getProperty(auction.item, "flags.item-piles.item.customCategory") ?? auction.item.type;
				return nameMatch && (!activeCategories.length || activeCategories.includes(itemCategory));
			}).sort((a, b) => {
				const inverse = tab.sortByInverse;
				const _a = inverse ? b : a;
				const _b = inverse ? a : b;
				return sortAlg(_a, _b);
			});

		$store.visibleAuctions = $store.itemsPerPage
			? $store.filteredAuctions.slice($store.itemsPerPage * ($store.currentPage - 1), $store.itemsPerPage * $store.currentPage)
			: $store.filteredAuctions;

		$store.totalPages = Math.max(1, Math.ceil($store.filteredAuctions.length / $store.itemsPerPage));

		if ($store.currentPage > $store.totalPages) {
			$store.currentPage = $store.totalPages;
		}
	}

</script>

<TopBar/>

<div class="browse">

	<div class="item-list">

		<SortByTabs class="browse" tab={$store.tabs["browse"]}/>

		<VirtualScroll
			data={$store.visibleAuctions}
			estimateSize={39}
			key="uuid"
			let:data
		>
			<AuctionItem auction={data} class="browse" showOwnership/>
		</VirtualScroll>

	</div>

</div>

<style lang="scss">

  .browse {

    display: flex;

    .item-list {
      display: flex;
      flex-direction: column;
      border: var(--item-piles-auctioneer-border);
      border-radius: var(--item-piles-auctioneer-border-radius);
      height: calc(var(--item-piles-auctioneer-ui-height) - 114px);
      overflow: hidden;
    }

  }

  :global.virtual-scroll-root {
    overflow-x: hidden;
  }

</style>
