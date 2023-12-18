<script>

	import { ApplicationShell } from "#runtime/svelte/component/core";
	import { getContext, onDestroy, setContext } from 'svelte';
	import { createStore } from "./auctioneer-store.js";
	import Tabs from "./Tabs.svelte";
	import BottomBar from "~/applications/auctioneer/Components/BottomBar.svelte";
	import NoAccess from "~/applications/auctioneer/Components/NoAccess.svelte";

	export let elementRoot;

	const { application } = getContext('#external');

	const { auctioneer } = application.options;

	export const store = createStore(auctioneer);
	setContext("store", store);

	onDestroy(() => {
		store.unsubscribe();
	});

	$: component = $store.access ? $store.tabs[$store.activeTab].component : NoAccess;

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>

	<div class="main">

		<svelte:component this={component}/>

		<BottomBar/>

	</div>

	<Tabs/>

</ApplicationShell>
