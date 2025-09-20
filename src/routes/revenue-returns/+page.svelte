<script lang="ts">
	import { goto } from '$app/navigation';
	import type { InvoiceData } from '$lib/invoice.server';
	import { calculateVAT, formatCurrency, getMonthName } from '$lib/utils';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Selected year only
	let selectedYear = $state(data.year);

	// Build a map month->invoice for quick lookup
	let invoiceMap = $derived.by(() => {
		const map = new Map<number, InvoiceData>();
		for (const inv of data.invoiceSummaries ?? []) {
			map.set(inv.month, inv);
		}
		return map;
	});

	function changeYear() {
		goto(`?year=${selectedYear}`);
	}

	// Compute per-month VAT metrics for all 12 months
	type MonthRow = {
		month: number;
		vatRevenue: number; // VAT on deliveries+collections
		expensesNet: number; // from invoice.records expense sum
		vatExpenses: number; // VAT reclaim (assume 23%)
		vatBalance: number; // vatRevenue - vatExpenses
		totalIncomeGross: number; // invoice.grandTotal (optional display)
	};

	let monthlyRows: MonthRow[] = $derived.by(() => {
		const rows: MonthRow[] = [];
		for (let m = 1; m <= 12; m++) {
			const inv = invoiceMap.get(m);
			if (inv) {
				const expensesNet = inv.records.reduce((s, r) => s + (r.expense ?? 0), 0);
				const vatRevenue = (inv.deliverySubtotal + inv.collectionSubtotal) * 0.23;
				const vatExpenses = calculateVAT(expensesNet);
				rows.push({
					month: m,
					vatRevenue,
					expensesNet,
					vatExpenses,
					vatBalance: vatRevenue - vatExpenses,
					totalIncomeGross: inv.grandTotal
				});
			} else {
				rows.push({
					month: m,
					vatRevenue: 0,
					expensesNet: 0,
					vatExpenses: 0,
					vatBalance: 0,
					totalIncomeGross: 0
				});
			}
		}
		return rows;
	});

	// Yearly totals
	let totals = $derived.by(() => {
		return monthlyRows.reduce(
			(acc, r) => {
				acc.vatRevenue += r.vatRevenue;
				acc.expensesNet += r.expensesNet;
				acc.vatExpenses += r.vatExpenses;
				acc.vatBalance += r.vatBalance;
				acc.totalIncomeGross += r.totalIncomeGross;
				return acc;
			},
			{ vatRevenue: 0, expensesNet: 0, vatExpenses: 0, vatBalance: 0, totalIncomeGross: 0 }
		);
	});
</script>

<svelte:head>
	<title>Revenue VAT Returns</title>
</svelte:head>

<div class="container">
	<div class="header">
		<h1>Revenue VAT Returns</h1>
		<div class="filters">
			<div class="filter">
				<label for="year">Year</label>
				<select id="year" bind:value={selectedYear} onchange={changeYear}>
					{#each Array.from({ length: new Date().getFullYear() - 2021 }, (_, i) => 2022 + i) as y}
						<option value={y}>{y}</option>
					{/each}
				</select>
			</div>
		</div>
		<div class="sub">
			VAT balance by month for {selectedYear}
		</div>
	</div>

	<div class="table-container">
		<table class="vat-table">
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
				{#each monthlyRows as row}
					{@const hasData = row.vatRevenue > 0 || row.expensesNet > 0}
					<tr class={hasData ? '' : 'empty-month'}>
						<td>{getMonthName(row.month)}</td>
						<td>{formatCurrency(row.vatRevenue)}</td>
						<td>{formatCurrency(row.expensesNet)}</td>
						<td>{formatCurrency(row.vatExpenses)}</td>
						<td class={row.vatBalance >= 0 ? 'positive' : 'negative'}>
							{formatCurrency(row.vatBalance)}
						</td>
					</tr>
				{/each}
			</tbody>
			<tfoot>
				<tr>
					<td><strong>Year totals</strong></td>
					<td><strong>{formatCurrency(totals.vatRevenue)}</strong></td>
					<td><strong>{formatCurrency(totals.expensesNet)}</strong></td>
					<td><strong>{formatCurrency(totals.vatExpenses)}</strong></td>
					<td class={totals.vatBalance >= 0 ? 'positive' : 'negative'}>
						<strong>{formatCurrency(totals.vatBalance)}</strong>
					</td>
				</tr>
			</tfoot>
		</table>
	</div>
</div>

<style>
	.container {
		max-width: 960px;
		margin: 0 auto;
		padding: 20px;
	}
	.header {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 16px;
	}
	.filters {
		display: flex;
		gap: 12px;
		align-items: end;
		flex-wrap: wrap;
	}
	.filter {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	select {
		padding: 8px 12px;
		border: 1px solid #ddd;
		border-radius: 6px;
	}
	.sub {
		color: #6b7280;
		font-size: 14px;
	}
	.table-container {
		margin-top: 12px;
		overflow-x: auto;
	}
	.vat-table {
		width: 100%;
		border-collapse: collapse;
	}
	.vat-table th,
	.vat-table td {
		padding: 10px 12px;
		border-bottom: 1px solid #e5e7eb;
		text-align: right;
	}
	.vat-table th:first-child,
	.vat-table td:first-child {
		text-align: left;
	}
	.vat-table thead th {
		background: #f9fafb;
		color: #4b5563;
		font-weight: 600;
	}
	.empty-month {
		color: #9ca3af;
		background-color: #fafafa;
	}
	.positive {
		color: #065f46;
		font-weight: 600;
	}
	.negative {
		color: #991b1b;
		font-weight: 600;
	}
</style>
