<!-- src/routes/odometer/+page.svelte -->
<script lang="ts">
	import type { PageData } from './$types';
	// import type { OdometerReading } from '$lib/types';
	import { formatDate, formatDistance, formatOdometer, getDistanceColorClass } from '$lib/utils';
	// Get data from server load function
	let { data }: { data: PageData } = $props();
	console.log('🚀 ~ data:', data);

	// Reactive state for UI§
	let loading = $state(false);

	// Current values from server data
	let selectedYear = $state(data.defaultYear);
	let selectedMonth = $state(data.defaultMonth);
	// Month options with names
	const monthOptions = [
		{ value: 1, label: 'January' },
		{ value: 2, label: 'February' },
		{ value: 3, label: 'March' },
		{ value: 4, label: 'April' },
		{ value: 5, label: 'May' },
		{ value: 6, label: 'June' },
		{ value: 7, label: 'July' },
		{ value: 8, label: 'August' },
		{ value: 9, label: 'September' },
		{ value: 10, label: 'October' },
		{ value: 11, label: 'November' },
		{ value: 12, label: 'December' }
	];

	function monthlyDistance() {
		return data.odoByMonth.reduce((acc, reading) => acc + (reading.daily_difference ?? 0), 0);
	}

	// let availableMonthsForYear: number[] = $derived.by(() => {
	// 	const monthsInYear = new Set<number>();
	// 	data.odometerReadings.forEach((reading) => {
	// 		const dateString = reading.entry_date || reading.created_at;
	// 		if (dateString) {
	// 			const recordDate = new Date(dateString);
	// 			if (recordDate.getFullYear() === selectedYear) {
	// 				monthsInYear.add(recordDate.getMonth() + 1);
	// 			}
	// 		}
	// 	});
	// 	return Array.from(monthsInYear).sort((a, b) => a - b);
	// });
	// $inspect('🚀 ~ availableMonthsForYear:', availableMonthsForYear);

	// const filtereddata = $derived.by(() => {
	// 	return data.odometerReadings.filter((reading) => {
	// 		const dateString = reading.entry_date || reading.created_at;
	// 		if (!dateString) return false;
	// 		const recordDate = new Date(dateString);
	// 		return (
	// 			recordDate.getFullYear() === selectedYear && recordDate.getMonth() + 1 === selectedMonth
	// 		);
	// 	});
	// });

	// Function to update URL and reload data
	// async function updateSelection() {
	// 	loading = true;
	// 	const url = new URL(page.url);
	// 	url.searchParams.set('year', selectedYear.toString());
	// 	url.searchParams.set('month', selectedMonth.toString());

	// 	// Navigate to new URL, which will trigger server load
	// 	await goto(url.toString(), { replaceState: true });
	// 	loading = false;
	// }

	// Derived values for month names
	// const monthNames = $derived([
	// 	'January',
	// 	'February',
	// 	'March',
	// 	'April',
	// 	'May',
	// 	'June',
	// 	'July',
	// 	'August',
	// 	'September',
	// 	'October',
	// 	'November',
	// 	'December'
	// ]);

	// const currentMonthName = $derived(monthNames[selectedMonth - 1]);

	// Generate year options (current year and 4 previous years)
	// const yearOptions = $derived(Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i));

	// Update selection when dropdowns change
	// $effect(() => {
	// const availableMonths = availableMonthsForYear;
	// if (!availableMonths.includes(selectedMonth) && availableMonths.length > 0) {
	//     selectedMonth = availableMonths[0];
	// }
	// if (selectedYear !== data.selectedYear || selectedMonth !== data.selectedMonth) {
	// 	updateSelection();
	// }
	// });
</script>

<svelte:head>
	<!-- <title>Odometer Readings - {currentMonthName} {selectedYear}</title> -->
</svelte:head>
<!-- <OdometerDisplay {selectedMonth} {selectedYear} {data} /> -->

