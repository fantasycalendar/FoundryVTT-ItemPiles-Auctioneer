<script>

	import { getItemColorElement } from "~/lib.js";
	import LogEntry from "~/applications/auctioneer/Logs/LogEntry.svelte";

	export let entry;

	const data = entry.data;

	const quantity = data.auction.quantity > 1 ? " x " + data.auction.quantity : "";

</script>

<LogEntry date={entry.date}>
	<div>
		<span>{data.displayName}</span> reclaimed money from their <span class="auction-failed-bid-log">failed bid</span> on
		the {@html getItemColorElement(data.auction.item)}<span
	>{data.auction.item.name}</span> {quantity} from
		<span>{data.auction.displayName}</span>
	</div>
</LogEntry>
