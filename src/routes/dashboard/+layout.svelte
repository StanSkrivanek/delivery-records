<script lang="ts">
	import { page } from '$app/stores';
	import { Truck, BarChart3, FileText, Gauge, ClipboardList, Car, DollarSign } from 'lucide-svelte';

	let { children } = $props();

	const navItems = [
		{ href: '/dashboard', label: 'Dashboard', icon: Truck },
		{ href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
		{ href: '/dashboard/invoice', label: 'Invoice', icon: FileText },
		{ href: '/dashboard/odometer', label: 'Odometer', icon: Gauge },
		{ href: '/dashboard/records', label: 'Records', icon: ClipboardList },
		{ href: '/dashboard/vehicles', label: 'Vehicles', icon: Car },
		{ href: '/dashboard/revenue', label: 'Revenue', icon: DollarSign },
		{ href: '/dashboard/revenue-returns', label: 'VAT Returns', icon: DollarSign }
	];
</script>

<div class="dashboard">
	<aside class="sidebar">
		<div class="brand">
			<Truck size={18} style="vertical-align: -2px; margin-right: 6px;" />
			<span>Fleet Manager</span>
		</div>
		<nav>
			{#each navItems as item}
				<a
					href={item.href}
					class="nav-link {$page.url.pathname.startsWith(item.href) ? 'active' : ''}"
					aria-current={$page.url.pathname.startsWith(item.href) ? 'page' : undefined}
				>
					<item.icon size={18} />
					<span>{item.label}</span>
				</a>
			{/each}
		</nav>
	</aside>

	<main class="content">
		{@render children()}
	</main>
</div>

<style>
	.dashboard {
		display: grid;
		grid-template-columns: 240px 1fr;
		min-height: 100vh;
	}
	.sidebar {
		background: #0b1220;
		color: #e5e7eb;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 700;
		color: #fff;
	}
	nav {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.nav-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #cbd5e1;
		text-decoration: none;
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
	}
	.nav-link:hover {
		background: #111827;
		color: #fff;
	}
	.nav-link.active {
		background: #1f2937;
		color: #fff;
	}
	.content {
		background: #f8fafc;
		padding: 1rem;
	}

	@media (max-width: 900px) {
		.dashboard {
			grid-template-columns: 64px 1fr;
		}
		.nav-link span,
		.brand span {
			display: none;
		}
	}
</style>
