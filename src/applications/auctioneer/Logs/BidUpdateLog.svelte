<script>

	import { getItemColorElement, turnCurrenciesIntoString } from "~/lib.js";

	export let entry;

	const data = entry.data;

	const price = turnCurrenciesIntoString(data.priceData.currencies, true);
	const oldPrice = turnCurrenciesIntoString(data.previousBid.priceData.currencies, true);
	const priceDifference = game.itempiles.API.calculateCurrencies(data.price, data.previousBid.price);

	const quantity = data.auction.quantity > 1 ? "x " + data.auction.quantity : "";

</script>

<div>
	<span>{data.displayName}</span> placed a <span class="auction-bid-log">new bid</span> on
	the {@html getItemColorElement(data.auction.item)}<span>{data.auction.item.name}</span> {quantity} from
	<span>{data.auction.displayName}</span> for <span>{price}</span>, increasing their bid of <span>{oldPrice}</span>
	by <span>{priceDifference}</span>
</div>
