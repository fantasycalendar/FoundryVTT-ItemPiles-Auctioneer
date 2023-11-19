<script>

	import { getContext } from "svelte";
	import { writable } from "svelte/store";
	import { getValidCurrenciesForPrice, turnCurrenciesIntoString } from "~/lib.js";
	import ReactiveButton from "~/applications/auctioneer/Components/ReactiveButton.svelte";

	export let auction;
	export let showCurrency = true;

	const store = getContext("store");

	const currencyStore = writable(getValidCurrenciesForPrice(auction.startPriceData.currencies));

	$: currencyString = turnCurrenciesIntoString($currencyStore);

	function clearCurrencyStore() {
		currencyStore.update(currencies => {
			return currencies.map(currency => {
				currency.quantity = 0;
				return currency;
			})
		});
	}

</script>

<div class="item-list-entry-actions">
	{#if showCurrency && !auction.expired}
		<div class="character-currencies">
			{#each $currencyStore as currency (currency.name)}
				<div class="currency-list-item" data-tooltip={currency.name}>
					<input type="number" bind:value={currency.quantity}/>
					<img class="currency-list-img" src="{currency.img}"/>
				</div>
			{/each}
		</div>
	{/if}
	<div class="buttons">
		{#if $store.activeTab === "auctions"}
			<ReactiveButton callback={() => store.relistAuction(auction)}
			                disabled={!auction.expired || auction.won}>
				Relist
			</ReactiveButton>
			<ReactiveButton callback={() => store.claimAuctions([auction])} completelyDisable
			                disabled={!auction.expired && !auction.won}>
				Collect
			</ReactiveButton>
			<ReactiveButton callback={() => store.claimAuctions([auction], true)} completelyDisable
			                disabled={auction.expired || auction.won}>
				Cancel
			</ReactiveButton>
		{:else if $store.activeTab === "wins"}
			<ReactiveButton callback={() => store.claimAuctions([auction])} completelyDisable
			                disabled={!auction.won || auction.won.user !== game.user}>
				Collect item
			</ReactiveButton>
		{:else}
			{#if auction.expired}
				<ReactiveButton callback={() => store.claimAuctions([auction])} completelyDisable
				                disabled={!auction.expired}>
					Collect currency
				</ReactiveButton>
			{:else}
				{#if auction.startPrice}
					<ReactiveButton
						disabled={auction.user === game.user || auction.expired}
						callback={() => {
						store.bidOnItem(auction, currencyString).then((result) => {
							if(!result) return;
							clearCurrencyStore();
						});
					}}>
						Bid
					</ReactiveButton>
				{/if}
				{#if auction?.buyoutPriceData}
					<ReactiveButton
						disabled={auction.user === game.user || auction.expired || !auction.buyoutPrice}
						callback={() => {
						store.buyoutItem(auction).then((result) => {
							if(!result) return;
							clearCurrencyStore();
						});
					}}>
						Buyout
					</ReactiveButton>
				{/if}
			{/if}
		{/if}
	</div>
</div>


<style lang="scss">
  .item-list-entry-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: 100%;
    overflow: hidden;
    padding: 0.25rem;

    .buttons {
      display: flex;

      button {
        min-width: 75px;
        height: 20px;
        line-height: 10px;
        margin-left: 0.25rem;
      }
    }
  }
</style>
