<script>

	import { getItemColorElement, turnCurrenciesIntoString } from "~/lib.js";
	import LogEntry from "~/applications/auctioneer/Logs/LogEntry.svelte";

	export let entry;

	const data = entry.data;

	const price = turnCurrenciesIntoString(data.priceData.currencies, true);

	const quantity = data.auction.quantity > 1 ? " x " + data.auction.quantity : "";

</script>

<LogEntry date={entry.date}>
	<div>
		<span>{data.displayName}</span> placed a <span class="auction-bid-log">bid</span> on
		the {@html getItemColorElement(data.auction.item)}<span
	>{data.auction.item.name}</span> {quantity} from
		<span>{data.auction.displayName}</span> for {price}
	</div>
</LogEntry>
