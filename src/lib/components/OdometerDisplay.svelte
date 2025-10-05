<!-- Enhanced OdometerDisplay.svelte with month boundary information -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	// import type { PageData } from './$types';
	import type { OdometerReading } from '$lib/types';
	import { formatOdometer, formatDistance, formatDate, getDistanceColorClass } from '$lib/utils';

	// Get data from server load function
	let { data, selectedYear, selectedMonth } = $props();

	// Reactive state for UI
	let loading = $state(false);

	// Current values from server data
	// let selectedYear = $state(data.selectedYear);
	// let selectedMonth = $state(data.selectedMonth);

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
	const monthNames = $derived([
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	]);

	// const currentMonthName = $derived(monthNames[selectedMonth - 1]);

	// Generate year options based on available data in database
	const yearOptions = $derived.by(() => {
		// Get unique years from data.availableYears if provided, or fallback to current year
		if (data.availableYears && data.availableYears.length > 0) {
			return data.availableYears.sort((a: number, b: number) => b - a); // Most recent first
		}
		// Fallback: if no availableYears provided, show current year only
		return [new Date().getFullYear()];
	});

	// Generate month options based on available data for selected year
	// const monthOptions = $derived.by(() => {
	// 	// Get available months for selected year if provided
	// 	if (data.availableMonths && data.availableMonths[selectedYear]) {
	// 		return data.availableMonths[selectedYear].sort((a: number, b: number) => a - b);
	// 	}
	// 	// Fallback: show all months
	// 	return Array.from({ length: 12 }, (_, i) => i + 1);
	// });

	// Check if first reading has cross-month calculation
	const hasMonthBoundary = $derived(
		data.odometerReadings.length > 0 &&
			data.odometerReadings[0].previous_odometer !== null &&
			data.odometerReadings[0].daily_difference !== null
	);

	// Track if we've already tried to load this combination to prevent loops
	let lastLoadedYear = $state(data.selectedYear);
	let lastLoadedMonth = $state(data.selectedMonth);

	// Update selection when dropdowns change (with loop prevention)
	$effect(() => {
		// Only update if values actually changed AND we haven't already loaded this combination
		// if ((selectedYear !== lastLoadedYear || selectedMonth !== lastLoadedMonth) &&
		// 	(selectedYear !== data.selectedYear || selectedMonth !== data.selectedMonth)) {
		// 	lastLoadedYear = selectedYear;
		// 	lastLoadedMonth = selectedMonth;
		// 	updateSelection();
		// }
	});
</script>

<svelte:head>
	<title>Odometer Readings - {selectedMonth} {selectedYear}</title>
</svelte:head>

