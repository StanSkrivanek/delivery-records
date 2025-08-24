<!-- src/routes/invoice/+page.svelte -->
<script lang="ts">
	import Invoice from '$lib/components/Invoice.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Invoice Generator - Delivery Services</title>
	<meta name="description" content="Generate monthly invoices for your delivery services" />
</svelte:head>

<div class="page-container">
	<Invoice
		availableYears={data.availableYears}
		availableMonths={data.availableMonths}
		defaultYear={data.defaultYear}
		defaultMonth={data.defaultMonth}
	/>
</div>

<style>
	.page-container {
		min-height: 100vh;
		background: #f8fafc;
		padding: 2rem 0;
	}

	@media (max-width: 768px) {
		.page-container {
			padding: 1rem 0;
		}
	}
</style>