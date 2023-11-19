<script>

	import { ApplicationShell } from "#runtime/svelte/component/core";
	import { getContext, onDestroy, setContext } from 'svelte';
	import AuctioneerStore from "./auctioneer-store.js";
	import Tabs from "./Tabs.svelte";
	import BottomBar from "~/applications/auctioneer/Components/BottomBar.svelte";
	import { getAuctioneerActorFlags } from "~/lib.js";

	export let elementRoot;

	const { application } = getContext('#external');

	const { auctioneer } = application.options;

	const store = AuctioneerStore(auctioneer);

	$: activeTab = $store.tabs[$store.activeTab];

	setContext("store", store);

	onDestroy(() => {
		store.unsubscribe();
	});

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>

	<div class="main">

		<svelte:component this={activeTab.component}/>

		<BottomBar/>

	</div>

	<Tabs/>

</ApplicationShell>
