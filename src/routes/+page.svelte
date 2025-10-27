<script lang="ts">
	import BarGroups from '$lib/components/charts/BarGoups.svelte';
	import { calculateAnalytics, dlvPd, getMonthName } from '$lib/utils.js';
	let { data } = $props();

	// Map through each record in the array and process it, or process the entire array
	// const delivery = data.monthly.map((record) => dlvPd(record));
	const monthly = data.monthly.map((item) => {
		return {
			date: item.entry_date,
			delivery: dlvPd(item),
			collections: (item.collected ?? 0) + (item.cutters ?? 0),
			fails: (item.returned ?? 0) + (item.missplaced ?? 0)
		};
	});

	const sum = calculateAnalytics(data.monthly);

	const currentMonth = new Date().getMonth();
	const currentYear = new Date().getFullYear();
	const successRate =
		Number(((sum.totalDelivered / (sum.totalDelivered + sum.returnedSum)) * 100).toFixed(2)) || 0;
	const latestOdometer = data.getLatestOdometer ? data.getLatestOdometer : 0;

	// Group yearly data by month
	const monthlyData = Array.from({ length: 12 }, (_, i) => {
		const monthNumber = i + 1;
		const monthRecords = data.yearly.filter((record) => {
			const recordDate = new Date(record.entry_date);
			return recordDate.getMonth() === i;
		});

		if (monthRecords.length === 0) {
			return {
				month: i,
				monthName: getMonthName(i + 1),
				hasData: false,
				totalDelivered: 0,
				totalCollected: 0,
				returnedSum: 0,
				successRate: 0,
				averagePerDay: '0.00',
				totalDistance: 0,
				recordCount: 0
			};
		}

		const analytics = calculateAnalytics(monthRecords);
		// Get the latest odometer reading for the month (not the sum)
		const latestOdometer = Math.max(...monthRecords.map((record) => record.odometer ?? 0));
		const successRate =
			Number(
				(
					(analytics.totalDelivered / (analytics.totalDelivered + analytics.returnedSum)) *
					100
				).toFixed(2)
			) || 0;

		return {
			month: i,
			monthName: getMonthName(i + 1),
			hasData: true,
			totalDelivered: analytics.totalDelivered,
			totalCollected: analytics.totalCollected,
			returnedSum: analytics.returnedSum,
			successRate,
			averagePerDay: analytics.averagePerDay,
			totalDistance: latestOdometer,
			recordCount: monthRecords.length
		};
	});

	// const deliverySum = monthly.reduce((acc, item) => acc + item.delivery, 0);
	// const collectionSum = monthly.reduce((acc, item) => acc + item.collections, 0);
	// const failsSum = monthly.reduce((acc, item) => acc + item.fails, 0);

	// get current computed CSS prpps and avlues paplied to <body> element
</script>

<svelte:head>
	<title>Monthly Overview</title>
</svelte:head>

<header>
	<h1>{getMonthName(currentMonth)} {new Date().getFullYear()}</h1>
</header>
<BarGroups
	title="Delivery"
	data={monthly}
	xKey="date"
	yKeys={['delivery', 'collections', 'fails']}
	height="480"
	fillMissingDates={true}
/>
<div class="cards-grid">
	<!-- Total Delivered -->
	<div class="card green">
		<div class="card-header">
			<h3>Delivered</h3>
		</div>
		<p class="card-value">{sum.totalDelivered} pcs</p>
		<!-- <p class="label">Total delivered ({getMonthName(selectedMonth)} {selectedYear})</p> -->
		<p class="card-subtitle">Delivered parcels</p>
	</div>
	<!-- Collected Sum  -->
	<div class="card blue">
		<div class="card-header">
			<h3>Collected</h3>
		</div>
		<p class="card-value">{sum.totalCollected} pcs</p>
		<p class="card-subtitle">Collected</p>
	</div>
	<!-- Fails Sum  -->
	<div class="card red">
		<div class="card-header">
			<h3>Fails</h3>
		</div>
		<p class="card-value">{sum.returnedSum} pcs</p>
		<p class="card-subtitle">Failed deliveries</p>
	</div>
	<div class="card purple">
		<div class="card-header">
			<h3>Rate</h3>
		</div>
		<p class="card-value">{successRate} %</p>
		<p class="card-subtitle">Success Rate</p>
	</div>
	<div class="card">
		<div class="card-header">
			<h3>Average</h3>
		</div>
		<p class="card-value">{sum.averagePerDay} pcs</p>
		<p class="card-subtitle">Average pcs / day</p>
	</div>
	<div class="card">
		<div class="card-header">
			<h3>Odometer</h3>
		</div>
		<p class="card-value">{latestOdometer} km</p>
		<p class="card-subtitle">Odometer in km</p>
	</div>
</div>

