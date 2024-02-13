<script>

	import { getItemColorElement, turnCurrenciesIntoString } from "~/lib.js";

	export let entry;

	const data = entry.data;

	const quantity = data.quantity > 1 ? " x " + data.quantity : "";

	const price = turnCurrenciesIntoString(data.won.priceData.currencies, true);

</script>

<div>
	<span>{data.displayName}</span> <span
	class="auction-claimed-log">claimed</span> the money for the <span>successful</span> auction for {@html getItemColorElement(data.item)}<span
>{data.item.name}</span> {quantity} that sold for <span>{price}</span>
</div>
