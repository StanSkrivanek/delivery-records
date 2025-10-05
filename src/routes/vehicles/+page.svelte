<script lang="ts">
	import type { PageData } from './$types';
	import { Truck } from 'lucide-svelte';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Vehicles - Fleet Management</title>
</svelte:head>

<div class="placeholder-page">
	<div class="placeholder-card">
		<div class="icon"><Truck size={48} /></div>
		<h1>Vehicle Management</h1>
		<p>Set up and manage your delivery fleet.</p>
		
		<div class="info-box warning">
			<h3>⚠️ Admin Panel Coming in Phase 2</h3>
			<p>Vehicle management UI is being developed. For now, you can add vehicles via SQL.</p>
		</div>

		<div class="sql-example">
			<h3>Temporary: Add Vehicle via SQL</h3>
			<pre><code>-- Via Supabase Studio (SQL) or psql
INSERT INTO public.vehicles (
  organization_id, 
  license_plate, 
  make, 
  model, 
  is_active
) VALUES (
  1, 
  '25-D-12345', 
  'Mercedes', 
  'Sprinter', 
  true
);
</code></pre>
		</div>

		<div class="next-steps">
			<a href="/" class="btn-secondary">Back to Dashboard</a>
		</div>
	</div>
</div>

<style>
	.placeholder-page {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
		padding: 2rem;
	}

	.placeholder-card {
		background: white;
		border-radius: 16px;
		padding: 3rem;
		max-width: 700px;
		width: 100%;
		text-align: center;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
	}

	.icon {
		margin-bottom: 1rem;
	}

	h1 {
		margin: 0 0 1rem 0;
		color: #1f2937;
		font-size: 1.75rem;
	}

	p {
		color: #6b7280;
		margin: 0 0 2rem 0;
		font-size: 1.1rem;
	}

	.info-box {
		background: #fef3c7;
		border: 1px solid #fbbf24;
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 2rem;
		text-align: left;
	}

	.info-box h3 {
		margin: 0 0 0.5rem 0;
		color: #92400e;
		font-size: 1rem;
	}

	.info-box p {
		margin: 0;
		color: #78350f;
		font-size: 0.95rem;
	}

	.sql-example {
		background: #1f2937;
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 2rem;
		text-align: left;
	}

	.sql-example h3 {
		margin: 0 0 1rem 0;
		color: #f3f4f6;
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.sql-example pre {
		margin: 0;
		overflow-x: auto;
	}

	.sql-example code {
		color: #10b981;
		font-family: 'Monaco', 'Courier New', monospace;
		font-size: 0.85rem;
		line-height: 1.6;
	}

	.next-steps {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	.btn-secondary {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-weight: 600;
		text-decoration: none;
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
		transition: all 0.2s;
	}

	.btn-secondary:hover {
		background: #e5e7eb;
	}

	@media (max-width: 640px) {
		.placeholder-card {
			padding: 2rem 1.5rem;
		}

		.sql-example {
			padding: 1rem;
		}

		.sql-example code {
			font-size: 0.75rem;
		}
	}
</style>
