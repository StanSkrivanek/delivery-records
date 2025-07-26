<script>
	import BarGroups from '$lib/components/charts/BarGoups.svelte';
	import { dlvPd, getMonthName } from '$lib/utils.js';
	let { data } = $props();
	// console.log('🚀 ~ data:', data.monthly);
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
	// console.log('🚀 ~ monthly:', monthly);
	const deliverySum = monthly.reduce((acc, item) => acc + item.delivery, 0);
	const collectionSum = monthly.reduce((acc, item) => acc + item.collections, 0);
	const failsSum = monthly.reduce((acc, item) => acc + item.fails, 0);
	const currentMonth = new Date().getMonth();
</script>

<svelte:head>
	<title>Monthly Overview</title>
</svelte:head>

<header>
	<h1>Monthly Overview</h1>
</header>
<BarGroups
	title="Delivery Records - {getMonthName(currentMonth)} "
	data={monthly}
	xKey="date"
	yKeys={['delivery', 'collections', 'fails']}
	height="480"
	fillMissingDates={false}
/>
<div class="cards-grid">
	<!-- Total Delivered -->
	<div class="card green">
		<div class="card-header">
			<h3>Delivered</h3>
		</div>
		<p class="card-value">{deliverySum} pcs</p>
		<!-- <p class="label">Total delivered ({getMonthName(selectedMonth)} {selectedYear})</p> -->
		<p class="card-subtitle">Delivered parcels</p>
	</div>
	<!-- Collected Sum  -->
	<div class="card blue">
		<div class="card-header">
			<h3>Collected</h3>
		</div>
		<p class="card-value">{collectionSum} pcs</p>
		<p class="card-subtitle">Collected</p>
	</div>
	<!-- Fails Sum  -->
	<div class="card red">
		<div class="card-header">
			<h3>Fails</h3>
		</div>
		<p class="card-value">{failsSum} pcs</p>
		<p class="card-subtitle">Failed deliveries</p>
	</div>
</div>

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
	.cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
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

	/* .card.purple {
		border-left-color: #c686ff;
		background: linear-gradient(135deg, #dcedff  0%, #fff 100%);
	} */

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
