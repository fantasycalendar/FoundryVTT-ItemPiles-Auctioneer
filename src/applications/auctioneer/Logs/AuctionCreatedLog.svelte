<script>

	import { getItemColorElement, turnCurrenciesIntoString } from "~/lib.js";

	export let entry;

	const data = entry.data;

	const price = turnCurrenciesIntoString(data.startPrice ? data.startPriceData.currencies : data.buyoutPriceData.currencies, true);

	const quantity = data.quantity > 1 ? " x " + data.quantity : "";

</script>

<div>
	<span>{data.displayName}</span> <span class="auction-created-log">created</span> an auction
	for {@html getItemColorElement(data.item)}<span
>{data.item.name}</span> {quantity} with a {data.startPrice ? "start price" : "buyout price"} of
	<span>{price}</span>
</div>
