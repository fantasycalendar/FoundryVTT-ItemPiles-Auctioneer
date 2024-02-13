<script>

	import { getContext } from "svelte";
	import { VirtualScroll } from "svelte-virtual-scroll-list";
	import { getLogData } from "~/lib.js";
	import { writable } from "svelte/store";
	import AuctionLog from "~/applications/auctioneer/Logs/AuctionLog.svelte";

	const store = getContext("store");

	const auctioneerDoc = store.auctioneerDoc;
	let allEntries = writable([]);
	$: {
		$allEntries = getLogData($auctioneerDoc);
	}

	function filterFunction(entry, part){
		return entry.data.displayName.toLowerCase().includes(part.toLowerCase())
			|| (entry.data?.auction?.item ?? entry.data?.item).name.toLowerCase().includes(part.toLowerCase());
	}

	const searchDebounce = foundry.utils.debounce((searchText) => {
		allEntries.update(entries => {
			searchText = searchText.trim();
			for (const entry of entries) {
				entry.visible = true;
				for (const part of searchText.split(" ")) {
					entry.visible = filterFunction(entry, part) || entry.events.some(innerEntry => filterFunction(innerEntry, part));
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
			<AuctionLog entry={data}/>
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
