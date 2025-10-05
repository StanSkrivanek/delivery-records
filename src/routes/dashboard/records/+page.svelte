<script lang="ts">
	import type { PageData } from './$types';
	import { Wrench } from 'lucide-svelte';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Records - Fleet Management</title>
</svelte:head>

<div class="placeholder-page">
	<div class="placeholder-card">
		<div class="icon"><Wrench size={48} /></div>
		<h1>Records System Coming Soon</h1>
		<p>The delivery records feature is being updated for the new multi-vehicle system.</p>
		
		<div class="info-box">
			<h3>What's Coming in Phase 3:</h3>
			<ul>
				<li>✅ Select vehicle for each delivery</li>
				<li>✅ Multi-driver support</li>
				<li>✅ Enhanced record tracking</li>
				<li>✅ Image uploads</li>
				<li>✅ Odometer management</li>
				<li>✅ Vehicle usage logs</li>
			</ul>
		</div>

		<div class="next-steps">
			<p><strong>Next Step:</strong> Set up your vehicles first!</p>
			<a href="/admin/vehicles" class="btn-primary">Go to Vehicle Management</a>
			<a href="/dashboard" class="btn-secondary">Back to Dashboard</a>
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
		max-width: 600px;
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
		line-height: 1.6;
	}

	.info-box {
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 2rem;
		text-align: left;
	}

	.info-box h3 {
		margin: 0 0 1rem 0;
		color: #374151;
		font-size: 1rem;
	}

	.info-box ul {
		margin: 0;
		padding-left: 1.5rem;
		color: #4b5563;
	}

	.info-box li {
		margin-bottom: 0.5rem;
		line-height: 1.5;
	}

	.next-steps {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: center;
	}

	.next-steps p {
		margin: 0 0 1rem 0;
		color: #374151;
	}

	.btn-primary,
	.btn-secondary {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-weight: 600;
		text-decoration: none;
		transition: all 0.2s;
		min-width: 200px;
	}

	.btn-primary {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
	}

	.btn-secondary {
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
	}

	.btn-secondary:hover {
		background: #e5e7eb;
	}

	@media (max-width: 640px) {
		.placeholder-card {
			padding: 2rem 1.5rem;
		}

		h1 {
			font-size: 1.5rem;
		}

		.icon {
			font-size: 3rem;
		}
	}
</style>
