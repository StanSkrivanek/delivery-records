<script lang="ts">
	import { browser } from '$app/environment';
	import { invalidateAll } from '$app/navigation';
	import OverviewCards from '$lib/components/OverviewCards.svelte';
	import OverviewTable from '$lib/components/OverviewTable.svelte';
	import { onMount } from 'svelte';

	let { data } = $props();

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

	// Calculate analytics using $derived
	let analytics = $derived.by(() => {
		const records = filteredRecords;
		const totalDelivered = records.reduce((sum, record) => sum + (record.loaded || 0), 0);
		const totalCollected = records.reduce((sum, record) => sum + (record.collected || 0), 0);
		const averagePerDay = records.length > 0 ? totalDelivered / records.length : 0;
		const deliverySum = records.reduce((sum, record) => sum + (record.loaded || 0) * 4 * 1.23, 0);
		const collectedSum = records.reduce((sum, record) => sum + (record.collected || 0) * 1.23, 0);
		const expenseSum = records.reduce((sum, record) => sum + (record.expense || 0), 0);
		const toInvoice = deliverySum + collectedSum;

		return {
			totalDelivered,
			totalCollected,
			averagePerDay,
			deliverySum,
			collectedSum,
			expenseSum,
			toInvoice
		};
	});

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
	<title>Overview - Data Analytics</title>
</svelte:head>

<div class="overview-container">
	<div class="header-section">
		<h1>Overview & Analytics</h1>

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

			<div class="filter-info">
				<small>{filteredRecords.length} records found</small>
			</div>

			<button type="button" class="refresh-btn" onclick={refreshData} title="Refresh data">
				Refresh
			</button>
		</div>
	</div>

	<OverviewCards {analytics} {selectedYear} {selectedMonth} />

	<OverviewTable records={filteredRecords} {selectedYear} {selectedMonth} />
</div>

<!-- <script>
  import OverviewCards from '$lib/components/OverviewCards.svelte';
  import OverviewTable from '$lib/components/OverviewTable.svelte';
  
  let { data } = $props();
  
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
  let availableMonthsForYear = $derived.by(() => {
    const monthsInYear = new Set();
    data.records.forEach(record => {
      if (record.date_created) {
        const recordDate = new Date(record.date_created);
        if (recordDate.getFullYear() === selectedYear) {
          monthsInYear.add(recordDate.getMonth() + 1);
        }
      }
    });
    return Array.from(monthsInYear).sort((a, b) => a - b);
  });
  
  // Filter records based on selected year and month using $derived
  let filteredRecords = $derived.by(() => {
    return data.records.filter(record => {
      if (!record.date_created) return false;
      const recordDate = new Date(record.date_created);
      return recordDate.getFullYear() === selectedYear && 
             recordDate.getMonth() + 1 === selectedMonth;
    });
  });
  
  // Calculate analytics using $derived
  let analytics = $derived.by(() => {
    const records = filteredRecords;
    const totalDelivered = records.reduce((sum, record) => sum + (Number(record.loaded) || 0), 0);
    const totalCollected = records.reduce((sum, record) => sum + (Number(record.collected) || 0), 0);
    const averagePerDay = records.length > 0 ? totalDelivered / records.length : 0;
    const deliverySum = records.reduce((sum, record) => sum + ((Number(record.loaded) || 0) * 4 * 1.23), 0);
    const collectedSum = records.reduce((sum, record) => sum + ((Number(record.collected) || 0) * 1.23), 0);
    const toInvoice = deliverySum + collectedSum;
    
    return {
      totalDelivered,
      totalCollected,
      averagePerDay,
      deliverySum,
      collectedSum,
      toInvoice
    };
  });
  
  // Auto-adjust month if not available for selected year using $effect
  $effect(() => {
    const availableMonths = availableMonthsForYear;
    if (!availableMonths.includes(selectedMonth) && availableMonths.length > 0) {
      selectedMonth = availableMonths[0];
    }
  });
</script>

<svelte:head>
  <title>Overview - Data Analytics</title>
</svelte:head>

<div class="overview-container">
  <div class="header-section">
    <h1>Overview & Analytics</h1>
    
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
          {#each monthOptions.filter(m => availableMonthsForYear.includes(m.value)) as month}
            <option value={month.value}>{month.label}</option>
          {/each}
        </select>
      </div>
      
      <div class="filter-info">
        <small>{filteredRecords.length} records found</small>
      </div>
    </div>
  </div>
  
  <OverviewCards {analytics} {selectedYear} {selectedMonth} />
  
  <OverviewTable records={filteredRecords} {selectedYear} {selectedMonth} />
</div>

<style>
  .overview-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
  }
  
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
  
  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .filter-group label {
    font-weight: 500;
    color: #555;
    font-size: 0.9rem;
  }
  
  .filter-group select {
    padding: 0.5rem 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: white;
    font-size: 1rem;
    min-width: 120px;
    cursor: pointer;
  }
  
  .filter-group select:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
  
  .filter-info {
    display: flex;
    align-items: center;
    padding: 0.5rem 1rem;
    background: #f8f9fa;
    border-radius: 20px;
    border: 1px solid #dee2e6;
  }
  
  .filter-info small {
    color: #666;
    font-weight: 500;
  }
  
  @media (max-width: 768px) {
    .overview-container {
      padding: 1rem;
    }
    
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
</style> -->

<style>
	.overview-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
	}

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

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.filter-group label {
		font-weight: 500;
		color: #555;
		font-size: 0.9rem;
	}

	.filter-group select {
		padding: 0.5rem 1rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		background: white;
		font-size: 1rem;
		min-width: 120px;
		cursor: pointer;
	}

	.filter-group select:focus {
		outline: none;
		border-color: #007bff;
		box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
	}

	.filter-info {
		display: flex;
		align-items: center;
		padding: 0.5rem 1rem;
		background: #f8f9fa;
		border-radius: 20px;
		border: 1px solid #dee2e6;
	}

	.filter-info small {
		color: #666;
		font-weight: 500;
	}

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
		.overview-container {
			padding: 1rem;
		}

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
