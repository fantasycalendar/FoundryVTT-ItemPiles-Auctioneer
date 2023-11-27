<script>

	import { getContext } from "svelte";

	export let tab;

	const store = getContext("store");

	const flagStore = store.auctioneerFlags;

	$: sortBy = tab.sortBy;
	$: sortByInverse = tab.sortByInverse;
	const columns = tab.sortByColumns;

</script>

<div class="sort-by-tabs {$$props.class ?? ''}" class:scrollbar-nudge={$store.visibleAuctions.length > 12}
     style="{$$props.style ?? ''}">
	{#each Object.entries(columns) as [key, column]}
		{#if !column?.visible || column.visible($flagStore, $store)}
			<div class="sort-tab">
				{#if column.switch && (!column.showSwitch || column.showSwitch($flagStore, $store))}
					<i class="fas fa-refresh item-piles-clickable item-piles-clickable-link switch-tab" on:click={() => {
						tab.switch = column.switch;
						if(sortBy === key){
							store.setSortBy(column.switch, tab.sortByInverse)
						}
						$store = $store;
					}}></i>
				{/if}
				<div class="item-piles-clickable item-piles-clickable-link {key}"
				     on:click={() => { store.setSortBy(key) }}
				     data-tooltip={column?.tooltip ?? ""}
				>
					<span>{column.label}</span>
					{#if sortBy === key}
						<i class="fas" class:fa-caret-up={sortByInverse} class:fa-caret-down={!sortByInverse}></i>
					{/if}
				</div>
			</div>
		{/if}
	{/each}
</div>

<style lang="scss">

  .sort-by-tabs {

    align-items: center;
    border-bottom: var(--item-piles-auctioneer-border);
    background-color: #e3ded2;

    .sort-tab {
      display: flex;
      align-items: center;

      padding: 5px;

      &:not(:last-child) {
        border-right: var(--item-piles-auctioneer-border);
      }

      i {
        margin-left: 0.35rem;
      }

	    i.switch-tab {
        margin-left: 0;
        margin-right: 0.35rem;
	    }
    }
  }

</style>
