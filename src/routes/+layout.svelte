<script>
	//  props we can access {children, data, form}
	import Navigation from '$lib/components/Navigation.svelte';
	let { children } = $props();
	import '../app.css';
</script>

<Navigation />
<main>
	{@render children()}
</main>
