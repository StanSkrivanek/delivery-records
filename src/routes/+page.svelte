<script lang="ts">
	// public landing, no data required
	import { Package, Truck, BarChart3, ReceiptText } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Fleet Management SaaS - Deliver smarter</title>
</svelte:head>

<div class="landing">
	<header class="hero">
		<h1>Fleet Management SaaS</h1>
		<p>Track deliveries, vehicles and invoices — all in one place.</p>
		<div class="cta">
			<a class="btn primary" href="/auth/register">Get started</a>
			<a class="btn" href="/auth/login">Sign in</a>
		</div>
	</header>

	<section class="features">
		<div class="feat">
			<Package size={28} />
			<h3>Delivery records</h3>
			<p>Fast daily entry with images and notes.</p>
		</div>
		<div class="feat">
			<Truck size={28} />
			<h3>Vehicle tracking</h3>
			<p>Odometer, assignments and usage logs.</p>
		</div>
		<div class="feat">
			<BarChart3 size={28} />
			<h3>Analytics</h3>
			<p>Performance and revenue insights.</p>
		</div>
		<div class="feat">
			<ReceiptText size={28} />
			<h3>Invoices</h3>
			<p>Generate client invoices in one click.</p>
		</div>
	</section>
</div>

<style>
	.landing {
		max-width: 1100px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}
	.hero {
		text-align: center;
		padding: 3rem 0;
	}
	.hero h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2.25rem;
		color: #111827;
	}
	.hero p {
		margin: 0 0 1.25rem 0;
		color: #6b7280;
		font-size: 1.1rem;
	}
	.cta {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
	}
	.btn {
		display: inline-block;
		padding: 0.75rem 1.25rem;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		text-decoration: none;
		color: #111827;
		font-weight: 600;
	}
	.btn.primary {
		background: #111827;
		color: white;
		border-color: #111827;
	}
	.features {
		margin-top: 3rem;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1rem;
	}
	.feat {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 1rem;
		text-align: center;
	}
	.feat :global(svg) {
		display: block;
		margin: 0 auto;
	}
	.feat h3 {
		margin: 0.5rem 0 0.25rem;
	}
	.feat p {
		margin: 0;
		color: #6b7280;
	}
</style>
