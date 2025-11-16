<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const iconMap: Record<string, string> = {
		backup: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
			<polyline points="7 10 12 15 17 10"/>
			<line x1="12" y1="15" x2="12" y2="3"/>
		</svg>`,
		revenue: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<line x1="12" y1="1" x2="12" y2="23"/>
			<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
		</svg>`,
		invoice: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
			<polyline points="14 2 14 8 20 8"/>
			<line x1="16" y1="13" x2="8" y2="13"/>
			<line x1="16" y1="17" x2="8" y2="17"/>
			<polyline points="10 9 9 9 8 9"/>
		</svg>`,
		odometer: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="12" cy="12" r="10"/>
			<polyline points="12 6 12 12 16 14"/>
		</svg>`
	};
</script>

<svelte:head>
	<title>Tools & Reports - Delivery Records</title>
	<meta
		name="description"
		content="Access database backups, revenue reports, invoices, and odometer tracking"
	/>
</svelte:head>

<div class="tools-container">
	<header class="page-header">
		<h1>Tools & Reports</h1>
		<p class="page-description">
			Access important tools for managing your delivery records, generating reports, and maintaining
			your database.
		</p>
	</header>

	<div class="tools-grid">
		{#each data.tools as tool}
			<a href={tool.href} class="tool-card {tool.color}">
				<div class="tool-icon">
					{@html iconMap[tool.icon]}
				</div>
				<div class="tool-content">
					<h2>{tool.title}</h2>
					<p>{tool.description}</p>
				</div>
				<div class="tool-arrow">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="m9 18 6-6-6-6" />
					</svg>
				</div>
			</a>
		{/each}
	</div>
</div>

<style>
	.tools-container {
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 3rem 2rem;
	}

	.page-header {
		max-width: 1200px;
		margin: 0 auto 3rem;
		text-align: center;
		color: white;
	}

	.page-header h1 {
		font-size: 2.5rem;
		font-weight: 700;
		margin: 0 0 1rem;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.page-description {
		font-size: 1.125rem;
		opacity: 0.95;
		max-width: 600px;
		margin: 0 auto;
		line-height: 1.6;
	}

	.tools-grid {
		max-width: 1200px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
	}

	.tool-card {
		background: white;
		border-radius: 1rem;
		padding: 2rem;
		text-decoration: none;
		color: inherit;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		transition: all 0.3s ease;
		box-shadow:
			0 4px 6px rgba(0, 0, 0, 0.1),
			0 2px 4px rgba(0, 0, 0, 0.06);
		position: relative;
		overflow: hidden;
	}

	.tool-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		transition: height 0.3s ease;
	}

	.tool-card.blue::before {
		background: linear-gradient(135deg, #3b82f6, #2563eb);
	}

	.tool-card.green::before {
		background: linear-gradient(135deg, #10b981, #059669);
	}

	.tool-card.purple::before {
		background: linear-gradient(135deg, #8b5cf6, #7c3aed);
	}

	.tool-card.orange::before {
		background: linear-gradient(135deg, #f59e0b, #d97706);
	}

	.tool-card:hover {
		transform: translateY(-4px);
		box-shadow:
			0 12px 24px rgba(0, 0, 0, 0.15),
			0 6px 12px rgba(0, 0, 0, 0.1);
	}

	.tool-card:hover::before {
		height: 100%;
		opacity: 0.05;
	}

	.tool-icon {
		width: 64px;
		height: 64px;
		border-radius: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.3s ease;
	}

	.tool-card.blue .tool-icon {
		background: linear-gradient(135deg, #dbeafe, #bfdbfe);
		color: #2563eb;
	}

	.tool-card.green .tool-icon {
		background: linear-gradient(135deg, #d1fae5, #a7f3d0);
		color: #059669;
	}

	.tool-card.purple .tool-icon {
		background: linear-gradient(135deg, #ede9fe, #ddd6fe);
		color: #7c3aed;
	}

	.tool-card.orange .tool-icon {
		background: linear-gradient(135deg, #fed7aa, #fdba74);
		color: #d97706;
	}

	.tool-card:hover .tool-icon {
		transform: scale(1.1);
	}

	.tool-content {
		flex: 1;
	}

	.tool-content h2 {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 0.5rem;
		color: #111827;
	}

	.tool-content p {
		font-size: 0.95rem;
		color: #6b7280;
		margin: 0;
		line-height: 1.6;
	}

	.tool-arrow {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		color: #9ca3af;
		transition: all 0.3s ease;
	}

	.tool-card:hover .tool-arrow {
		color: #4b5563;
		transform: translateX(4px);
	}

	@media (max-width: 768px) {
		.tools-container {
			padding: 2rem 1rem;
		}

		.page-header h1 {
			font-size: 2rem;
		}

		.page-description {
			font-size: 1rem;
		}

		.tools-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.tool-card {
			padding: 1.5rem;
		}
	}
</style>
