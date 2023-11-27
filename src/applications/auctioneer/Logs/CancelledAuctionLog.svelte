<script>

	import LogEntry from "~/applications/auctioneer/Logs/LogEntry.svelte";
	import { getItemColorElement } from "~/lib.js";

	export let entry;

	const data = entry.data;

	const quantity = data.quantity > 1 ? " x " + data.quantity : "";

</script>

<LogEntry date={entry.date}>
	<div>
		<span>{data.user.name}</span> <span
		class="auction-expired-log">cancelled</span> the ongoing auction for {@html getItemColorElement(data.item)}<span
	>{data.item.name}</span> {quantity}
	</div>
</LogEntry>
