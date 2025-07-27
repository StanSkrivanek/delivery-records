<script lang="ts">
	import { browser } from '$app/environment';
	import { invalidateAll } from '$app/navigation';
	import FormData from '$lib/components/FormData.svelte';
	import RecordsList from '$lib/components/RecordsList.svelte';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let {
		data,
		form
	}: {
		data: PageData;
		form: import('./$types').ActionData;
	} = $props();
	// console.log('🚀 ~ data:', data);

	let loading = $state(false);

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

	// Get available months for the selected year using $derived
	let availableMonthsForYear: number[] = $derived.by(() => {
		const monthsInYear = new Set<number>();
		data.records.forEach((record) => {
			const dateString = record.entry_date || record.created_at;
			if (dateString) {
				const recordDate = new Date(dateString);
				if (recordDate.getFullYear() === selectedYear) {
					monthsInYear.add(recordDate.getMonth() + 1);
				}
			}
		});
		return Array.from(monthsInYear).sort((a, b) => a - b);
	});

	// Filter records based on selected year and month using $derived
	let filteredRecords = $derived.by(() => {
		return data.records.filter((record) => {
			const dateString = record.entry_date || record.created_at;
			if (!dateString) return false;
			const recordDate = new Date(dateString);
			return (
				recordDate.getFullYear() === selectedYear && recordDate.getMonth() + 1 === selectedMonth
			);
		});
	});

	// Calculate analytics using $derived and the utility function
	// let analytics = $derived.by(() => calculateAnalytics(filteredRecords));

	// Auto-adjust month if not available for selected year using $effect
	$effect(() => {
		const availableMonths = availableMonthsForYear;
		if (!availableMonths.includes(selectedMonth) && availableMonths.length > 0) {
			selectedMonth = availableMonths[0];
		}
	});

	// Auto-refresh data when page becomes visible (handles navigation from other pages)
	onMount(() => {
		if (browser) {
			// Refresh data when page becomes visible
			const handleVisibilityChange = () => {
				if (!document.hidden) {
					invalidateAll();
				}
			};

			// Refresh data when user navigates back to this page
			const handleFocus = () => {
				invalidateAll();
			};

			document.addEventListener('visibilitychange', handleVisibilityChange);
			window.addEventListener('focus', handleFocus);

			// Cleanup listeners
			return () => {
				document.removeEventListener('visibilitychange', handleVisibilityChange);
				window.removeEventListener('focus', handleFocus);
			};
		}
	});

	// Manual refresh function
	async function refreshData() {
		await invalidateAll();
	}
</script>

<svelte:head>
	<title>Currier Deilvery Records </title>
</svelte:head>

<main>
	<FormData {form} bind:loading />
	<div class="filters">
		<div class="filter-group">
			<label for="year-select">Year:</label>
			<select id="year-select" bind:value={selectedYear}>
				{#each data.availableYears as year}
					<option value={year}>{year}</option>
				{/each}
			</select>
		</div>

		<div class="filter-group">
			<label for="month-select">Month:</label>
			<select id="month-select" bind:value={selectedMonth}>
				{#each monthOptions.filter((m) => availableMonthsForYear.includes(m.value)) as month}
					<option value={month.value}>{month.label}</option>
				{/each}
			</select>
		</div>
	</div>
	<RecordsList records={filteredRecords} />
	{#if loading}
		<p>Loading...</p>
	{/if}
</main>

<style>
	/* :global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background-color: #f8f9fa;
		line-height: 1.6;
	}

	main {
		min-height: 100vh;
		padding: 2rem 0;
	} */

  .filters {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 1.5rem;
    gap: 1rem;
  }

  .filter-group {
    position: relative;
    display: inline-block;
    margin-right: 1rem;
}

.filter-group select {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    padding: 0.5rem 2.5rem 0.5rem 1rem;
    border: 1px solid #cfd8dc;
    border-radius: 6px;
    background: linear-gradient(90deg, #fff 80%, #f8f9fa 100%);
    font-size: 1rem;
    min-width: 140px;
    color: #222;
    font-weight: 500;
    box-sizing: border-box;
    font-family: inherit;
    box-shadow: 0 2px 8px rgba(60, 60, 60, 0.04);
    transition: border-color 0.2s, box-shadow 0.2s;
    cursor: pointer;
    position: relative;
    background-image: url('data:image/svg+xml;utf8,<svg fill="%2334d393" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M7.293 8.293a1 1 0 011.414 0L10 9.586l1.293-1.293a1 1 0 111.414 1.414l-2 2a1 1 0 01-1.414 0l-2-2a1 1 0 010-1.414z"/></svg>');
    background-repeat: no-repeat;
    background-position: right 0.8rem center;
    background-size: 1.2em;
}

.filter-group select:focus {
    outline: none;
    border-color: #34d393;
    box-shadow: 0 0 0 2px rgba(52, 211, 147, 0.15);
    background: linear-gradient(90deg, #f8fff8 80%, #e6f9f0 100%);
}

.filter-group select::-ms-expand {
    display: none;
}
</style>
