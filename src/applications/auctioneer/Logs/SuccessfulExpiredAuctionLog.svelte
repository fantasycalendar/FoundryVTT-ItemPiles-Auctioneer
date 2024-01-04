<script>

	import LogEntry from "~/applications/auctioneer/Logs/LogEntry.svelte";
	import { getItemColorElement } from "~/lib.js";

	export let entry;

	const data = entry.data;

	const quantity = data.quantity > 1 ? " x " + data.quantity : "";

</script>

<LogEntry date={entry.date}>
	<div>
		<span>{data.displayName}</span>'s <span
		class="auction-successful-bid-log">expired</span> auction for {@html getItemColorElement(data.item)}<span
	>{data.item.name}</span>{quantity} closed with someone <span>winning</span> the auction
	</div>
</LogEntry>
