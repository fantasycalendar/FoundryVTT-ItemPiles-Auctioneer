<script>

	import { getItemColorElement, turnCurrenciesIntoString } from "~/lib.js";

	export let entry;

	const data = entry.data;

	const quantity = data.quantity > 1 ? " x " + data.quantity : "";
	const price = turnCurrenciesIntoString(data.won.priceData.currencies, true);

</script>

<div>
	<span>{data.won.displayName}</span> <span class="auction-successful-bid-log">won</span> the auction
	for {@html getItemColorElement(data.item)}<span>{data.item.name}</span>{quantity} for <span>{price}</span> via
	<span>buyout</span> from <span>{data.displayName}</span>
</div>
