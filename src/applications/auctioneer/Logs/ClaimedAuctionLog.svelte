<script>

	import LogEntry from "~/applications/auctioneer/Logs/LogEntry.svelte";
	import { getItemColorElement } from "~/lib.js";

	export let entry;

	const data = entry.data;

	const quantity = data.quantity > 1 ? " x " + data.quantity : "";

</script>

<LogEntry date={entry.date}>
	<div>
		<span>{data.displayName}</span> <span
		class="auction-claimed-log">claimed</span> the expired auction for {@html getItemColorElement(data.item)}<span
	>{data.item.name}</span> {quantity}
	</div>
</LogEntry>
