<!-- src/lib/components/Invoice.svelte -->
<script lang="ts">
	import type { InvoiceData } from '$lib/invoice.server';
	import { formatCurrency, getMonthName } from '$lib/utils';

	let {
		availableYears = [],
		availableMonths = [],
		defaultYear = new Date().getFullYear(),
		defaultMonth = new Date().getMonth() + 1
	} = $props();

	let selectedYear = $state(defaultYear);
	let selectedMonth = $state(defaultMonth);
	let invoiceData = $state<InvoiceData | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let showPreview = $state(false);

	// Company information
	let companyInfo = $state({
		name: 'Stan Skrivanek',
		address: '11 Ryecourt Manor, Cloughduv, Co. Cork',
		email: '',
		phone: '',
		vatNumber: 'IE5310591A',
		bank: {
			name: 'TSB',
			iban: 'IE31IPBS99070310051401',
			bic: 'IPBSIE2D'
		}
	});

	let invoiceReceiver = $state({
		name: 'Grazyna Witkowska',
		address: '3 The Granary, Glanworth, Co. Cork',
		email: '',
		phone: '',
		vatNumber: '1388135KA'
	});

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

	async function generateInvoice() {
		loading = true;
		error = null;

		try {
			const response = await fetch(
				`/api/invoice?year=${selectedYear}&month=${selectedMonth}&format=json`
			);

			if (!response.ok) {
				throw new Error('Failed to generate invoice');
			}

			invoiceData = await response.json();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to generate invoice';
			console.error('Invoice generation error:', err);
		} finally {
			loading = false;
		}
	}

	async function downloadPDF() {
		if (!invoiceData) return;

		loading = true;
		try {
			const response = await fetch('/api/invoice', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					year: selectedYear,
					month: selectedMonth,
					companyInfo,
					invoiceReceiver
				})
			});

			if (!response.ok) {
				throw new Error('Failed to generate PDF');
			}

			const html = await response.text();

			// Create a new window for printing
			const printWindow = window.open('', '_blank');
			if (printWindow) {
				printWindow.document.write(html);
				printWindow.document.close();

				// Wait for content to load then print
				printWindow.onload = () => {
					setTimeout(() => {
						printWindow.print();
					}, 500);
				};
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to download PDF';
			console.error('PDF generation error:', err);
		} finally {
			loading = false;
		}
	}

	async function downloadHTML() {
		if (!invoiceData) return;

		try {
			const response = await fetch('/api/invoice', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					year: selectedYear,
					month: selectedMonth,
					companyInfo,
					invoiceReceiver,
					format: 'html'
				})
			});

			if (!response.ok) {
				throw new Error('Failed to generate HTML');
			}

			const html = await response.text();

			// Create download link
			const blob = new Blob([html], { type: 'text/html' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `invoice-${invoiceData.invoiceNumber}.html`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to download HTML';
			console.error('HTML download error:', err);
		}
	}
</script>

