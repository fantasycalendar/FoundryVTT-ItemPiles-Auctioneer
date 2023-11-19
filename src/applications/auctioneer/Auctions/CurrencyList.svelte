<script>

	import { getCurrencies } from "~/lib.js";
	import { writable } from "svelte/store";
	import { getContext } from "svelte";
	import { slide } from "svelte/transition";

	export let showPrice;
	export let name;
	export let label;
	export let currencyStore;
	export let useSecondaryCurrencies;

	export let caret = false;
	export let clickable = true;

	const store = getContext("store");

	$: primaryCurrencies = $currencyStore.primaryCurrencies;
	$: secondaryCurrencies = $currencyStore.secondaryCurrencies;

	$: {
		currencyStore.update(data => {
			data.activeCurrencies = $useSecondaryCurrencies
				? data.secondaryCurrencies
				: data.primaryCurrencies
			return data;
		});
	}

</script>

<div>
	<span class="auction-title" class:currency-expand={clickable} on:click={() => { showPrice = name; }}>
		{label}
		{#if caret}
			<i class="fas" class:fa-caret-down={showPrice === name}
			   class:fa-caret-right={showPrice !== name}></i>
		{/if}
	</span>
	{#if showPrice === name}
		<div class="price-currencies-container" transition:slide>
			{#if !$useSecondaryCurrencies}
				<div class="price-currencies">
					{#each primaryCurrencies as currency}
						<div class="price-currency-list-item">
							<input type="number" bind:value={currency.quantity}/>
							<img class="price-currency-list-img" src={currency.img}  data-tooltip={currency.name}/>
						</div>
					{/each}
				</div>
			{/if}
			{#if secondaryCurrencies.length && $useSecondaryCurrencies}
				<div class="price-currencies">
					{#each secondaryCurrencies as currency}
						<div class="price-currency-list-item">
							<input type="number" bind:value={currency.quantity}/>
							<img class="price-currency-list-img" src={currency.img}  data-tooltip={currency.name}/>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