<div class="odometer-display">
	<div class="header">
		<h1>Odometer Readings - {selectedMonth} {selectedYear}</h1>

		<!-- Month/Year Selector -->
		<!-- <div class="date-selector">
			<select bind:value={selectedMonth} disabled={loading}>
				{#each monthOptions as monthNum}
					<option value={monthNum}>{monthNames[monthNum - 1]}</option>
				{/each}
			</select>
			<select bind:value={selectedYear} disabled={loading}>
				{#each yearOptions as year}
					<option value={year}>{year}</option>
				{/each}
			</select>
		</div> -->
	</div>

	{#if data.error}
		<div class="error">
			<p>Error loading data: {data.error}</p>
			<!-- <button onclick={() => updateSelection()}>Retry</button> -->
		</div>
	{:else if loading}
		<div class="loading">Loading odometer data...</div>
	{:else if data.odometerReadings.length === 0}
		<div class="no-data">
			<h3>No Odometer Data Found</h3>
			<p>No odometer readings found for {selectedMonth} {selectedYear}</p>
			<p class="suggestion">Try selecting a different month or year that contains odometer data.</p>
		</div>
	{:else}
		<!-- Month Boundary Information -->
		{#if hasMonthBoundary}
			<div class="boundary-info">
				<h3>Month Boundary Information</h3>
				<p class="boundary-note">
					<strong>Note:</strong> The first reading of this month ({formatDate(
						data.odometerReadings[0].entry_date
					)}) includes distance from the previous month's last reading ({formatOdometer(
						data.odometerReadings[0].previous_odometer || 0
					)}) → {formatOdometer(data.odometerReadings[0].odometer)}
					= {formatDistance(data.odometerReadings[0].daily_difference || 0)}
				</p>
			</div>
		{/if}

		<!-- Statistics Summary -->
		<div class="stats-grid">
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
		</div>

		<!-- Detailed Readings Table -->
		<div class="readings-table">
			<table>
				<thead>
					<tr>
						<th>Date</th>
						<th>Odometer</th>
						<th>Previous</th>
						<th>Daily Distance</th>
						<th>Days Between</th>
						<th>Notes</th>
					</tr>
				</thead>
				<tbody>
					{#each data.odometerReadings as reading, index}
						<tr class:cross-month={index === 0 && hasMonthBoundary}>
							<td>{formatDate(reading.entry_date)}</td>
							<td class="odometer-value">{formatOdometer(reading.odometer)}</td>
							<td class="odometer-value">
								{reading.previous_odometer ? formatOdometer(reading.previous_odometer) : '-'}
							</td>
							<td class="distance-value {getDistanceColorClass(reading.daily_difference || 0)}">
								{reading.daily_difference ? formatDistance(reading.daily_difference) : '-'}
							</td>
							<td class="days-between">
								{reading.days_between ? reading.days_between.toFixed(0) : '-'}
							</td>
							<td class="notes">
								{#if index === 0 && hasMonthBoundary}
									<span class="cross-month-label">Cross-month</span>
								{:else if reading.daily_difference === null}
									<span class="no-previous">First record</span>
								{:else if reading.days_between && reading.days_between > 1}
									<span class="multi-day">Multi-day</span>
								{:else}
									-
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	.odometer-display {
		padding: 1rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.header h1 {
		margin: 0;
		font-size: 1.5rem;
		color: #333;
	}

	/* .date-selector select {
		margin-left: 0.5rem;
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		background: white;
	} */
	/* 
	.date-selector select:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	} */

	.boundary-info {
		background: #e8f4f8;
		border: 1px solid #bee5eb;
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 2rem;
	}

	.boundary-info h3 {
		margin: 0 0 0.5rem 0;
		color: #0c5460;
		font-size: 1rem;
	}

	.boundary-note {
		margin: 0;
		color: #0c5460;
		font-size: 0.9rem;
		line-height: 1.4;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background: #f8f9fa;
		padding: 1rem;
		border-radius: 8px;
		text-align: center;
		border: 1px solid #e9ecef;
	}

	.stat-card h3 {
		margin: 0 0 0.5rem 0;
		font-size: 0.9rem;
		color: #6c757d;
		font-weight: 500;
	}

	.stat-value {
		margin: 0;
		font-size: 1.5rem;
		font-weight: bold;
		color: #495057;
	}

	.readings-table {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		background: white;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	th,
	td {
		padding: 0.75rem;
		text-align: left;
		border-bottom: 1px solid #e9ecef;
	}

	th {
		background: #f8f9fa;
		font-weight: 600;
		color: #495057;
	}

	.odometer-value {
		font-family: 'Courier New', monospace;
		text-align: right;
	}

	.distance-value {
		font-weight: 600;
		text-align: right;
	}

	.days-between {
		text-align: center;
	}

	.notes {
		text-align: center;
		font-size: 0.8rem;
	}

	.cross-month {
		background-color: #fff3cd;
	}

	.cross-month-label {
		background: #856404;
		color: white;
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		font-size: 0.7rem;
		text-transform: uppercase;
	}

	.no-previous {
		color: #6c757d;
		font-style: italic;
	}

	.multi-day {
		background: #d1ecf1;
		color: #0c5460;
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		font-size: 0.7rem;
	}

	.no-data {
		text-align: center;
		padding: 3rem 2rem;
		color: #6c757d;
		background: #f8f9fa;
		border: 1px solid #e9ecef;
		border-radius: 8px;
		margin: 2rem 0;
	}

	.no-data h3 {
		margin: 0 0 1rem 0;
		color: #495057;
		font-size: 1.2rem;
	}

	.no-data p {
		margin: 0.5rem 0;
		font-size: 1rem;
	}

	.suggestion {
		font-style: italic;
		color: #868e96 !important;
	}

	.loading {
		text-align: center;
		padding: 2rem;
		color: #6c757d;
	}

	.error {
		text-align: center;
		padding: 2rem;
		color: #dc3545;
		background: #f8d7da;
		border: 1px solid #f5c6cb;
		border-radius: 8px;
		margin: 1rem 0;
	}

	/* .error button {
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
	:global(.text-gray-400) {
		color: #9ca3af;
	}
	:global(.text-green-600) {
		color: #16a34a;
	}
	:global(.text-blue-600) {
		color: #2563eb;
	}
	:global(.text-yellow-600) {
		color: #ca8a04;
	}
	:global(.text-red-600) {
		color: #dc2626;
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.header {
			flex-direction: column;
			align-items: flex-start;
		}

		.stats-grid {
			grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		}

		.readings-table {
			font-size: 0.9rem;
		}

		.notes {
			display: none; /* Hide notes column on mobile */
		}

		th:last-child,
		td:last-child {
			display: none;
		}
	}
</style>
