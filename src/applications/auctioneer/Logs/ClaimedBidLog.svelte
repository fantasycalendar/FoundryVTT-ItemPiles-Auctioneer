<script>

	import { getItemColorElement } from "~/lib.js";

	export let entry;

	const data = entry.data;

	const quantity = data.auction.quantity > 1 ? " x " + data.auction.quantity : "";

</script>

<div>
	<span>{data.displayName}</span> claimed {@html getItemColorElement(data.auction.item)}<span
>{data.auction.item.name}</span> {quantity} from their <span class="auction-successful-bid-log">successful bid</span> on
	the auction from <span>{data.auction.displayName}</span>
</div>
