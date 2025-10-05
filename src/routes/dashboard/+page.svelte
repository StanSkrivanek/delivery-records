<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Dashboard - Fleet Management</title>
</svelte:head>

<div class="dashboard">
	<h1>Welcome back, {data.user?.first_name || 'User'}!</h1>
	<p>This is your dashboard. We’ll add stats and quick links here.</p>
</div>

<style>
	.dashboard { max-width: 1100px; margin: 0 auto; padding: 2rem 1rem; }
	h1 { margin: 0 0 0.5rem 0; }
	p { color: #6b7280; }
</style>
