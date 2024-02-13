<script>

	import { getItemColorElement, turnCurrenciesIntoString } from "~/lib.js";

	export let entry;

	const data = entry.data;

	const price = turnCurrenciesIntoString(data.priceData.currencies, true);

	const quantity = data.auction.quantity > 1 ? " x " + data.auction.quantity : "";

</script>

<div>
	<span>{data.displayName}</span> claimed their winnings from a <span class="auction-successful-bid-log">successful buyout</span> on
	the {@html getItemColorElement(data.auction.item)}<span
>{data.auction.item.name}</span> {quantity} from
	<span>{data.auction.displayName}</span>
</div>
