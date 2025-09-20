<!-- REVENUE CALCULATION -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import type { InvoiceData } from '$lib/invoice.server';
	import { calculateProfitAfterTax, calculateTotalTax, formatCurrency } from '$lib/utils';
	import { onMount } from 'svelte';

	// Get data from the server
	export let data;

	// Revenue tracking data
	interface MonthlyRevenue {
		month: number;
		year: number;
		totalIncome: number;
		expenses: number;
		vatCollected: number;
		vatReclaim: number;
		netProfit: number; // Changed from revenue to netProfit for clarity
		incomeTax: number;
		usc: number;
		prsi: number;
		totalTax: number;
		profitAfterTax: number;
	}
	let selectedYear = data.year;
	let availableYears: number[] = [];
	let monthlyRevenueData: MonthlyRevenue[] = [];
	let isLoading = false;
	let error = data.error || null;

	// Generate years from 2022 to current year
	for (let year = 2022; year <= new Date().getFullYear(); year++) {
		availableYears.push(year);
	}

	function processRevenueData(invoiceSummaries: InvoiceData[]) {
		// Process each month's data
		monthlyRevenueData = [];
		for (let month = 1; month <= 12; month++) {
			const invoiceData = invoiceSummaries.find((summary) => summary.month === month);

			if (invoiceData) {
				// Calculate total expenses for the month
				const expenses = invoiceData.records.reduce(
					(sum, record) => sum + (record.expense || 0),
					0
				);
				// Calculate VAT collected (already included in invoice totals)
				const vatCollected = invoiceData.deliveryVAT + invoiceData.collectionVAT;

				// Estimate VAT reclaim (you could refine this calculation)
				// Assuming 23% VAT on expenses
				const vatReclaim = expenses * 0.23;

				// Calculate net profit (excluding VAT)
				const totalIncome = invoiceData.grandTotal;

				// Correct calculation:
				// 1. Remove VAT from income (already included in invoice total)
				// 2. Subtract expenses
				// 3. Add back VAT you can reclaim
				const netIncome = totalIncome - vatCollected; // Income without VAT
				const netExpenses = expenses; // Expenses without VAT reclaim
				const netProfit = netIncome - netExpenses;

				// Calculate taxes
				const taxCalc = calculateTotalTax(netProfit);
				const afterTaxCalc = calculateProfitAfterTax(netProfit);

				monthlyRevenueData.push({
					month,
					year: selectedYear,
					totalIncome,
					expenses,
					vatCollected,
					vatReclaim,
					netProfit,
					incomeTax: taxCalc.incomeTax,
					usc: taxCalc.usc,
					prsi: taxCalc.prsi,
					totalTax: taxCalc.total,
					profitAfterTax: afterTaxCalc.profitAfterTax
				});
			} else {
				// Add empty data for months with no records
				monthlyRevenueData.push({
					month,
					year: selectedYear,
					totalIncome: 0,
					expenses: 0,
					vatCollected: 0,
					vatReclaim: 0,
					netProfit: 0,
					incomeTax: 0,
					usc: 0,
					prsi: 0,
					totalTax: 0,
					profitAfterTax: 0
				});
			}
		}
	}

	function changeYear() {
		goto(`?year=${selectedYear}`);
	}

	// Get month name helper function
	function getMonthName(month: number): string {
		return new Date(0, month - 1).toLocaleString('default', { month: 'long' });
	}

	// Calculate yearly totals
	$: yearlyTotals = {
		totalIncome: monthlyRevenueData.reduce((sum, data) => sum + data.totalIncome, 0),
		expenses: monthlyRevenueData.reduce((sum, data) => sum + data.expenses, 0),
		vatCollected: monthlyRevenueData.reduce((sum, data) => sum + data.vatCollected, 0),
		vatReclaim: monthlyRevenueData.reduce((sum, data) => sum + data.vatReclaim, 0),
		netProfit: monthlyRevenueData.reduce((sum, data) => sum + data.netProfit, 0),
		incomeTax: monthlyRevenueData.reduce((sum, data) => sum + data.incomeTax, 0),
		usc: monthlyRevenueData.reduce((sum, data) => sum + data.usc, 0),
		prsi: monthlyRevenueData.reduce((sum, data) => sum + data.prsi, 0),
		totalTax: monthlyRevenueData.reduce((sum, data) => sum + data.totalTax, 0),
		profitAfterTax: monthlyRevenueData.reduce((sum, data) => sum + data.profitAfterTax, 0)
	};
	$: if (data && data.invoiceSummaries) {
		processRevenueData(data.invoiceSummaries);
	}

	onMount(() => {
		processRevenueData(data.invoiceSummaries);
	});

	// VAT Returns monthly table (year-only selector is already present)
	interface VatRow {
		month: number;
		vatRevenue: number; // VAT from deliveries+collections
		expensesNet: number;
		vatExpenses: number; // reclaim
		vatBalance: number; // vatRevenue - vatExpenses
	}

	$: monthlyVatRows = Array.from({ length: 12 }, (_, idx) => {
		const month = idx + 1;
		const invoiceData: InvoiceData | undefined = data.invoiceSummaries.find(
			(s) => s.month === month
		);
		if (!invoiceData) {
			return { month, vatRevenue: 0, expensesNet: 0, vatExpenses: 0, vatBalance: 0 } as VatRow;
		}
		const expensesNet = invoiceData.records.reduce((sum, r) => sum + (r.expense || 0), 0);
		const vatRevenue = invoiceData.deliveryVAT + invoiceData.collectionVAT;
		const vatExpenses = expensesNet * 0.23;
		return {
			month,
			vatRevenue,
			expensesNet,
			vatExpenses,
			vatBalance: vatRevenue - vatExpenses
		} as VatRow;
	});

	$: vatTotals = monthlyVatRows.reduce(
		(
			acc: { vatRevenue: number; expensesNet: number; vatExpenses: number; vatBalance: number },
			r: VatRow
		) => {
			acc.vatRevenue += r.vatRevenue;
			acc.expensesNet += r.expensesNet;
			acc.vatExpenses += r.vatExpenses;
			acc.vatBalance += r.vatBalance;
			return acc;
		},
		{ vatRevenue: 0, expensesNet: 0, vatExpenses: 0, vatBalance: 0 }
	);
