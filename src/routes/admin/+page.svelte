<script lang="ts">
	import type { PageData } from './$types';
	import {
		Settings,
		Users,
		Truck,
		Building2,
		Landmark,
		UserRound,
		BarChart3,
		CheckCircle2,
		Hammer,
		Hourglass
	} from 'lucide-svelte';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Admin Panel - Fleet Management</title>
</svelte:head>

<div class="admin-page">
	<div class="page-header">
		<h1><Settings size={20} style="vertical-align:-3px;margin-right:6px;" /> Admin Panel</h1>
		<p>Manage your organization, users, vehicles, and settings.</p>
	</div>

	<div class="admin-grid">
		<div class="admin-card disabled">
			<div class="card-icon"><Users /></div>
			<h3>User Management</h3>
			<p>Create and manage user accounts, assign roles and permissions.</p>
			<span class="badge">Phase 2</span>
		</div>

		<div class="admin-card disabled">
			<div class="card-icon"><Truck /></div>
			<h3>Vehicle Management</h3>
			<p>Add vehicles, assign to depots, track maintenance and usage.</p>
			<span class="badge">Phase 2</span>
		</div>

		<div class="admin-card disabled">
			<div class="card-icon"><Building2 /></div>
			<h3>Depot Management</h3>
			<p>Manage depot locations, assign managers, configure settings.</p>
			<span class="badge">Phase 2</span>
		</div>

		<div class="admin-card disabled">
			<div class="card-icon"><Landmark /></div>
			<h3>Organization Settings</h3>
			<p>Update company info, VAT details, bank information, and more.</p>
			<span class="badge">Phase 2</span>
		</div>

		<div class="admin-card disabled">
			<div class="card-icon"><UserRound /></div>
			<h3>Client Management</h3>
			<p>Manage invoice recipients and billing contacts.</p>
			<span class="badge">Phase 5</span>
		</div>

		<div class="admin-card disabled">
			<div class="card-icon"><BarChart3 /></div>
			<h3>Reports & Analytics</h3>
			<p>Generate system-wide reports and analytics.</p>
			<span class="badge">Phase 4</span>
		</div>
	</div>

	<div class="info-section">
		<h2>
			<Hammer size={18} style="vertical-align:-3px;margin-right:6px;" /> Admin Features Under Development
		</h2>
		<p>The full admin panel is being built in Phase 2. Here's what's coming:</p>

		<div class="timeline">
			<div class="timeline-item completed">
				<div class="timeline-marker"><CheckCircle2 /></div>
				<div class="timeline-content">
					<h4>Phase 1: Authentication</h4>
					<p>User login, session management, role-based access control</p>
				</div>
			</div>

			<div class="timeline-item current">
				<div class="timeline-marker"><Hammer /></div>
				<div class="timeline-content">
					<h4>Phase 2: Admin Panel (Next)</h4>
					<p>User CRUD, Vehicle CRUD, Depot management, Settings page</p>
				</div>
			</div>

			<div class="timeline-item">
				<div class="timeline-marker"><Hourglass /></div>
				<div class="timeline-content">
					<h4>Phase 3: Records System</h4>
					<p>Multi-vehicle delivery tracking, image uploads</p>
				</div>
			</div>

			<div class="timeline-item">
				<div class="timeline-marker">⏳</div>
				<div class="timeline-content">
					<h4>Phase 4: Analytics</h4>
					<p>Advanced reporting, charts, export capabilities</p>
				</div>
			</div>

			<div class="timeline-item">
				<div class="timeline-marker">⏳</div>
				<div class="timeline-content">
					<h4>Phase 5: Invoicing</h4>
					<p>Client management, invoice generation, payment tracking</p>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.admin-page {
		max-width: 1200px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: 3rem;
	}

	.page-header h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
		color: #1f2937;
	}

	.page-header p {
		margin: 0;
		color: #6b7280;
		font-size: 1.1rem;
	}

	.admin-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
		margin-bottom: 3rem;
	}

	.admin-card {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		border: 2px solid #e5e7eb;
		position: relative;
		transition: all 0.2s;
	}

	.admin-card.disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.admin-card:not(.disabled):hover {
		border-color: #667eea;
		transform: translateY(-2px);
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
	}

	.card-icon {
		font-size: 2.5rem;
		margin-bottom: 1rem;
	}

	.admin-card h3 {
		margin: 0 0 0.5rem 0;
		color: #1f2937;
		font-size: 1.25rem;
	}

	.admin-card p {
		margin: 0;
		color: #6b7280;
		line-height: 1.5;
	}

	.badge {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: #fef3c7;
		color: #92400e;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.info-section {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		border: 1px solid #e5e7eb;
	}

	.info-section h2 {
		margin: 0 0 1rem 0;
		color: #1f2937;
		font-size: 1.5rem;
	}

	.info-section > p {
		color: #6b7280;
		margin: 0 0 2rem 0;
		line-height: 1.6;
	}

	.timeline {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.timeline-item {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
	}

	.timeline-marker {
		flex-shrink: 0;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		background: #f3f4f6;
		color: #6b7280;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
	}

	.timeline-item.completed .timeline-marker {
		background: #d1fae5;
		color: #059669;
	}

	.timeline-item.current .timeline-marker {
		background: #dbeafe;
		color: #2563eb;
	}

	.timeline-content h4 {
		margin: 0 0 0.25rem 0;
		color: #1f2937;
		font-size: 1rem;
	}

	.timeline-content p {
		margin: 0;
		color: #6b7280;
		font-size: 0.9rem;
		line-height: 1.5;
	}

	@media (max-width: 768px) {
		.admin-grid {
			grid-template-columns: 1fr;
		}

		.page-header h1 {
			font-size: 1.5rem;
		}
	}
</style>
