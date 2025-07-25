<script lang="ts">
	import {
		calculateCollectedValue,
		calculateDeliveryValue,
		calculateRecordTotals,
		dlvPd,
		formatCurrency,
		formatDate,
		getMonthName
	} from '$lib/utils';

	let { records, selectedYear, selectedMonth } = $props();
	// console.log('🚀OVERVIEW TABLE ~ records:', records);
	// Use utility function to calculate totals
	let totals = $derived.by(() => calculateRecordTotals(records));

	let showModal = $state(false);
	let modalImage = $state('');
	let modalAlt = $state('');

	/**
	 * @param {string} imagePath
	 * @param {number|string} recordId
	 */
	function openImageModal(imagePath: string, recordId: number | string) {
		modalImage = `/${imagePath}`;
		modalAlt = `Record #${recordId} image`;
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		modalImage = '';
		modalAlt = '';
	}

	/**
	 * @param {{ key: string; }} event
	 */
	function handleKeydown(event: { key: string }) {
		if (event.key === 'Escape' && showModal) {
			closeModal();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="table-section">
	<div class="table-header">
		<h3>Records for {getMonthName(selectedMonth)} {selectedYear}</h3>
		<div class="record-count">
			{records.length} record{records.length !== 1 ? 's' : ''} found
		</div>
	</div>

	{#if records.length === 0}
		<div class="no-records">
			<div class="no-records-icon">📋</div>
			<h4>No records found</h4>
			<p>No data available for {getMonthName(selectedMonth - 1)} {selectedYear}</p>
		</div>
	{:else}
		<div class="table-container">
			<table class="overview-table">
				<thead>
					<tr>
						<!-- <th>ID</th> -->
						<th>Date</th>
						<th>Operations</th>
						<th>Collected</th>
						<th>Cutters</th>
						<th>Returned</th>
						<th>Missplaced</th>
						<th>Delivered</th>
						<th>Expense</th>
						<th>Delivery</th>
						<th>Collected</th>
						<th>Total</th>
						<th>Image</th>
					</tr>
				</thead>
				<tbody>
					{#each records as record (record.id)}
						<!-- {@const dayDelivery: number = dlvPd(record) } -->
						{@const delivered = dlvPd(record)}
						{@const deliveryValue = calculateDeliveryValue(delivered)}
						{@const collectedValue = calculateCollectedValue(
							(record.collected ?? 0) + (record.cutters ?? 0)
						)}
						{@const dailyValue = deliveryValue + collectedValue}
						<tr>
							<!-- <td class="id-cell">#{record.id}</td> -->
							<td class="date-cell">{formatDate(record.entry_date || record.created_at)}</td>
							<td class="number-cell">{record.loaded}</td>
							<td class="number-cell" class:blue={record.collected > 0}>{record.collected ?? 0}</td>
							<td class="number-cell" class:blue={record.cutters > 0}>{record.cutters ?? 0}</td>
							<td class="number-cell" class:red={record.returned > 0}>{record.returned ?? 0}</td>
							<td class="number-cell" class:red={record.missplaced > 0}>{record.missplaced ?? 0}</td
							>
							<td class="number-cell" class:green={delivered >= 65} class:red={delivered < 55}
								>{delivered}</td
							>
							<td class="currency-cell expense">{formatCurrency(record.expense ?? 0)}</td>
							<td class="currency-cell">{formatCurrency(deliveryValue)}</td>
							<td class="currency-cell">{formatCurrency(collectedValue)}</td>
							<td class="total-cell">{formatCurrency(dailyValue)}</td>
							<td class="image-cell">
								{#if record.image_path}
									<button
										type="button"
										class="image-btn"
										onclick={() => openImageModal(record.image_path, record.id)}
										title="Preview image"
									>
										Preview image
									</button>
								{:else}
									<span class="no-image">No image</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
				<!-- Totals Row -->
				<tfoot>
					<tr class="footer-row">
						<!-- <td class="id-cell"><strong>TOTAL</strong></td> -->
						<td class="date-cell bold">TOTAL</td>
						<td class="number-cell"><strong>{totals.loaded}</strong></td>
						<td class="number-cell"><strong>{totals.collected}</strong></td>
						<td class="number-cell"><strong>{totals.cutters}</strong></td>
						<td class="number-cell" class:expense={totals.returned > 0}
							><strong>{totals.returned}</strong></td
						>
						<td class="number-cell" class:expense={totals.missplaced > 0}
							><strong>{totals.missplaced || 0}</strong></td
						>
						<td class="number-cell green"><strong>{totals.delivered || 0}</strong></td>
						<td class="currency-cell red"><strong>{formatCurrency(totals.expense)}</strong></td>
						<td class="currency-cell blue"><strong>{formatCurrency(totals.deliveryValue)}</strong></td>
						<td class="currency-cell blue"><strong>{formatCurrency(totals.collectedValue)}</strong></td>
						<td class="total-cell"><strong>{formatCurrency(totals.totalValue)}</strong></td>
						<td class="image-cell">—</td>
					</tr>
				</tfoot>
			</table>
		</div>
	{/if}
</div>

<!-- Image Modal -->
{#if showModal}
	<div
		class="modal-overlay"
		role="dialog"
		aria-modal="true"
		tabindex="0"
		onclick={closeModal}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				closeModal();
			}
		}}
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div class="modal-container" role="document" onclick={(event) => event.stopPropagation()}>
			<div class="modal-header">
				<h3>Image Preview</h3>
				<button type="button" class="close-btn" onclick={closeModal} title="Close (Esc)">
					✕
				</button>
			</div>
			<div class="modal-body">
				<img src={modalImage} alt={modalAlt} class="modal-image" />
			</div>
			<div class="modal-footer">
				<button type="button" class="btn-secondary" onclick={closeModal}> Close </button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Same CSS as before - keeping it identical */
	.table-section {
		background: white;
		border-radius: 12px;
		/* box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); */
		overflow: hidden;
		border: 1px solid #dee2e6;
	}

	.table-header {
		padding: 1.5rem;
		border-bottom: 1px solid #ff7f7f;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: #f8f9fa;
	}

	.table-header h3 {
		margin: 0;
		color: #333;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.record-count {
		color: #666;
		font-size: 0.9rem;
		background: white;
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		border: 1px solid #dee2e6;
	}

	.no-records {
		text-align: center;
		padding: 3rem;
		color: #666;
	}

	.no-records-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.no-records h4 {
		margin: 0 0 0.5rem 0;
		color: #333;
	}

	.no-records p {
		margin: 0;
		color: #999;
	}

	.table-container {
		overflow-x: auto;
	}

	.overview-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}

	.overview-table th {
		padding: 1rem 0.75rem;
		text-align: center;
		font-weight: 600;
		color: #333;
		border-bottom: 1px solid #ff7f7f;
		background: #f8f9fa;
		position: sticky;
		top: 0;
		z-index: 10;
		border-inline: 1px solid #dee2e6;
	}

	.overview-table td {
		padding: 0.75rem;
		border-bottom: 1px solid #dee2e6;
		vertical-align: right;
		letter-spacing: 0.15em;
	}

	.overview-table tbody tr:hover:not(.totals-row) {
		background-color: #f8f9fa;
		/* border-block: 1px solid red; */
	
	}

	/* .id-cell {
		font-weight: 600;
		color: #273340;
		width: 70px;
		border-right: 1px solid #dee2e6;
	} */

	.date-cell {
		color: #666;
		font-size: 0.85rem;
		/* width: 130px; */
		border-right: 1px solid #dee2e6;
	}

	.number-cell {
		text-align: right;
		font-weight: 500;
		/* width: 80px; */
		border-right: 1px solid #dee2e6;
	}

	.currency-cell {
		text-align: right;
		font-weight: 500;
		color: #2870a7;
		/* width: 100px; */
		border-right: 1px solid #dee2e6;
	}

	.red {
		color: #c0392b;
		background: #ffeced;
	}

	.blue {
		color: #2870a7;
		background: #e3ecff;
	}
	.green {
		color: #06ae6e;
		background: #e8ffed;
	}
	.bold {
		font-weight: 600;
		color: #273340;
	}
	.bold {
		font-weight: 600;
	}
	.expense {
		font-weight: 500;
		color: #c0392b;
		/* background: #f8d7da; */
		/* width: 100px; */
	}

	/* .success {
		font-weight: 500;

		background: #e8ffed;
	} */
	.total-cell {
		text-align: right;
		border-inline: 1px solid #dee2e6;
		
	}
	.footer-row {
		background: #e9ecef !important;
		border-top: 2px solid #ff7f7f;
		& td{
			border-inline: 1px solid #bec1c5;
			font-weight: 600;
			color: #273340;
			border-bottom: none;
		}
		
		& .total-cell {
			font-weight: 600;
			color: #323235;
			background: #ebbffa;
			
		}
	}

	.footer-row td {
		border-bottom: none;
	}
	.image-cell {
		text-align: center;
		/* width: 90px; */
	}

	.image-btn {
		background: #317fd3;
		color: white;
		border: none;
		border-radius: 4px;
		padding: 0.4rem 0.6rem;
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.image-btn:hover {
		background: #2869ae;
		transform: translateY(-1px);
	}

	.no-image {
		color: #999;
		font-style: italic;
		font-size: 0.75rem;
	}

	/* Modal styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-container {
		background: white;
		border-radius: 8px;
		max-width: 90vw;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
		animation: modalAppear 0.2s ease-out;
	}

	@keyframes modalAppear {
		from {
			opacity: 0;
			transform: scale(0.9) translateY(-20px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #dee2e6;
	}

	.modal-header h3 {
		margin: 0;
		color: #333;
		font-size: 1.25rem;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: #666;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		transition: all 0.2s ease;
	}

	.close-btn:hover {
		background: #f8f9fa;
		color: #333;
	}

	.modal-body {
		padding: 1rem;
		display: flex;
		justify-content: center;
		align-items: center;
		flex: 1;
		overflow: hidden;
	}

	.modal-image {
		max-width: 100%;
		max-height: 70vh;
		object-fit: contain;
		border-radius: 4px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.modal-footer {
		padding: 1rem 1.5rem;
		border-top: 1px solid #dee2e6;
		display: flex;
		justify-content: flex-end;
	}

	.btn-secondary:hover {
		background: #5a6268;
	}

	@media (max-width: 768px) {
		.table-header {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
			text-align: center;
		}

		.overview-table {
			min-width: 800px;
		}

		.overview-table th,
		.overview-table td {
			padding: 0.5rem 0.4rem;
		}
	}
</style>
