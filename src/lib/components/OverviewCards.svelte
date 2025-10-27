<script>
	import { calculateVAT, formatCurrency, formatNumber, getMonthName } from '$lib/utils';

	let { analytics, selectedYear, selectedMonth } = $props();
	console.log('🚀 ~ analytics:', analytics);
</script>

<div class="cards-section">
	<div class="period-teal">
		<h2>{getMonthName(selectedMonth - 1)} {selectedYear}</h2>
	</div>

	<div class="cards-grid">
		<div class="block">
			<!-- Total Delivered -->
			<div class="card blue">
				<div class="card-header">
					<h3>Delivered</h3>
				</div>
				<p class="card-value">{analytics.totalDelivered} pcs</p>
				<!-- <p class="label">Total delivered ({getMonthName(selectedMonth - 1)} {selectedYear})</p> -->
				<p class="card-subtitle">Delivered parcels</p>
			</div>
			<!-- Delivery Sum Money -->
			<div class="card success">
				<div class="card-header">
					<h3>Value</h3>
					<span>VAT: {formatCurrency(calculateVAT(analytics.deliverySum))}</span>
				</div>
				<p class="card-value">{formatCurrency(analytics.deliverySum)}</p>
				<p class="card-subtitle">Delivered parcels</p>
			</div>
		</div>
		<div class="block">
			<!-- Total Collected -->
			<div class="card blue">
				<div class="card-header">
					<h3>Collected</h3>
				</div>
				<p class="card-value">{analytics.totalCollected}</p>
				<p class="card-subtitle">Collected</p>
			</div>
			<!-- Collected Sum Money -->
			<div class="card success">
				<div class="card-header">
					<h3>Value</h3>
					<span>VAT: {formatCurrency(calculateVAT(analytics.totalCollected))}</span>
				</div>
				<p class="card-value">{formatCurrency(analytics.collectedSum)}</p>
				<p class="card-subtitle">Collected</p>
			</div>
		</div>

		<div class="block">
			<!-- Average Delivered -->
			<div class="card warning">
				<div class="card-header">
					<h3>Average</h3>
				</div>
				<p class="card-value">{formatNumber(analytics.averagePerDay)}</p>
				<p class="card-subtitle">Parcels / day</p>
			</div>
			<!-- To Invoice -->
			<div class="card purple">
				<div class="card-header">
					<h3>Earned</h3>
					<span>VAT: {formatCurrency(calculateVAT(analytics.toInvoice))}</span>
				</div>
				<p class="card-value">{formatCurrency(analytics.toInvoice)}</p>
				<p class="card-subtitle">Total earnings (no VAT)</p>
			</div>
		</div>
		<div class="block">
			<!-- Total Expenses -->
			<div class="card total">
				<div class="card-header">
					<h3>Expenses</h3>
				</div>
				<p class="card-value">{formatCurrency(analytics.expenseSum)}</p>
				<p class="card-subtitle">Fuel, Car Maintenance, etc.</p>
			</div>

			<!-- Net Profit -->
			<div class="card teal">
				<div class="card-header">
					<h3>Netto</h3>
				</div>
				<p class="card-value">{formatCurrency(analytics.toInvoice - analytics.expenseSum)}</p>
				<p class="card-subtitle">After expences</p>
			</div>
		</div>
	</div>
</div>

<style>
	.cards-section {
		margin-bottom: 3rem;
	}

	.period-teal {
		text-align: center;
		margin-bottom: 2rem;
	}

	.period-teal h2 {
		color: #333;
		font-size: 1.5rem;
		font-weight: 500;
		margin: 0;
	}

	.cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
	}
	.block {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.card {
		background: white;
		/* border-radius: 12px; */
		width: auto;
		text-align: right;
		padding: 1rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		border-left: 12px solid;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	.card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		text-transform: uppercase;
	}

	.card-header h3 {
		margin: 0;
		font-family: 'regular', sans-serif;
		font-size: 1.4rem;
		line-height: 1;
		/* color: var(--color-slate-700); */
		letter-spacing: 0.05rem;
	}
	.card-header span {
		font-size: 0.85rem;
		color: #b3b3b3;
		font-weight: 500;
		letter-spacing: 0.05rem;
	}
	.card-value {
		font-size: 2rem;
		font-weight: 700;
		color: #333;
		margin-bottom: 0.5rem;
		line-height: 1;
		letter-spacing: 0.075rem;
	}

	.card-subtitle {
		font-size: 0.85rem;
		color: #666;
		margin: 0;
	}

	/* Card color themes */
	.card.blue {
		border-left-color: #3c9aff;
	}

	.card.purple {
		border-left-color: #c686ff;
	}

	.card.teal {
		border-left-color: #17a2b8;
	}

	.card.success {
		border-left-color: #61e47f;
	}

	.card.warning {
		border-left-color: #ffc107;
	}

	.card.total {
		border-left-color: #ef5766;
		background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
	}

	.card.total .card-value {
		color: #dc3545;
	}

	@media (max-width: 768px) {
		.cards-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.card {
			padding: 1.25rem;
		}

		.card-value {
			font-size: 1.75rem;
		}
	}

	@media (max-width: 480px) {
		.card-value {
			font-size: 1.5rem;
		}

		.card-header h3 {
			font-size: 0.9rem;
		}
	}
</style>
