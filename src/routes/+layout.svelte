<script lang="ts">
	import type { LayoutData } from './$types';
	import '../app.css';
	import { Truck } from 'lucide-svelte';

	let { data, children }: { data: LayoutData; children: any } = $props();
</script>

{#if data.user}
	<!-- Authenticated layout -->
	<div class="app-container">
		<header class="app-header">
			<div class="header-content">
				<div class="logo">
					<h1><Truck size={18} style="vertical-align: -2px; margin-right: 6px;" /> Fleet Manager</h1>
				</div>
				
				<nav class="main-nav">
					<a href="/dashboard" class="nav-link">Dashboard</a>
					<a href="/records" class="nav-link">Records</a>
					<a href="/vehicles" class="nav-link">Vehicles</a>
					<a href="/analytics" class="nav-link">Analytics</a>
					
					{#if data.user.role === 'super_admin' || data.user.role === 'org_admin'}
						<a href="/admin" class="nav-link">Admin</a>
					{/if}
				</nav>

				<div class="user-menu">
					<div class="user-info">
						<span class="user-name">{data.user.first_name} {data.user.last_name}</span>
						<span class="user-role">{data.user.role.replace('_', ' ')}</span>
					</div>
					<form method="POST" action="/auth/logout">
						<button type="submit" class="logout-btn">Logout</button>
					</form>
				</div>
			</div>
		</header>

		<main class="app-main">
			{@render children()}
		</main>
	</div>
{:else}
	<!-- Public layout (login page) -->
	{@render children()}
{/if}

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}

	.app-container {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: #f8fafc;
	}

	.app-header {
		background: white;
		border-bottom: 1px solid #e5e7eb;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.header-content {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 1rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 2rem;
		height: 64px;
	}

	.logo h1 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 700;
		color: #1f2937;
	}

	.main-nav {
		display: flex;
		gap: 0.5rem;
		flex: 1;
	}

	.nav-link {
		padding: 0.5rem 1rem;
		color: #4b5563;
		text-decoration: none;
		font-weight: 500;
		border-radius: 6px;
		transition: all 0.2s;
	}

	.nav-link:hover {
		background: #f3f4f6;
		color: #1f2937;
	}

	.user-menu {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.user-info {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.125rem;
	}

	.user-name {
		font-weight: 600;
		color: #1f2937;
		font-size: 0.9rem;
	}

	.user-role {
		font-size: 0.75rem;
		color: #6b7280;
		text-transform: capitalize;
	}

	.logout-btn {
		padding: 0.5rem 1rem;
		background: #ef4444;
		color: white;
		border: none;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.875rem;
	}

	.logout-btn:hover {
		background: #dc2626;
	}

	.app-main {
		flex: 1;
		max-width: 1400px;
		width: 100%;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	@media (max-width: 768px) {
		.header-content {
			flex-wrap: wrap;
			height: auto;
			padding: 0.75rem 1rem;
		}

		.logo h1 {
			font-size: 1rem;
		}

		.main-nav {
			order: 3;
			width: 100%;
			flex-wrap: wrap;
			gap: 0.25rem;
		}

		.nav-link {
			font-size: 0.875rem;
			padding: 0.375rem 0.75rem;
		}

		.user-info {
			display: none;
		}

		.logout-btn {
			font-size: 0.8rem;
			padding: 0.375rem 0.75rem;
		}
	}
</style>
