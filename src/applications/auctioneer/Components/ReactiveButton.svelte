<script>

	export let disabled;
	export let completelyDisable = false;
	export let callback = () => {
	}

	let disabledCallback = false;

	async function runCallback() {
		if(disabledCallback) return;
		disabledCallback = true;
		await callback();
		if(!completelyDisable) {
			setTimeout(() => {
				disabledCallback = false;
			}, 100);
		}
	}

</script>

<button {disabled} on:click={() => runCallback()} type="button">
	<slot/>
</button>

<style>
    button {
        min-width: 75px;
        height: 20px;
        line-height: 10px;
        margin-left: 0.25rem;
    }
</style>