<!-- Yearly Summary Section -->
<section class="yearly-section">
	<header>
		<h2>Year {currentYear} Summary</h2>
	</header>
	<div class="monthly-cards-grid">
		{#each monthlyData as monthData}
			<div class="month-card {monthData.hasData ? '' : 'no-data'}">
				<div class="month-card-header">
					<h3>{monthData.monthName}</h3>
					{#if monthData.hasData}
						<span class="record-count">{monthData.recordCount} days</span>
					{/if}
				</div>
				{#if monthData.hasData}
					<div class="month-stats">
						<div class="stat-row">
							<span class="stat-label">Delivered:</span>
							<span class="stat-value green-text">{monthData.totalDelivered}</span>
						</div>
						<div class="stat-row">
							<span class="stat-label">Collected:</span>
							<span class="stat-value blue-text">{monthData.totalCollected}</span>
						</div>
						<div class="stat-row">
							<span class="stat-label">Fails:</span>
							<span class="stat-value red-text">{monthData.returnedSum}</span>
						</div>
						<div class="stat-row">
							<span class="stat-label">Success Rate:</span>
							<span class="stat-value purple-text">{monthData.successRate}%</span>
						</div>
						<div class="stat-row">
							<span class="stat-label">Delivery Avg/day:</span>
							<span class="stat-value">{monthData.averagePerDay}</span>
						</div>
						<div class="stat-row">
							<span class="stat-label">Odometer:</span>
							<span class="stat-value">{monthData.totalDistance.toLocaleString()} km</span>
						</div>
					</div>
				{:else}
					<p class="no-data-message">No data</p>
				{/if}
			</div>
		{/each}
	</div>
</section>

<!-- 	yLabels={['Delivery', 'Collections', 'Fails']}
	xLabel="Date"
	xType="time"
	yType="linear"
	yMin={0}
	yMax={Math.max(...monthly.map((item) => Math.max(item.delivery, item.collections, item.fails)))}
	yTickFormat={(d) => d.toLocaleString()}
	xTickFormat={(d) => new Date(d).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric'
	})}
	tooltipFormat={(d) => new Date(d).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	})}
	tooltipLabelFormat={(d) => new Date(d).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	})}
	tooltipValueFormat={(d) => d.toLocaleString()}
	tooltipLabel="Date"		
	fillMissingDates={true} -->

<style>
	header {
		text-align: center;
		margin-bottom: 2rem;
		font-size: 2.5rem;
		font-family: 'regular', sans-serif;
	}

	.yearly-section {
		margin-top: 4rem;
		padding-top: 3rem;
		border-top: 2px solid #e5e7eb;
	}

	.yearly-section header h2 {
		text-align: center;
		margin-bottom: 2rem;
		font-size: 2rem;
		font-family: 'regular', sans-serif;
		color: #374151;
		text-transform: uppercase;
		letter-spacing: 0.05rem;
	}

	.monthly-cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 1.25rem;
	}

	.month-card {
		background: white;
		border-radius: 0.25rem;
		padding: 1.25rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		border-left: 6px solid #3c9aff;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	.month-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
	}

	.month-card.no-data {
		opacity: 0.4;
		border-left-color: #d1d5db;
	}

	.month-card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.month-card-header h3 {
		margin: 0;
		font-family: 'regular', sans-serif;
		font-size: 1.25rem;
		color: #374151;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05rem;
	}

	.record-count {
		font-size: 0.75rem;
		color: #6b7280;
		background: #f3f4f6;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
	}

	.month-stats {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.stat-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.9rem;
	}

	.stat-label {
		color: #6b7280;
		font-weight: 500;
	}

	.stat-value {
		font-weight: 700;
		color: #374151;
	}

	.green-text {
		color: #10b981;
	}

	.blue-text {
		color: #3c9aff;
	}

	.red-text {
		color: #ef5766;
	}

	.purple-text {
		color: #a855f7;
	}

	.no-data-message {
		text-align: center;
		color: #9ca3af;
		font-style: italic;
		margin: 1rem 0;
	}

	.cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.card {
		background: white;
		border-radius: 0.25rem;
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
		/* background: linear-gradient(135deg, #dcedff  0%, #fff 100%); */
	}
	.card.red {
		border-left-color: #ef5766;
		/* background: linear-gradient(135deg, #ffe9f0 0%, #fff 100%); */
	}
	.card.green {
		border-left-color: #61e47f;
		/* background: linear-gradient(135deg, #dcffe4 0%, #fff 100%); */
	}

	/* .card.yellow {
		border-left-color: #ffc107;
	} */

	.card.purple {
		border-left-color: #c686ff;
		/* background: linear-gradient(90deg, #c686ff  0%, #fff 100%); */
	}

	@media (max-width: 768px) {
		.cards-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.monthly-cards-grid {
			grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
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
		.monthly-cards-grid {
			grid-template-columns: 1fr;
		}

		.card-value {
			font-size: 1.5rem;
		}

		.card-header h3 {
			font-size: 0.9rem;
		}
	}
</style>
