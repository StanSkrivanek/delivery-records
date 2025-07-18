<script>
    import { formatCurrency, formatNumber, getMonthName } from '$lib/utils';

    let { analytics, selectedYear, selectedMonth } = $props();
    // console.log('🚀 ~ analytics:', analytics);
</script>

<div class="cards-section">
	<div class="period-info">
		<h2>{getMonthName(selectedMonth - 1)} {selectedYear}</h2>
	</div>

	<div class="cards-grid">
		<div class="block">
			<!-- Total Delivered -->
			<div class="card primary">
				<div class="card-header">
					<h3>Total Delivered</h3>
					<!-- <div class="card-icon">📦</div> -->
				</div>
				<div class="card-value">{analytics.totalDelivered.toLocaleString()}</div>
				<div class="card-subtitle">Delivered</div>
			</div>
			<!-- Delivery Sum Money -->
			<div class="card success">
				<div class="card-header">
					<h3>Delivery Sum</h3>
					<!-- <div class="card-icon">💰</div> -->
				</div>
				<div class="card-value">{formatCurrency(analytics.deliverySum)}</div>
				<div class="card-subtitle">Delivered</div>
			</div>
		</div>
		<div class="block">
			<!-- Total Collected -->
			<div class="card primary">
				<div class="card-header">
					<h3>Total Collected</h3>
					<!-- <div class="card-icon">📋</div> -->
				</div>
				<div class="card-value">{analytics.totalCollected.toLocaleString()}</div>
				<div class="card-subtitle">Collected</div>
			</div>
			<!-- Collected Sum Money -->
			<div class="card success">
				<div class="card-header">
					<h3>Collected Sum</h3>
					<!-- <div class="card-icon">💵</div> -->
				</div>
				<div class="card-value">{formatCurrency(analytics.collectedSum)}</div>
				<div class="card-subtitle">Collected</div>
			</div>
		</div>

		<div class="block">
			<!-- To Invoice -->
			<div class="card secondary">
				<div class="card-header">
					<h3>To Invoice</h3>
					<!-- <div class="card-icon">🧾</div> -->
				</div>
				<div class="card-value">{formatCurrency(analytics.toInvoice)}</div>
				<div class="card-subtitle">Total amount to invoice</div>
			</div>
			<!-- Average Delivered -->
			<div class="card warning">
				<div class="card-header">
					<h3>Average</h3>
					<!-- <div class="card-icon">📊</div> -->
				</div>
				<div class="card-value">{formatNumber(analytics.averagePerDay)}</div>
				<div class="card-subtitle">Parcels / day</div>
			</div>
		</div>
		<div class="block">
			<!-- Total Expenses -->
			<div class="card total">
				<div class="card-header">
					<h3>Expenses</h3>
					<!-- <div class="card-icon">💵</div> -->
				</div>
				<div class="card-value">{formatCurrency(analytics.expenseSum)}</div>
				<div class="card-subtitle">Fuel, Car Maintenance, etc.</div>
			</div>

			<!-- Balance -->
			<div class="card info">
				<div class="card-header">
					<h3>Ballance</h3>
					<!-- <div class="card-icon">🧾</div> -->
				</div>
				<div class="card-value">{formatCurrency(analytics.toInvoice - analytics.expenseSum)}</div>
				<div class="card-subtitle">Netto amount</div>
			</div>
		</div>
	</div>
</div>

<style>
	.cards-section {
		margin-bottom: 3rem;
	}

	.period-info {
		text-align: center;
		margin-bottom: 2rem;
	}

	.period-info h2 {
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
		padding: 1rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		border-left: 4px solid;
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
	}

	.card-header h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 500;
		color: #555;
	}

	/* .card-icon {
    font-size: 1.5rem;
    opacity: 0.8;
  } */

	.card-value {
		font-size: 2rem;
		font-weight: 700;
		color: #333;
		margin-bottom: 0.5rem;
		line-height: 1;
	}

	.card-subtitle {
		font-size: 0.85rem;
		color: #666;
		margin: 0;
	}

	/* Card color themes */
	.card.primary {
		border-left-color: #007bff;
	}

	.card.secondary {
		border-left-color: #6c757d;
	}

	.card.info {
		border-left-color: #17a2b8;
	}

	.card.success {
		border-left-color: #28a745;
	}

	.card.warning {
		border-left-color: #ffc107;
	}

	.card.total {
		border-left-color: #dc3545;
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