</script>

<div class="revenue-container">
	<h1>Profit & Tax Calculator</h1>

	<div class="filter-controls">
		<label for="year-select">Select Year:</label>
		<select id="year-select" bind:value={selectedYear} on:change={changeYear}>
			{#each availableYears as year}
				<option value={year}>{year}</option>
			{/each}
		</select>
	</div>

	{#if isLoading}
		<div class="loading">Loading revenue data...</div>
	{:else if error}
		<div class="error">{error}</div>
	{:else}
		<div class="revenue-table-container">
			<table class="revenue-table">
				<thead>
					<tr>
						<th>Month</th>
						<th>Total Income</th>
						<th>Expenses</th>
						<th>VAT Collected</th>
						<th>VAT Reclaim</th>
						<th>Net Profit</th>
						<th>Income Tax</th>
						<th>USC + PRSI</th>
						<th>Profit After Tax</th>
					</tr>
				</thead>
				<tbody>
					{#each monthlyRevenueData as data}
						{@const hasData = data.totalIncome > 0 || data.expenses > 0}
						<tr class={hasData ? '' : 'empty-month'}>
							<td>{getMonthName(data.month)}</td>
							<td>{formatCurrency(data.totalIncome)}</td>
							<td>{formatCurrency(data.expenses)}</td>
							<td>{formatCurrency(data.vatCollected)}</td>
							<td>{formatCurrency(data.vatReclaim)}</td>
							<td class="profit-value">{formatCurrency(data.netProfit)}</td>
							<td class="tax-value">{formatCurrency(data.incomeTax)}</td>
							<td class="tax-value">{formatCurrency(data.usc + data.prsi)}</td>
							<td class="after-tax-value">{formatCurrency(data.profitAfterTax)}</td>
						</tr>
					{/each}
				</tbody>
				<tfoot>
					<tr class="yearly-totals">
						<td><strong>Year Totals</strong></td>
						<td><strong>{formatCurrency(yearlyTotals.totalIncome)}</strong></td>
						<td><strong>{formatCurrency(yearlyTotals.expenses)}</strong></td>
						<td><strong>{formatCurrency(yearlyTotals.vatCollected)}</strong></td>
						<td><strong>{formatCurrency(yearlyTotals.vatReclaim)}</strong></td>
						<td class="profit-value"><strong>{formatCurrency(yearlyTotals.netProfit)}</strong></td>
						<td class="tax-value"><strong>{formatCurrency(yearlyTotals.incomeTax)}</strong></td>
						<td class="tax-value"
							><strong>{formatCurrency(yearlyTotals.usc + yearlyTotals.prsi)}</strong></td
						>
						<td class="after-tax-value"
							><strong>{formatCurrency(yearlyTotals.profitAfterTax)}</strong></td
						>
					</tr>
				</tfoot>
			</table>
		</div>

		<div class="revenue-summary">
			<h2>Profit Summary for {selectedYear}</h2>
			<div class="summary-cards">
				<div class="card">
					<h3>Total Income</h3>
					<div class="amount">{formatCurrency(yearlyTotals.totalIncome)}</div>
				</div>
				<div class="card">
					<h3>Total Expenses</h3>
					<div class="amount">{formatCurrency(yearlyTotals.expenses)}</div>
				</div>
				<div class="card">
					<h3>VAT Balance</h3>
					<div class="amount">
						{formatCurrency(yearlyTotals.vatCollected - yearlyTotals.vatReclaim)}
					</div>
				</div>
				<div class="card">
					<h3>Net Profit</h3>
					<div class="amount">{formatCurrency(yearlyTotals.netProfit)}</div>
				</div>
				<div class="card">
					<h3>Total Tax</h3>
					<div class="amount tax-amount">{formatCurrency(yearlyTotals.totalTax)}</div>
				</div>
				<div class="card highlight">
					<h3>Profit After Tax</h3>
					<div class="amount">{formatCurrency(yearlyTotals.profitAfterTax)}</div>
				</div>
			</div>

			<div class="revenue-notes">
				<h3>Notes on Profit & Tax Calculation</h3>
				<ul>
					<li><strong>Total Income:</strong> All invoiced amounts including VAT.</li>
					<li><strong>Expenses:</strong> All recorded expenses for the period.</li>
					<li>
						<strong>VAT Collected:</strong> VAT included in your invoices (23% of net amount).
					</li>
					<li><strong>VAT Reclaim:</strong> Estimated VAT you can reclaim on expenses (23%).</li>
					<li><strong>Net Profit:</strong> Income minus expenses (excluding VAT).</li>
					<li>
						<strong>Income Tax:</strong> Calculated at flat 35% rate on net profit.
					</li>
					<li>
						<strong>USC + PRSI:</strong> Universal Social Charge (0.5-4.5%) and Pay Related Social Insurance
						(4%).
					</li>
					<li><strong>Profit After Tax:</strong> Your take-home profit after all taxes.</li>
				</ul>
				<p class="disclaimer">
					This is a simplified calculation for estimation purposes. Please consult with your
					accountant for tax filing. Tax rates and credits based on 2025 values.
				</p>
			</div>
		</div>

		<!-- VAT Returns Table -->
		<div class="vat-returns">
			<h2>VAT Returns by Month ({selectedYear})</h2>
			<div class="revenue-table-container">
				<table class="revenue-table">
					<thead>
						<tr>
							<th>Month</th>
							<th>VAT on Revenue</th>
							<th>Expenses (Net)</th>
							<th>VAT on Expenses</th>
							<th>VAT Balance</th>
						</tr>
					</thead>
					<tbody>
						{#each monthlyVatRows as row}
							{@const hasData = row.vatRevenue > 0 || row.expensesNet > 0}
							<tr class={hasData ? '' : 'empty-month'}>
								<td>{getMonthName(row.month)}</td>
								<td>{formatCurrency(row.vatRevenue)}</td>
								<td>{formatCurrency(row.expensesNet)}</td>
								<td>{formatCurrency(row.vatExpenses)}</td>
								<td class={row.vatBalance >= 0 ? 'profit-value' : 'tax-value'}>
									{formatCurrency(row.vatBalance)}
								</td>
							</tr>
						{/each}
					</tbody>
					<tfoot>
						<tr class="yearly-totals">
							<td><strong>Year Totals</strong></td>
							<td><strong>{formatCurrency(vatTotals.vatRevenue)}</strong></td>
							<td><strong>{formatCurrency(vatTotals.expensesNet)}</strong></td>
							<td><strong>{formatCurrency(vatTotals.vatExpenses)}</strong></td>
							<td class={vatTotals.vatBalance >= 0 ? 'profit-value' : 'tax-value'}>
								<strong>{formatCurrency(vatTotals.vatBalance)}</strong>
							</td>
						</tr>
					</tfoot>
				</table>
			</div>
		</div>
	{/if}
</div>

<style>
	.revenue-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 20px;
	}

	h1 {
		margin-bottom: 24px;
		color: #1f2937;
	}

	.filter-controls {
		margin-bottom: 24px;
		display: flex;
		align-items: center;
		gap: 12px;
	}

	select {
		padding: 8px 16px;
		border-radius: 4px;
		border: 1px solid #d1d5db;
		background-color: white;
		font-size: 16px;
	}

	.loading,
	.error {
		padding: 20px;
		text-align: center;
		border-radius: 8px;
	}

	.loading {
		background-color: #f3f4f6;
	}

	.error {
		background-color: #fee2e2;
		color: #b91c1c;
	}

	.revenue-table-container {
		overflow-x: auto;
		margin-bottom: 40px;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.revenue-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 15px;
	}

	.revenue-table th,
	.revenue-table td {
		padding: 12px 16px;
		text-align: right;
		border-bottom: 1px solid #e5e7eb;
	}

	.revenue-table th:first-child,
	.revenue-table td:first-child {
		text-align: left;
	}

	.revenue-table th {
		background-color: #f9fafb;
		font-weight: 600;
		color: #4b5563;
	}

	.revenue-table tbody tr:hover {
		background-color: #f3f4f6;
	}

	.empty-month {
		color: #9ca3af;
		background-color: #f9fafb;
	}

	.yearly-totals {
		background-color: #f3f4f6;
		font-weight: 500;
	}

	.yearly-totals td {
		border-top: 2px solid #d1d5db;
	}

	.revenue-value {
		font-weight: 500;
		color: #1f2937;
	}

	.profit-value {
		font-weight: 500;
		color: #047857; /* Green color for profit */
	}

	.tax-value {
		color: #9f1239; /* Red color for tax */
	}

	.after-tax-value {
		font-weight: 500;
		color: #0369a1; /* Blue color for after-tax profit */
	}

	.tax-amount {
		color: #9f1239; /* Red color for tax amounts */
	}

	.revenue-summary {
		margin-top: 40px;
	}

	.revenue-summary h2 {
		margin-bottom: 20px;
		color: #1f2937;
	}

	.summary-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 20px;
		margin-bottom: 30px;
	}

	.card {
		background-color: white;
		border-radius: 8px;
		padding: 20px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		text-align: center;
	}

	.card.highlight {
		background-color: #ecfdf5;
		border: 1px solid #10b981;
	}

	.card h3 {
		font-size: 16px;
		margin-bottom: 10px;
		color: #4b5563;
	}

	.card .amount {
		font-size: 24px;
		font-weight: 600;
		color: #1f2937;
	}

	.highlight .amount {
		color: #047857;
	}

	.revenue-notes {
		background-color: #f9fafb;
		border-radius: 8px;
		padding: 20px;
		margin-top: 30px;
	}

	.revenue-notes h3 {
		margin-bottom: 16px;
		color: #4b5563;
	}

	.revenue-notes ul {
		margin-left: 20px;
		margin-bottom: 16px;
	}

	.revenue-notes li {
		margin-bottom: 8px;
	}

	.disclaimer {
		font-style: italic;
		color: #6b7280;
		font-size: 14px;
	}

	@media (max-width: 768px) {
		.summary-cards {
			grid-template-columns: 1fr;
		}

		.revenue-table th,
		.revenue-table td {
			padding: 10px;
			font-size: 14px;
		}
	}
</style>