<div class="invoice-generator">
	<div class="header">
		<h2>Invoice Generator</h2>
		<p>Generate monthly invoices for your delivery services</p>
	</div>

	<div class="controls-section">
		<div class="date-controls">
			<div class="control-group">
				<label for="year-select">Year:</label>
				<select id="year-select" bind:value={selectedYear} disabled={loading}>
					{#each availableYears as year}
						<option value={year}>{year}</option>
					{/each}
				</select>
			</div>

			<div class="control-group">
				<label for="month-select">Month:</label>
				<select id="month-select" bind:value={selectedMonth} disabled={loading}>
					{#each monthOptions as month}
						<option value={month.value}>{month.label}</option>
					{/each}
				</select>
			</div>

			<button type="button" class="btn primary" onclick={generateInvoice} disabled={loading}>
				{loading ? 'Generating...' : 'Generate Invoice'}
			</button>
		</div>

		{#if invoiceData}
			<div class="action-controls">
				<button type="button" class="btn secondary" onclick={() => (showPreview = !showPreview)}>
					{showPreview ? 'Hide Preview' : 'Show Preview'}
				</button>

				<button
					type="button"
					class="btn success"
					onclick={downloadPDF}
					disabled={loading}
					title="Print or save as PDF"
				>
				Print/PDF
				</button>

				<button
					type="button"
					class="btn info"
					onclick={downloadHTML}
					disabled={loading}
					title="Download HTML file"
				>
					Download HTML
				</button>
			</div>
		{/if}
	</div>

	{#if error}
		<div class="error-message">
			<strong>Error:</strong>
			{error}
		</div>
	{/if}

	{#if invoiceData}
		<div class="invoice-summary">
			<h3>Invoice Summary - {getMonthName(selectedMonth)} {selectedYear}</h3>

			<div class="summary-grid">
				<div class="summary-card">
					<h4>Deliveries</h4>
					<p class="amount">{invoiceData.totalDeliveries.toLocaleString()}</p>
					<p class="label">Total Parcels</p>
				</div>

				<div class="summary-card">
					<h4>Collections</h4>
					<p class="amount">{invoiceData.totalCollections.toLocaleString()}</p>
					<p class="label">Total Parcels</p>
				</div>

				<div class="summary-card total">
					<h4>Total Amount</h4>
					<p class="amount">{formatCurrency(invoiceData.grandTotal)}</p>
					<p class="label">Including 23% VAT</p>
				</div>

				<div class="summary-card">
					<h4>Invoice Number</h4>
					<p class="amount">{invoiceData.invoiceNumber}</p>
					<p class="label">Reference</p>
				</div>
			</div>

			<div class="breakdown">
				<h4>Breakdown</h4>
				<table class="breakdown-table">
					<thead>
						<tr>
							<th>Service</th>
							<th>Quantity</th>
							<th>Rate</th>
							<th>Subtotal</th>
							<th>VAT (23%)</th>
							<th>Total</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>Deliveries</td>
							<td>{invoiceData.totalDeliveries.toLocaleString()}</td>
							<td>{formatCurrency(4.0)}</td>
							<td>{formatCurrency(invoiceData.deliverySubtotal)}</td>
							<td>{formatCurrency(invoiceData.deliveryVAT)}</td>
							<td class="font-medium">{formatCurrency(invoiceData.deliveryTotal)}</td>
						</tr>
						<tr>
							<td>Collections</td>
							<td>{invoiceData.totalCollections.toLocaleString()}</td>
							<td>{formatCurrency(1.0)}</td>
							<td>{formatCurrency(invoiceData.collectionSubtotal)}</td>
							<td>{formatCurrency(invoiceData.collectionVAT)}</td>
							<td class="font-medium">{formatCurrency(invoiceData.collectionTotal)}</td>
						</tr>
					</tbody>
					<tfoot>
						<tr>
							<td colspan="5"><strong>Grand Total</strong></td>
							<td class="font-bold">{formatCurrency(invoiceData.grandTotal)}</td>
						</tr>
					</tfoot>
				</table>
			</div>
		</div>

		{#if showPreview}
			<div class="preview-section">
				<h3>Company Information Preview</h3>
				<p class="preview-note">
					This information will appear on your invoice. You can modify it below:
				</p>

				<div class="company-form">
					<div class="form-group">
						<label for="company-name">Company Name:</label>
						<input type="text" id="company-name" bind:value={companyInfo.name} />
					</div>

					<div class="form-group">
						<label for="company-address">Address:</label>
						<textarea id="company-address" bind:value={companyInfo.address} rows="3"></textarea>
					</div>

					<div class="form-row">
						<div class="form-group">
							<label for="company-email">Email:</label>
							<input type="email" id="company-email" bind:value={companyInfo.email} />
						</div>

						<div class="form-group">
							<label for="company-phone">Phone:</label>
							<input type="tel" id="company-phone" bind:value={companyInfo.phone} />
						</div>
					</div>

					<div class="form-group">
						<label for="company-vat">VAT Number:</label>
						<input type="text" id="company-vat" bind:value={companyInfo.vatNumber} />
					</div>
					
					<h4>Bank Details</h4>
					<div class="form-row">
						<div class="form-group">
							<label for="bank-name">Bank Name:</label>
							<input type="text" id="bank-name" bind:value={companyInfo.bank.name} />
						</div>
						
						<div class="form-group">
							<label for="bank-iban">IBAN:</label>
							<input type="text" id="bank-iban" bind:value={companyInfo.bank.iban} />
						</div>
					</div>
					
					<div class="form-group">
						<label for="bank-bic">BIC/SWIFT:</label>
						<input type="text" id="bank-bic" bind:value={companyInfo.bank.bic} />
					</div>
				</div>
			</div>
			
			<div class="preview-section">
				<h3>Receiver Information Preview</h3>
				<p class="preview-note">
					This information will appear in the "Bill To:" section of your invoice.
				</p>

				<div class="company-form">
					<div class="form-group">
						<label for="company-name">Company Name:</label>
						<input type="text" id="company-name" bind:value={invoiceReceiver.name} />
					</div>

					<div class="form-group">
						<label for="company-address">Address:</label>
						<textarea id="company-address" bind:value={invoiceReceiver.address} rows="3"></textarea>
					</div>

					<div class="form-row">
						<div class="form-group">
							<label for="company-email">Email:</label>
							<input type="email" id="company-email" bind:value={invoiceReceiver.email} />
						</div>

						<div class="form-group">
							<label for="company-phone">Phone:</label>
							<input type="tel" id="company-phone" bind:value={invoiceReceiver.phone} />
						</div>
					</div>

					<div class="form-group">
						<label for="company-vat">VAT Number:</label>
						<input type="text" id="company-vat" bind:value={invoiceReceiver.vatNumber} />
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.invoice-generator {
		max-width: 1000px;
		margin: 0 auto;
		padding: 2rem;
	}

	.header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.header h2 {
		color: #1f2937;
		margin-bottom: 0.5rem;
	}

	.header p {
		color: #6b7280;
	}

	.controls-section {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 2rem;
		margin-bottom: 2rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.date-controls {
		display: flex;
		gap: 1rem;
		align-items: end;
		flex-wrap: wrap;
		margin-bottom: 1rem;
	}

	.action-controls {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		padding-top: 1rem;
		border-top: 1px solid #e5e7eb;
	}

	.control-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.control-group label {
		font-weight: 500;
		color: #374151;
		font-size: 0.9rem;
	}

	/* .control-group input, */
	.control-group select{
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		font-size: 0.9rem;
		min-width: 120px;
	}

	/* control-group input:focus, */
	.control-group select:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn.primary {
		background: #3b82f6;
		color: white;
	}

	.btn.primary:hover:not(:disabled) {
		background: #2563eb;
		transform: translateY(-1px);
	}

	.btn.secondary {
		background: #6b7280;
		color: white;
	}

	.btn.secondary:hover:not(:disabled) {
		background: #4b5563;
	}

	.btn.success {
		background: #10b981;
		color: white;
	}

	.btn.success:hover:not(:disabled) {
		background: #059669;
	}

	.btn.info {
		background: #0ea5e9;
		color: white;
	}

	.btn.info:hover:not(:disabled) {
		background: #0284c7;
	}

	.error-message {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 1rem;
		border-radius: 6px;
		margin-bottom: 1rem;
	}

	.invoice-summary {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 2rem;
		margin-bottom: 2rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.invoice-summary h3 {
		margin-bottom: 1.5rem;
		color: #1f2937;
		border-bottom: 2px solid #e5e7eb;
		padding-bottom: 0.5rem;
	}

	.summary-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.summary-card {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		padding: 1.5rem;
		text-align: center;
	}

	.summary-card.total {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
	}

	.summary-card h4 {
		margin-bottom: 0.5rem;
		font-size: 0.9rem;
		opacity: 0.8;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.summary-card .amount {
		font-size: 1.5rem;
		font-weight: bold;
		margin-bottom: 0.25rem;
	}

	.summary-card .label {
		font-size: 0.8rem;
		opacity: 0.7;
		margin: 0;
	}

	.breakdown {
		margin-top: 2rem;
	}

	.breakdown h4 {
		margin-bottom: 1rem;
		color: #1f2937;
	}

	.breakdown-table {
		width: 100%;
		border-collapse: collapse;
		background: white;
		border-radius: 6px;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.breakdown-table th,
	.breakdown-table td {
		padding: 0.75rem;
		text-align: left;
		border-bottom: 1px solid #e5e7eb;
	}

	.breakdown-table th {
		background: #f8fafc;
		font-weight: 600;
		color: #374151;
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.breakdown-table td:nth-child(2),
	.breakdown-table td:nth-child(3),
	.breakdown-table td:nth-child(4),
	.breakdown-table td:nth-child(5) {
		text-align: left;
	}
	.breakdown-table td:nth-child(6) {
		text-align: right;
	}
	.breakdown-table tfoot td {
		background: #f3f4f6;
		font-weight: 600;
		border-bottom: none;
		border-top: 2px solid #d1d5db;
       

	}
	.breakdown-table tfoot td:nth-child(2) {
		text-align: right;
	}
	.font-medium {
		font-weight: 500;
	}

	.font-bold {
		font-weight: 700;
		color: #1f2937;
		font-size: 1.1rem;
		/* text-align: right; */
	}

	.preview-section {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 2rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.preview-section h3 {
		margin-bottom: 0.5rem;
		color: #1f2937;
	}

	.preview-note {
		color: #6b7280;
		font-size: 0.9rem;
		margin-bottom: 1.5rem;
	}

	.company-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label {
		font-weight: 500;
		color: #374151;
		font-size: 0.9rem;
	}

	.form-group input,
	.form-group textarea {
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		font-size: 0.9rem;
		font-family: inherit;
	}

	.form-group input:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
	}

	.form-group textarea {
		resize: vertical;
		min-height: 80px;
	}

	@media (max-width: 768px) {
		.invoice-generator {
			padding: 1rem;
		}

		.date-controls {
			flex-direction: column;
			align-items: stretch;
		}

		.action-controls {
			flex-direction: column;
		}

		/* .control-group input, */
		.control-group select {
			min-width: auto;
		}

		.summary-grid {
			grid-template-columns: 1fr;
		}

		.form-row {
			grid-template-columns: 1fr;
		}

		.breakdown-table {
			font-size: 0.8rem;
		}

		.breakdown-table th,
		.breakdown-table td {
			padding: 0.5rem 0.25rem;
          
		}
	}

	@media (max-width: 480px) {
		.breakdown-table th,
		.breakdown-table td {
			font-size: 0.75rem;
			padding: 0.4rem 0.2rem;
		}

		.summary-card {
			padding: 1rem;
		}

		.summary-card .amount {
			font-size: 1.25rem;
		}
	}
</style>