<div class="odometer-display">
	<div class="header">
		<h1>Odometer Readings - {selectedMonth} / {selectedYear}</h1>
		{#if data.odoByMonth.length > 0}
			<div class="stats">
				<div class="stat-card">
					<p>Total Distance</p>
					<p class="stat-value">{formatDistance(monthlyDistance())}</p>
				</div>
			</div>
			<!-- <div class="date-selector"> -->
			<!-- <select bind:value={selectedMonth} disabled={loading}>
					{#each monthOptions as { value, label }}
						<option value={value}>{label}</option>
					{/each}
				</select> -->
			<!-- <select bind:value={selectedYear} disabled={loading}>
					{#each data.yearOptions as year}
						<option value={year}>{year}</option>
					{/each}
				</select> -->

			<!-- </div> -->
		{/if}

		<!-- <div class="stats"> -->
		<!-- <div class="stat-card"> -->
		<!-- <h3>Total Distance</h3> -->
		<!-- <p class="stat-value">{data.odoByMonth}</p> -->

		<!-- <p class="stat-value">{formatDistance(data.stats.totalDistance)}</p>
			<!-- </div> -->
		<!-- <div class="stat-card">
				<h3>Average Daily</h3>
				<p class="stat-value">{formatDistance(data.stats.averageDaily)}</p>
			</div>
			<div class="stat-card">
				<h3>Max Daily</h3>
				<p class="stat-value">{formatDistance(data.stats.maxDaily)}</p>
			</div>
			<div class="stat-card">
				<h3>Days with Readings</h3>
				<p class="stat-value">{data.stats.daysWithReadings}</p>
			</div> -->
		<!-- <pre>{JSON.stringify(data.odoByMonth, null, 2)}</pre> -->
		<!-- <div class="date-selector">
			<select bind:value={selectedMonth} disabled={loading}>
				{#each monthNames as monthName, index}
					<option value={index + 1}>{monthName}</option>
				{/each}
			</select>
			<select bind:value={selectedYear} disabled={loading}>
				{#each yearOptions as year}
					<option value={year}>{year}</option>
				{/each}
			</select>
		</div> -->

		<!-- "entry_date": "2025-08-01",
    "odometer": 267575,
    "previous_odometer": 267317,
    "daily_difference": 258,
    "days_between": 1 -->
	</div>
	<!-- <h2>Odometer Details</h2> -->
	<table class="odometer-details">
		<!-- table -->
		<thead>
			<tr>
				<th>Date</th>
				<th>Start</th>
				<th>End</th>
				<th>Distance</th>
				<!-- <th>Days Between Readings</th> -->
			</tr>
		</thead>
		<tbody>
			{#each data.odoByMonth as reading}
				<tr>
					<td>{formatDate(reading.entry_date)}</td>
					<td class="odometer-value">
						{reading.previous_odometer ? formatOdometer(reading.previous_odometer) : '-'}
					</td>
					<td class="odometer-value">{formatOdometer(reading.odometer)}</td>
					<td class="distance-value {getDistanceColorClass(reading.daily_difference || 0)}">
						{reading.daily_difference ? formatDistance(reading.daily_difference) : '-'}
					</td>
					<!-- <td class="days-between">
						{reading.days_between ? reading.days_between.toFixed(0) : '-'}
					</td> -->
				</tr>
			{/each}
		</tbody>
	</table>

	<!-- {#if data.error}
		<div class="error">
			<p>Error loading data: {data.error}</p>
			<button onclick={() => updateSelection()}>Retry</button>
		</div>
	{:else if loading}
		<div class="loading">Loading odometer data...</div>
	{:else} -->

	<!-- <div class="stats-grid">
			<div class="stat-card">
				<h3>Total Distance</h3>
				<p class="stat-value">{formatDistance(data.stats.totalDistance)}</p>
			</div>
			<div class="stat-card">
				<h3>Average Daily</h3>
				<p class="stat-value">{formatDistance(data.stats.averageDaily)}</p>
			</div>
			<div class="stat-card">
				<h3>Max Daily</h3>
				<p class="stat-value">{formatDistance(data.stats.maxDaily)}</p>
			</div>
			<div class="stat-card">
				<h3>Days with Readings</h3>
				<p class="stat-value">{data.stats.daysWithReadings}</p>
			</div>
		</div> -->

	<!-- <div class="readings-table">
			<table>
				<thead>
					<tr>
						<th>Date</th>
						<th>Start</th>
						<th>End</th>
						<th>Daily Distance</th>
						<th>Days Between</th>
					</tr>
				</thead>
				<tbody>
					{#each data.odometerReadings as reading}
						<tr>
							<td>{formatDate(reading.entry_date)}</td>
							<td class="odometer-value">
								{reading.previous_odometer ? formatOdometer(reading.previous_odometer) : '-'}
							</td>
							<td class="odometer-value">{formatOdometer(reading.odometer)}</td>
							<td class="distance-value {getDistanceColorClass(reading.daily_difference || 0)}">
								{reading.daily_difference ? formatDistance(reading.daily_difference) : '-'}
							</td>
							<td class="days-between">
								{reading.days_between ? reading.days_between.toFixed(0) : '-'}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div> -->

	<!-- {#if data.odometerReadings.length === 0}
			<div class="no-data">
				No odometer readings found for {currentMonthName} {selectedYear}
			</div>
		{/if} -->
	<!-- {/if} -->
</div>

<style>
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		flex-wrap: wrap;
		gap: 1rem;
	}
	.stat-card{
		background: #4782cf;
		padding: 1rem;
		border-radius: 0.25em;
		text-align: center;
		/* border: 1px solid #cccdcd; */
		p {
			margin: 0;
			font-size: 1.5rem;
			/* font-weight: bold; */
			color: #f0f1f1;
		}
	}
	.stat-value{
		margin: 0;
		font-size: 1.5rem;
		letter-spacing: 0.1em;
		/* font-weight: bold; */
		/* color: #495057; */
		margin-bottom: 1rem;
	}
	.odometer-details {
		border-collapse: collapse;
		width: 100%;
		& thead {
			background: #3a3a3a;
			font-weight: 600;
			color: #f4f4f4;
			th {
				border: 1px solid #c0c0c0;
				padding: 0.75rem;
			}
		}
		& tbody {
			td {
				border: 1px solid #c0c0c0;
				&:first-child {
					font-weight: 600;
					color: #495057;
				}
				padding: 0.75rem;
				text-align: center;
				letter-spacing: 0.1rem;
			}
		}
	}
	/* .odometer-display {
		padding: 1rem;
		max-width: 1200px;
		margin: 0 auto;
	} */

	/* .header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		flex-wrap: wrap;
		gap: 1rem;
	} */

	/* .header h1 {
		margin: 0;
		font-size: 1.5rem;
		color: #333;
	} */

	/* .date-selector select {
		margin-left: 0.5rem;
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		background: white;
	} */

	/* .date-selector select:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	} */

	/* .stat-card {
		background: #f8f9fa;
		padding: 1rem;
		border-radius: 8px;
		text-align: center;
		border: 1px solid #e9ecef;
	} */

	/* .stat-card h3 {
		margin: 0 0 0.5rem 0;
		font-size: 0.9rem;
		color: #6c757d;
		font-weight: 500;
	} */

	/* .stat-value {
		margin: 0;
		font-size: 1.5rem;
		font-weight: bold;
		color: #495057;
	} */

	/* .readings-table {
		overflow-x: auto;
	} */

	/* table {
		width: 100%;
		border-collapse: collapse;
		background: white;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
	} */

	/* th, td {
		padding: 0.75rem;
		text-align: center;
		border: 1px solid #e9ecef;
	} */

	/* th {
		background: #f8f9fa;
		font-weight: 600;
		color: #495057;
	} */

	/* .odometer-value {
		font-family: 'Courier New', monospace;
		text-align: right;
	} */

	/* .distance-value {
		font-weight: 600;
		text-align: right;
	} */

	/* .days-between {
		text-align: center;
	} */

	/* .loading, .no-data {
		text-align: center;
		padding: 2rem;
		color: #6c757d;
	} */

	/* .error {
		text-align: center;
		padding: 2rem;
		color: #dc3545;
		background: #f8d7da;
		border: 1px solid #f5c6cb;
		border-radius: 8px;
		margin: 1rem 0;
	} */
	/* 
	.error button {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		background: #dc3545;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	} */

	/* .error button:hover {
		background: #c82333;
	} */

	/* Color classes for distance values */
	/* :global(.text-gray-400) { color: #9ca3af; }
	:global(.text-green-600) { color: #16a34a; }
	:global(.text-blue-600) { color: #2563eb; }
	:global(.text-yellow-600) { color: #ca8a04; }
	:global(.text-red-600) { color: #dc2626; } */

	/* Responsive design */
	/* @media (max-width: 768px) { */
	/* .header {
			flex-direction: column;
			align-items: flex-start;
		} */

	/* .stats-grid {
			grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		} */

	/* .readings-table {
			font-size: 0.9rem;
		}
	} */
</style>
