<script>

	import { dateTimeToString } from "~/lib.js";
	import { getContext } from "svelte";

	const store = getContext("store")

	export let date;

</script>


<div class="log-entry">
	<div class="date">
		{dateTimeToString(store.auctioneer, date)}
	</div>
	<div class="text">
		<slot/>
	</div>
</div>
