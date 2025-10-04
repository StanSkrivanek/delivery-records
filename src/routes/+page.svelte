<script lang="ts">
	import type { PageData } from './$types';
	
	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Dashboard - Fleet Management</title>
</svelte:head>

<div class="dashboard">
	<div class="welcome-section">
		<h1>Welcome back, {data.user?.first_name}! 👋</h1>
		<p>Here's what's happening with your fleet today.</p>
	</div>

	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-icon">📦</div>
			<div class="stat-content">
				<h3>Today's Deliveries</h3>
				<p class="stat-value">0</p>
				<span class="stat-label">parcels delivered</span>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">🚚</div>
			<div class="stat-content">
				<h3>Active Vehicles</h3>
				<p class="stat-value">0</p>
				<span class="stat-label">vehicles in fleet</span>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">👥</div>
			<div class="stat-content">
				<h3>Active Drivers</h3>
				<p class="stat-value">0</p>
				<span class="stat-label">drivers on duty</span>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">💰</div>
			<div class="stat-content">
				<h3>Monthly Revenue</h3>
				<p class="stat-value">€0</p>
				<span class="stat-label">this month</span>
			</div>
		</div>
	</div>

	<div class="info-section">
		<div class="info-card">
			<h2>🎉 Welcome to Fleet Management System</h2>
			<p>Your new fleet management system is ready! Here's what you can do:</p>
			<ul>
				<li><strong>Manage Vehicles:</strong> Add and track your delivery vehicles</li>
				<li><strong>Record Deliveries:</strong> Log daily delivery data and expenses</li>
				<li><strong>Track Analytics:</strong> View comprehensive reports and statistics</li>
				<li><strong>Generate Invoices:</strong> Create professional invoices for clients</li>
				<li><strong>Multi-User Support:</strong> Assign drivers to vehicles and track their performance</li>
			</ul>

			{#if data.user?.role === 'super_admin' || data.user?.role === 'org_admin'}
				<div class="admin-notice">
					<strong>⚙️ Admin Quick Start:</strong>
					<ol>
						<li>Go to <a href="/admin/vehicles">Admin → Vehicles</a> to add your fleet</li>
						<li>Add <a href="/admin/users">team members</a> and assign them to vehicles</li>
						<li>Set up <a href="/admin/clients">clients</a> for invoicing</li>
						<li>Start <a href="/records">recording deliveries</a></li>
					</ol>
				</div>
			{/if}
		</div>

		<div class="info-card">
			<h2>📊 Quick Stats</h2>
			<div class="quick-stats">
				<div class="quick-stat">
					<span class="label">Your Role:</span>
					<span class="value">{data.user?.role.replace('_', ' ')}</span>
				</div>
				<div class="quick-stat">
					<span class="label">Account Status:</span>
					<span class="value status-active">Active</span>
				</div>
				<div class="quick-stat">
					<span class="label">Last Login:</span>
					<span class="value">Just now</span>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.dashboard {
		max-width: 1200px;
		margin: 0 auto;
	}

	.welcome-section {
		margin-bottom: 2rem;
	}

	.welcome-section h1 {
		margin: 0 0 0.5rem 0;
		color: #1f2937;
		font-size: 2rem;
	}

	.welcome-section p {
		margin: 0;
		color: #6b7280;
		font-size: 1.1rem;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		display: flex;
		gap: 1rem;
		align-items: flex-start;
		border: 1px solid #e5e7eb;
		transition: all 0.2s;
	}

	.stat-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		transform: translateY(-2px);
	}

	.stat-icon {
		font-size: 2.5rem;
		line-height: 1;
	}

	.stat-content {
		flex: 1;
	}

	.stat-content h3 {
		margin: 0 0 0.5rem 0;
		font-size: 0.875rem;
		color: #6b7280;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stat-value {
		margin: 0 0 0.25rem 0;
		font-size: 2rem;
		font-weight: 700;
		color: #1f2937;
		line-height: 1;
	}

	.stat-label {
		color: #9ca3af;
		font-size: 0.875rem;
	}

	.info-section {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.info-card {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
	}

	.info-card h2 {
		margin: 0 0 1rem 0;
		color: #1f2937;
		font-size: 1.25rem;
	}

	.info-card p {
		color: #4b5563;
		line-height: 1.6;
		margin: 0 0 1rem 0;
	}

	.info-card ul {
		margin: 0;
		padding-left: 1.5rem;
		color: #4b5563;
	}

	.info-card li {
		margin-bottom: 0.5rem;
		line-height: 1.6;
	}

	.admin-notice {
		margin-top: 1.5rem;
		padding: 1rem;
		background: #f0fdf4;
		border: 1px solid #86efac;
		border-radius: 8px;
	}

	.admin-notice strong {
		color: #166534;
		display: block;
		margin-bottom: 0.5rem;
	}

	.admin-notice ol {
		margin: 0.5rem 0 0 0;
		padding-left: 1.5rem;
		color: #166534;
	}

	.admin-notice li {
		margin-bottom: 0.25rem;
	}

	.admin-notice a {
		color: #059669;
		font-weight: 600;
		text-decoration: underline;
	}

	.quick-stats {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.quick-stat {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: #f9fafb;
		border-radius: 6px;
	}

	.quick-stat .label {
		color: #6b7280;
		font-weight: 500;
		font-size: 0.9rem;
	}

	.quick-stat .value {
		color: #1f2937;
		font-weight: 600;
		text-transform: capitalize;
	}

	.status-active {
		color: #059669 !important;
	}

	@media (max-width: 768px) {
		.welcome-section h1 {
			font-size: 1.5rem;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}

		.info-section {
			grid-template-columns: 1fr;
		}

		.info-card {
			padding: 1.5rem;
		}
	}
</style>
