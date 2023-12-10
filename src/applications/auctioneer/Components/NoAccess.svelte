<script>

	import { getContext } from "svelte";

	const store = getContext("store");

	const flagStore = store.auctioneerFlags;

	$: flags = $flagStore;

	const color = game.modules.get("rarity-colors")?.active && game.modules.get("rarity-colors")?.api && flags.entryItem?.data
		? game.modules.get("rarity-colors").api.getColorFromItem(flags.entryItem?.data)
		: false;

	async function previewItem() {
		const item = new Item.implementation(flags.entryItem?.data);
		const cls = item._getSheetClass();
		const sheet = new cls(item, { editable: false })
		return sheet._render(true);
	}

</script>

<div class="access-denied">
	{#if flags.displayEntryItem}
		<div on:click|stopPropagation={() => { previewItem() }}>
			<img src={flags.entryItem.data.img}/>
			<a class="access-item-name" style="color: {color || 'inherit'};">
				{flags.entryItem.data.name}
			</a>
		</div>
		<span>This character does not possess this item, which is required to gain access to this auctioneer.</span>
	{:else}
		<span>This character does not possess the item of entry to access this auctioneer.</span>
	{/if}
</div>

<style lang="scss">

	.access-denied{
    display: flex;
    flex-direction: column;
    border: var(--item-piles-auctioneer-border);
    border-radius: var(--item-piles-auctioneer-border-radius);
    height: calc(var(--item-piles-auctioneer-ui-height) - 83px);
    overflow: hidden;

		div {
			display: flex;
      flex-direction: column;
			text-align: center;
		}

		img {
      max-width: 75px;
      border: 0;
      border-radius: 5px;
      z-index: 1;
			margin-bottom: 0.25rem;
			cursor: pointer;
		}

		.access-item-name {
			font-size: 1.5rem;
      margin-bottom: 0.5rem;
			font-style: italic;
		}

	}

</style>
