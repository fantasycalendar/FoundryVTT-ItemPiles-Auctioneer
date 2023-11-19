<script>

	import { getContext } from "svelte";
	import Select from "svelte-select";

	const store = getContext("store");

	const searchStore = store.search;
	const categoryStore = store.categories;
	const selectedCategoriesStore = store.selectedCategories;

	function handleKeydown(e) {
		if (e.key !== "Enter") return;
		store.searchClicked();
	}

	$: {
		$selectedCategoriesStore;
		store.searchClicked();
	}

</script>

<div class="top-bar">
	<input bind:value={$searchStore} on:keydown={handleKeydown} placeholder="Search..." type="text"/>
	<Select
		--background="rgba(0, 0, 0, 0.05)"
		--border="var(--item-piles-auctioneer-border)"
		--border-hover="var(--item-piles-auctioneer-border)"
		--border-radius="var(--item-piles-auctioneer-border-radius)"
		--chevron-width="20px"
		--multi-select-input-margin="none"
		--internal-padding="0 0.15rem"
		--value-container-padding="0"
		--multi-select-padding="0 0.15rem"
		--multi-item-margin="0"
		--multi-item-padding="0 0.25rem"
		--multi-item-gap="0"
		--font-family="inherit"
		--font-size="0.75rem"
		--height="27px"
		--input-color="black"
		--max-height="27px"
		--text-overflow="ellipsis"
		--multi-item-bg="rgba(255, 255, 255, 0.25)"
		--width="100%"
		--margin="0 0.1rem 0 0.25rem"
		multiFullItemClearable={true}
		multiple={true}
		clearable={false}
		bind:value={$selectedCategoriesStore}
		floatingConfig={{ strategy: "fixed", placement: "bottom" }}
		items={$categoryStore}
		showChevron={true}
		placeholder="Select type filter..."
	></Select>
	<button on:click={() => { store.searchClicked() }} type="button">Search</button>
	<button on:click={() => { $searchStore = ""; store.searchClicked(); $selectedCategoriesStore = []; }} type="button">Clear</button>
	<select bind:value={$store.itemsPerPage}>
		<option value={12}>Show 12 per page</option>
		<option value={20}>Show 20 per page</option>
		<option value={40}>Show 40 per page</option>
		<option value={0}>Show all</option>
	</select>

	<div class="pages">
		<button class="page-button"
		        disabled={$store.currentPage <= 1}
		        on:click={() => { store.decrementPage() }}
		        type="button">
			<i class="fas fa-chevron-left"></i>
		</button>
		<span>Page {$store.currentPage} / {$store.totalPages}</span>
		<button class="page-button" disabled={$store.currentPage === $store.totalPages}
		        on:click={() => { store.incrementPage() }}
		        type="button">
			<i class="fas fa-chevron-right"></i>
		</button>
	</div>
</div>

<style lang="scss">

  .top-bar-container {
    display: flex;
    flex-direction: row;
    margin-bottom: 0.25rem;

    & > div {
      flex: 1;
    }
  }

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

    button {
      flex: 1 0 60px;
      height: 27px;
      margin-left: 0.15rem;
    }

    select {
      margin-left: 0.15rem;
    }

    .pages {
      display: flex;
      flex: 1 0 auto;
      align-items: center;
      text-align: center;
      justify-content: flex-end;
      margin-left: auto;

      span {
        margin: 0 0.5rem;
      }

      .page-button {
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: inherit;
        text-align: center;
        padding: 0;
        width: 27px;
        height: 27px;
        flex: 0 1 auto;

        i {
          margin: 0;
        }

        &:disabled {
          opacity: 0.65;
        }
      }

    }
  }

  :global.value-container {
	  gap: 0 !important;
  }


</style>
