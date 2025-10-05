<!-- src/routes/dashboard/odometer/+page.svelte -->
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
		{/if}
	</div>
	<table class="odometer-details">
		<thead>
			<tr>
				<th>Date</th>
				<th>Start</th>
				<th>End</th>
				<th>Distance</th>
			</tr>
		</thead>
		<tbody>
			{#each data.odoByMonth as reading}
				<tr>
					<td>{formatDate(reading.entry_date)}</td>
					<td class="odometer-value">
						{reading.previous_odometer ? formatOdometer(reading.previous_odometer) : '-'}
					</td>
					<td class="odometer-value">{formatOdometer(reading.odometer ?? 0)}</td>
					<td class="distance-value {getDistanceColorClass(reading.daily_difference || 0)}">
						{reading.daily_difference ? formatDistance(reading.daily_difference) : '-'}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
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
		p {
			margin: 0;
			font-size: 1.5rem;
			color: #f0f1f1;
		}
	}
	.stat-value{
		margin: 0;
		font-size: 1.5rem;
		letter-spacing: 0.1em;
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
</style>
