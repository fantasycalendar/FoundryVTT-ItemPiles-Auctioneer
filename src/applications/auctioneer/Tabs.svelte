<script>

	import { getContext } from "svelte";

	const store = getContext("store");

</script>

<div class="tabs">
	{#each Object.entries($store.tabs) as [key, tab]}
		<div class="tab" class:active={key === $store.activeTab} on:click={() => { $store.activeTab = key }}>
			<div class="shadow-tab"></div>
			<span>{tab.label}</span>
		</div>
	{/each}
</div>

<style lang="scss">

  .tabs {
	  display: flex;
	  align-items: flex-start;
    position: absolute;
    bottom: -30px;
    max-height: 30px;

	  .tab {
		  height: 25px;
		  text-align: center;
		  min-width: 50px;
      position: relative;
		  margin-right: 0.25rem;
      padding: 5px;
      background-color: #e3ded2;
		  border-bottom-left-radius: 5px;
		  border-bottom-right-radius: 5px;
		  overflow: hidden;
		  border: 1px solid var(--item-piles-border-dark-primary);
		  border-top: 0;

		  cursor: pointer;

		  &:hover {
        box-shadow: inset 0 0 15px 0 rgba(255,100,0,0.5);
		  }

		  &.active {
			  padding-top: 13px;
			  height: 35px;
        box-shadow: inset 0 0 15px 0 rgba(255,100,0,1);
		  }

		  .shadow-tab {
			  top: 0;
			  left: 0;
			  position: absolute;
			  width: 100%;
			  height: 100%;
        box-shadow: inset 0 15px 5px -10px rgba(0,0,0,0.5);
			  z-index: 1;
		  }
	  }
  }

</style>
