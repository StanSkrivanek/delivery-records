<script lang="ts">
	import { browser } from '$app/environment';
	import { goto, invalidateAll } from '$app/navigation';
	import MonthYearSelector from '$lib/components/MonthYearSelector.svelte';
	import OverviewCards from '$lib/components/OverviewCards.svelte';
	import OverviewTable from '$lib/components/OverviewTable.svelte';
	import { calculateAnalytics } from '$lib/utils';
	import { onMount } from 'svelte';

	let { data } = $props();

	let selectedYear = $state(data.defaultYear);
	let selectedMonth = $state(data.defaultMonth);

	// Update URL when year or month changes
	$effect(() => {
		if (browser) {
			const url = new URL(window.location.href);
			url.searchParams.set('year', selectedYear.toString());
			url.searchParams.set('month', selectedMonth.toString());
			goto(url.toString(), { replaceState: true, noScroll: true, keepFocus: true });
		}
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
	let analytics = $derived.by(() => calculateAnalytics(filteredRecords));

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
	<title>Overview - Data Analytics</title>
</svelte:head>
<div class="page-content">
	<!-- <div class="main-container"> -->
	<div class="header-section">
		<h1>Overview & Analytics</h1>

		<div class="filters">
			<MonthYearSelector
				bind:year={selectedYear}
				bind:month={selectedMonth}
				records={data.records}
				availableYears={data.availableYears}
				showLabels={true}
			/>

			<button type="button" class="refresh-btn" onclick={refreshData} title="Refresh data">
				Refresh
			</button>
		</div>
	</div>

	<OverviewCards {analytics} {selectedYear} {selectedMonth} />

	<OverviewTable records={filteredRecords} {selectedYear} {selectedMonth} />
	<!-- </div> -->
</div>

<style>
	/* .main-container {
		max-width: var(--max-w, 800px);
		margin: 0 auto;
		padding: 2rem;
	} */

	.header-section {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	h1 {
		color: #333;
		font-size: 2rem;
		font-weight: 600;
		margin: 0;
	}

	.filters {
		display: flex;
		gap: 1.5rem;
		align-items: end;
		flex-wrap: wrap;
	}

	/* .filter-info {
		display: flex;
		align-items: center;
		padding: 0.5rem 1rem;
		background: #f8f9fa;
		border-radius: 20px;
		border: 1px solid #dee2e6;
	} */

	/* .filter-info small {
		color: #666;
		font-weight: 500;
	} */

	.refresh-btn {
		background: #17a2b8;
		color: white;
		border: none;
		border-radius: 4px;
		padding: 0.5rem 1rem;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.refresh-btn:hover {
		background: #138496;
		transform: translateY(-1px);
	}

	.refresh-btn:active {
		transform: translateY(0);
	}

	@media (max-width: 768px) {
		/* .main-container {
			padding: 1rem;
		} */

		.header-section {
			flex-direction: column;
			align-items: stretch;
			text-align: center;
		}

		.filters {
			justify-content: center;
		}

		h1 {
			font-size: 1.5rem;
		}
	}
</style>
