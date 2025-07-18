<!-- src/lib/components/RecordsList.svelte - CLEAN VERSION -->
<script lang="ts">
  import { formatDate } from '$lib/utils';
  
  let { records } = $props();
  
  let showModal = $state(false);
  let modalImage = $state('');
  let modalAlt = $state('');
  
  function openImageModal(imagePath: any, recordId: any) {
    modalImage = `/${imagePath}`;
    modalAlt = `Record #${recordId} image`;
    showModal = true;
  }
  
  function closeModal() {
    showModal = false;
    modalImage = '';
    modalAlt = '';
  }
  
  function handleKeydown(event: { key: string; }) {
    if (event.key === 'Escape' && showModal) {
      closeModal();
    }
  }
  
  function formatEntryDate(dateString: string | number | Date) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="records-container">
  <h2>Recent Records</h2>
  
  {#if records.length === 0}
    <div class="no-records">
      <p>No records found.</p>
    </div>
  {:else}
    <div class="table-container">
      <table class="records-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Entry Date</th>
            <th>Loaded</th>
            <th>Collected</th>
            <th>Cutters</th>
            <th>Returned</th>
            <th>Image</th>
          </tr>
        </thead>
        <tbody>
          {#each records as record (record.id)}
            <tr>
              <td class="id-cell">#{record.id}</td>
              <td class="date-cell">
                {formatEntryDate(record.entry_date || record.date_created)}
              </td>
              <td class="number-cell">{record.loaded}</td>
              <td class="number-cell">{record.collected}</td>
              <td class="number-cell">{record.cutters}</td>
              <td class="number-cell">{record.returned}</td>
              <td class="image-cell">
                {#if record.image_path}
                  <button 
                    type="button" 
                    class="image-btn"
                    onclick={() => openImageModal(record.image_path, record.id)}
                    title="View image"
                  >
                    📷 View Image
                  </button>
                {:else}
                  <span class="no-image">No image</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<!-- Image Modal -->
{#if showModal}
  <div
    class="modal-overlay"
    role="button"
    tabindex="0"
    aria-label="Close modal"
    onclick={closeModal}
    onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && closeModal()}
  >
    <div
      class="modal-container"
      role="dialog"
      aria-modal="true"
      onclick={(e) => e.stopPropagation()}
      tabindex="0"
      onkeydown={(e) => {
        if (e.key === 'Escape') closeModal();
      }}
    >
      <div class="modal-header">
        <h3>Image Preview</h3>
        <button 
          type="button" 
          class="close-btn"
          onclick={closeModal}
          title="Close (Esc)"
        >
          ✕
        </button>
      </div>
      <div class="modal-body">
        <img 
          src={modalImage} 
          alt={modalAlt}
          class="modal-image"
        />
      </div>
      <div class="modal-footer">
        <button 
          type="button" 
          class="btn-secondary"
          onclick={closeModal}
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .records-container {
    max-width: 1200px;
    margin: 2rem auto;
    padding: 0 2rem;
  }
  
  h2 {
    color: #333;
    margin-bottom: 1.5rem;
  }
  
  .no-records {
    text-align: center;
    color: #666;
    font-style: italic;
    padding: 2rem;
  }
  
  .table-container {
    background: white;
    border-radius: 8px;
    border: 1px solid #ddd;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .records-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }
  
  .records-table thead {
    background: #f8f9fa;
  }
  
  .records-table th {
    padding: 1rem 0.75rem;
    text-align: left;
    font-weight: 600;
    color: #333;
    border-bottom: 2px solid #dee2e6;
    position: sticky;
    top: 0;
    background: #f8f9fa;
    z-index: 10;
  }
  
  .records-table td {
    padding: 0.75rem;
    border-bottom: 1px solid #dee2e6;
    vertical-align: middle;
  }
  
  .records-table tbody tr:hover {
    background-color: #f8f9fa;
  }
  
  .records-table tbody tr:last-child td {
    border-bottom: none;
  }
  
  .id-cell {
    font-weight: 600;
    color: #007bff;
    width: 80px;
  }
  
  .date-cell {
    color: #666;
    font-size: 0.9rem;
    width: 120px;
    font-weight: 500;
  }
  
  .number-cell {
    text-align: center;
    font-weight: 500;
    width: 90px;
  }
  
  .image-cell {
    text-align: center;
    width: 120px;
  }
  
  .image-btn {
    background: #28a745;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }
  
  .image-btn:hover {
    background: #218838;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  .image-btn:active {
    transform: translateY(0);
  }
  
  .no-image {
    color: #999;
    font-style: italic;
    font-size: 0.8rem;
  }
  
  /* Modal Styles */
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
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
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
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  
  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid #dee2e6;
    display: flex;
    justify-content: flex-end;
  }
  
  .btn-secondary {
    background: #6c757d;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.5rem 1rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .btn-secondary:hover {
    background: #5a6268;
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .records-container {
      padding: 0 1rem;
    }
    
    .table-container {
      overflow-x: auto;
    }
    
    .records-table {
      min-width: 600px;
    }
    
    .records-table th,
    .records-table td {
      padding: 0.5rem 0.4rem;
    }
    
    .image-btn {
      font-size: 0.7rem;
      padding: 0.4rem 0.6rem;
    }
    
    .modal-container {
      margin: 1rem;
      max-width: calc(100vw - 2rem);
      max-height: calc(100vh - 2rem);
    }
    
    .modal-header {
      padding: 0.75rem 1rem;
    }
    
    .modal-body {
      padding: 0.75rem;
    }
    
    .modal-image {
      max-height: 60vh;
    }
  }
  
  @media (max-width: 480px) {
    .records-table {
      font-size: 0.8rem;
    }
    
    .records-table th,
    .records-table td {
      padding: 0.4rem 0.3rem;
    }
    
    .image-btn {
      font-size: 0.65rem;
      padding: 0.3rem 0.5rem;
    }
    
    h2 {
      font-size: 1.25rem;
    }
  }
</style>