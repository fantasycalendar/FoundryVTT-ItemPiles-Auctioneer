<script>

	import { getItemColorElement, turnCurrenciesIntoString } from "~/lib.js";

	export let entry;

	const data = entry.data;

	const price = turnCurrenciesIntoString(data.priceData.currencies, true);

	const quantity = data.auction.quantity > 1 ? " x " + data.auction.quantity : "";

</script>

<div>
	<span>{data.displayName}</span> fully <span class="auction-buyout-log">bought out</span>
	the {@html getItemColorElement(data.auction.item)}<span
>{data.auction.item.name}</span> {quantity} from
	<span>{data.auction.displayName}</span> for <span>{price}</span>
</div>
