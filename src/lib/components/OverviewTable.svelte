<script>
	import { formatDate } from '$lib/utils';

	let { records, selectedYear, selectedMonth } = $props();
	console.log("🚀OVERVIEW TABLE ~ records:", records)

	let showModal = $state(false);
	let modalImage = $state('');
	let modalAlt = $state('');

	/**
	 * @param {string} imagePath
	 * @param {number|string} recordId
	 */
	function openImageModal(imagePath, recordId) {
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
	function handleKeydown(event) {
		if (event.key === 'Escape' && showModal) {
			closeModal();
		}
	}

	// Correct formulas matching the cards
	/**
	 * @param {number} loaded
	 */
	function calculateDeliveryValue(loaded) {
		return loaded * 4 * 1.23; // delivered * (4 + 23%)
	}

	/**
	 * @param {number} collected
	 */
	function calculateCollectedValue(collected) {
		return collected * 1.23; // collected * (1 + 23%)
	}

	/**
	 * @param {string | number | bigint} value
	 */
	function formatCurrency(value) {
		const num = typeof value === 'string' ? Number(value) : value;
		return new Intl.NumberFormat('en-IE', {
			style: 'currency',
			currency: 'EUR',
			minimumFractionDigits: 2
		}).format(num);
	}

	const monthNames = [
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
	];

	// Calculate totals using $derived
	let totals = $derived(() => {
		return records.reduce(
			(
				/** @type {{ loaded: any; collected: any; cutters: any; returned: any; missplaced: any; loading: any; expense: any; deliveryValue: number; collectedValue: number; totalValue: number; }} */ acc,
				/** @type {{ loaded: number; collected: number; cutters: any; returned: any; missplaced?: any; loading?: any; expense?: any; }} */ record
			) => {
				const deliveryValue = calculateDeliveryValue(record.loaded);
				const collectedValue = calculateCollectedValue(record.collected);
				return {
					loaded: acc.loaded + record.loaded,
					collected: acc.collected + record.collected,
					cutters: acc.cutters + record.cutters,
					returned: acc.returned + record.returned,
					missplaced: acc.missplaced + (record.missplaced || 0),
					// loading: acc.loading + (record.loading || 0),
					expense: acc.expense + (record.expense || 0),
					deliveryValue: acc.deliveryValue + deliveryValue,
					collectedValue: acc.collectedValue + collectedValue,
					totalValue: acc.totalValue + deliveryValue + collectedValue
				};
			},
			{
				loaded: 0,
				collected: 0,
				cutters: 0,
				returned: 0,
				missplaced: 0,
				// loading: 0,
				expense: 0,
				deliveryValue: 0,
				collectedValue: 0,
				totalValue: 0
			}
		);
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="table-section">
	<div class="table-header">
		<h3>Records for {monthNames[selectedMonth - 1]} {selectedYear}</h3>
		<div class="record-count">
			{records.length} record{records.length !== 1 ? 's' : ''} found
		</div>
	</div>

	{#if records.length === 0}
		<div class="no-records">
			<div class="no-records-icon">📋</div>
			<h4>No records found</h4>
			<p>No data available for {monthNames[selectedMonth - 1]} {selectedYear}</p>
		</div>
	{:else}
		<div class="table-container">
			<table class="overview-table">
				<thead>
					<tr>
						<th>ID</th>
						<th>Date</th>
						<th>Loaded</th>
						<th>Collected</th>
						<th>Cutters</th>
						<th>Returned</th>
						<th>Missplaced</th>
						<th>Expense</th>
						<th>Delivery Value</th>
						<th>Collected Value</th>
						<th>Total Value</th>
						<th>Image</th>
					</tr>
				</thead>
				<tbody>
					{#each records as record (record.id)}
						{@const deliveryValue = calculateDeliveryValue(record.loaded)}
						{@const collectedValue = calculateCollectedValue(record.collected)}
						{@const totalValue = deliveryValue + collectedValue}
						<tr>
							<td class="id-cell">#{record.id}</td>
							<td class="date-cell">{formatDate(record.entry_date)}</td>
							<td class="number-cell">{record.loaded}</td>
							<td class="number-cell">{record.collected}</td>
							<td class="number-cell">{record.cutters}</td>
							<td class="number-cell">{record.returned}</td>
							<td class="number-cell">{record.missplaced || 0}</td>
							<td class="currency-cell expense">{formatCurrency(record.expense)}</td>
							<td class="currency-cell">{formatCurrency(deliveryValue)}</td>
							<td class="currency-cell ">{formatCurrency(collectedValue)}</td>
							<td class="total-cell">{formatCurrency(totalValue)}</td>
							<td class="image-cell">
								{#if record.image_path}
									<button
										type="button"
										class="image-btn"
										onclick={() => openImageModal(record.image_path, record.id)}
										title="View image"
									>
										View
									</button>
								{:else}
									<span class="no-image">No image</span>
								{/if}
							</td>
						</tr>
					{/each}

					<!-- Totals Row -->
					<tr class="totals-row">
						<td class="id-cell"><strong>TOTAL</strong></td>
						<td class="date-cell">—</td>
						<td class="number-cell"><strong>{totals().loaded}</strong></td>
						<td class="number-cell"><strong>{totals().collected}</strong></td>
						<td class="number-cell"><strong>{totals().cutters}</strong></td>
						<td class="number-cell"><strong>{totals().returned}</strong></td>
						<td class="number-cell"><strong>{totals().missplaced || 0}</strong></td>
						<td class="currency-cell expense"><strong>{formatCurrency(totals().expense)}</strong></td>
						<td class="currency-cell"><strong>{formatCurrency(totals().deliveryValue)}</strong></td>
						<td class="currency-cell"><strong>{formatCurrency(totals().collectedValue)}</strong></td
						>
						<td class="total-cell"><strong>{formatCurrency(totals().totalValue)}</strong></td>
						<td class="image-cell">—</td>
					</tr>
				</tbody>
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
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.table-header {
		padding: 1.5rem;
		border-bottom: 1px solid #dee2e6;
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
		text-align: left;
		font-weight: 600;
		color: #333;
		border-bottom: 2px solid #dee2e6;
		background: #f8f9fa;
		position: sticky;
		top: 0;
		z-index: 10;
	}

	.overview-table td {
		padding: 0.75rem;
		border-bottom: 1px solid #dee2e6;
		vertical-align: middle;
	}

	.overview-table tbody tr:hover:not(.totals-row) {
		background-color: #f8f9fa;
	}

	.totals-row {
		background: #e9ecef !important;
		border-top: 2px solid #adb5bd;
	}

	.totals-row td {
		border-bottom: none;
	}

	.id-cell {
		font-weight: 600;
		color: #007bff;
		width: 70px;
	}

	.date-cell {
		color: #666;
		font-size: 0.85rem;
		width: 130px;
	}

	.number-cell {
		text-align: center;
		font-weight: 500;
		width: 80px;
	}

	.currency-cell {
		text-align: right;
		font-weight: 500;
		color: #2870a7;
		width: 100px;
	}
	.expense{
		text-align: right;
		font-weight: 500;
		color: #c0392b;
		background: #f8d7da;
		width: 100px;
	}
	.total-cell {
		text-align: right;
		font-weight: 600;
		color: #09122e;
		background: #c1cadb;
		width: 100px;
	}

	.image-cell {
		text-align: center;
		width: 90px;
	}

	.image-btn {
		background: #28a745;
		color: white;
		border: none;
		border-radius: 4px;
		padding: 0.4rem 0.6rem;
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.image-btn:hover {
		background: #218838;
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
