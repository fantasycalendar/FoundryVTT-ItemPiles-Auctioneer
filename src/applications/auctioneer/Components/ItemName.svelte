<script>


	import {getContext} from "svelte";

	export let auction;

	const store = getContext("store");
	const flagStore = store.auctioneerFlags;

	$: canInspectItems = $flagStore.canInspectItem || game.user.isGM;

	const item = auction.item;
	const quantity = auction.quantity;

	async function previewItem() {
		if(!canInspectItems) return false;
		const cls = auction.item._getSheetClass();
		const sheet = new cls(auction.item, { editable: false })
		return sheet._render(true);
	}

	const color = game.modules.get("rarity-colors")?.active && game.modules.get("rarity-colors")?.api
		? game.modules.get("rarity-colors").api.getColorFromItem(item)
		: false;

</script>

<div class="item-name name">
	<div class="item-image">
		<img src={item.img}/>
		{#if quantity > 1}
			<span class="item-quantity">{quantity}</span>
		{/if}
	</div>
	<span class:item-piles-clickable={canInspectItems} class:item-piles-clickable-link={canInspectItems}
	      on:click|stopPropagation={() => { previewItem() }}
	      style="color: {color || 'inherit'};">
		{item.name}
	</span>
</div>
