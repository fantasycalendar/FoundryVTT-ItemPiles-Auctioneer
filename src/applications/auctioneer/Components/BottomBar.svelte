<script>

	import * as lib from "~/lib.js";
	import { getContext } from "svelte";
	import Select from 'svelte-select';
	import { writable } from "svelte/store";
	import ReactiveButton from "~/applications/auctioneer/Components/ReactiveButton.svelte";

	const store = getContext("store");

	const actorDocStore = store.actorDoc;
	const actorUuidStore = store.actorUuid;
	const actorCurrencyStore = store.actorCurrencies;

	const validActors = game.actors.filter(actor => {
		return actor.isOwner;
	}).map(actor => {
			const actorFlagData = game.itempiles.API.getActorFlagData(actor);
			return {
				value: actor.uuid,
				label: actor.name,
				hasPlayerOwner: actor.hasPlayerOwner,
				group: !actor.hasPlayerOwner
					? (actorFlagData.enabled ? "Item Pile" : "Other Characters")
					: "Player Characters",
				itemPile: actorFlagData.enabled
			}
		})
		.sort((a, b) => {
			const weightA = (a.hasPlayerOwner ? -100000 : (a.itemPile ? -1000 : 1)) + b.label > a.label;
			const weightB = b.hasPlayerOwner ? -100000 : (b.itemPile ? -1000 : 1) + a.label > b.label;
			return weightA - weightB;
		});

	const groupBy = (item) => item.group;


	const selectedItem = writable(validActors.find(actor => {
		return actor.value === $actorUuidStore;
	}) ?? validActors[0]);

	$: $actorUuidStore = $selectedItem.value;
	$: auctions = $store.auctionData.auctions;

</script>

<div class="bottom-bar-container">

	<div class="character-bottom-bar">

		<i class="fas fa-user"
		   class:item-piles-clickable-link={!!$actorUuidStore}
		   class:item-piles-disabled={!$actorUuidStore}
		   on:click={() => { if($actorDocStore) $actorDocStore.sheet.render(true) }}
		></i>

		<div class="actor-select">
			<Select
				--background="rgba(0, 0, 0, 0.05)"
				--border="var(--item-piles-auctioneer-border)"
				--border-hover="var(--item-piles-auctioneer-border)"
				--border-radius="var(--item-piles-auctioneer-border-radius)"
				--chevron-width="20px"
				--font-family="inherit"
				--font-size="0.833rem"
				--height="20px"
				--input-color="black"
				--item-padding="0 0.25rem"
				--max-height="20px"
				--padding="0 0.25rem 0 0"
				--text-overflow="ellipsis"
				--value-container-padding="0"
				--width="100%"
				bind:value={$selectedItem}
				clearable={false}
				floatingConfig={{ strategy: "fixed", placement: "bottom" }}
				{groupBy}
				items={validActors}
				showChevron={true}
			>
				<img class="actor-image" slot="prepend" src={$actorDocStore?.img}/>
			</Select>
		</div>

		<div class="character-currencies">
			{#each $actorCurrencyStore as currency (currency.name)}
				<div class="currency-list-item" data-tooltip={`${currency.quantity} ${currency.name}`}>
					<span>{lib.abbreviateNumbers(currency.quantity)}</span>
					<img class="currency-list-img" src="{currency.img}"/>
				</div>
			{/each}
		</div>
	</div>

	{#if $store.activeTab === "auctions" || $store.activeTab === "wins" || $store.activeTab === "bids"}
		<div class="buttons">
			{#if $store.activeTab === "auctions"}
				<ReactiveButton
				        callback={async () => await store.claimAuctions(auctions.filter(auction => auction.user === game.user && auction.expired))}
				        disabled={!auctions.filter(auction => auction.user === game.user && auction.expired).length}>
					Collect all
				</ReactiveButton>
			{:else if $store.activeTab === "bids"}
				<ReactiveButton
				        callback={async () => await store.claimAuctions(auctions.filter(auction => !auction.won))}
				        disabled={!auctions.filter(auction => !auction.won).length}>
					Collect all
				</ReactiveButton>
			{:else}
				<ReactiveButton
				        callback={async () => await store.claimAuctions(auctions.filter(auction => auction.won))}
				        disabled={!auctions.filter(auction => auction.won).length}>
					Collect all
				</ReactiveButton>
			{/if}
		</div>
	{/if}

</div>

<style lang="scss">

  .bottom-bar-container {
    display: flex;
    align-items: center;
    margin-top: 0.25rem;
    height: 28px;
  }

  .buttons {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 1 auto;
    border: var(--item-piles-auctioneer-border);
    border-radius: var(--item-piles-auctioneer-border-radius);
    padding: 0 0.25rem;
    margin-left: 0.25rem;

    button {
      min-width: 75px;
      height: 20px;
      line-height: 10px;
    }
  }

  .character-bottom-bar {
    border: var(--item-piles-auctioneer-border);
    border-radius: var(--item-piles-auctioneer-border-radius);
    padding: 0 0.25rem;

    i {
      margin-right: 0.25rem;
    }

    .actor-select {
      width: 100%;
      margin-right: 0.25rem;
      max-width: 250px;

      .actor-image {
        pointer-events: none;
        max-height: 20px;
        min-height: 20px;
        min-width: 20px;
        padding-right: 0.15rem;
        margin-right: 0.15rem;
        border: 0;
        border-right: var(--item-piles-auctioneer-border);
        z-index: 0;
        top: 0;
      }
    }
  }

  :global.prepend {
    overflow: hidden;
  }

  .item-piles-img-container {
    min-width: 18px;
    min-height: 18px;
    max-width: 18px;
    max-height: 18px;
  }

</style>
