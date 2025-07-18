<script lang="ts">
	import { enhance } from '$app/forms';
	import ImageUpload from './ImageUpload.svelte';

	let {
		form,
		loading = $bindable(false)
	}: {
		form: any;
		loading?: boolean;
	} = $props();

	let loaded = $state(0);
	let collected = $state(0);
	let cutters = $state(0);
	let returned = $state(0);
	let selectedFile: File | null = $state(null);
	let selectedDate = $state(getCurrentDate());

	function getCurrentDate() {
		const now = new Date();
		// Format as YYYY-MM-DD for HTML date input
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function formatDateForDisplay(dateString: string | number | Date) {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function isToday(dateString: string | number | Date) {
		const selected = new Date(dateString);
		const today = new Date();
		return selected.toDateString() === today.toDateString();
	}

	// Reset form after successful submission
	$effect(() => {
		if (form?.success) {
			loaded = 0;
			collected = 0;
			cutters = 0;
			returned = 0;
			selectedFile = null;
			selectedDate = getCurrentDate(); // Reset to current date
		}
	});

	// Callback functions for ImageUpload component
	function handleFileSelected(file: File) {
		selectedFile = file;
		console.log(`File selected: ${file.name}`);
		console.log('Form received file:', file.name);
	}

	function handleFileRemoved() {
		selectedFile = null;
		console.log('Form file removed');
	}
</script>

<div class="form-container">
	<h1>Data Entry Form</h1>

  <form 
    method="POST" 
    action="?/create"
    enctype="multipart/form-data"
    use:enhance={({ formData }) => {
      console.log('Form submitting with file:', selectedFile?.name);
      console.log('Form submitting with date:', selectedDate);
      
      // Add the image file to form data if selected
      if (selectedFile) {
        formData.append('image', selectedFile);
        console.log('File added to FormData:', selectedFile.name, selectedFile.size);
      }
      
      // Add the selected date to form data
      formData.append('selectedDate', selectedDate);
      
      loading = true;
      
      return async ({ result, update }) => {
        console.log('Form submission result:', result);
        loading = false;
        await update();
      };
    }}
  >
    <!-- Date Selection Section -->
    <div class="form-group date-section">
      <label for="date-input">Entry Date:</label>
      <div class="date-input-group">
        <input
          type="date"
          id="date-input"
          bind:value={selectedDate}
          disabled={loading}
          class="date-input"
        />
        <div class="date-display">
          <span class="date-text">
            {formatDateForDisplay(selectedDate)}
          </span>
          {#if isToday(selectedDate)}
            <span class="today-badge">Today</span>
          {/if}
        </div>
      </div>
      <small class="date-help">
        {isToday(selectedDate) 
          ? 'Recording data for today' 
          : 'Recording data for a different date'}
      </small>
    </div>
    
    <div class="form-grid">
      <div class="form-group">
        <label for="loaded">Loaded:</label>
        <input
          type="number"
          id="loaded"
          name="loaded"
          bind:value={loaded}
          min="0"
          required
          disabled={loading}
        />
      </div>
      
      <div class="form-group">
        <label for="collected">Collected:</label>
        <input
          type="number"
          id="collected"
          name="collected"
          bind:value={collected}
          min="0"
          required
          disabled={loading}
        />
      </div>
      
      <div class="form-group">
        <label for="cutters">Cutters:</label>
        <input
          type="number"
          id="cutters"
          name="cutters"
          bind:value={cutters}
          min="0"
          required
          disabled={loading}
        />
      </div>
      
      <div class="form-group">
        <label for="returned">Returned:</label>
        <input
          type="number"
          id="returned"
          name="returned"
          bind:value={returned}
          min="0"
          required
          disabled={loading}
        />
      </div>
    </div>
    
    <div class="form-group image-section">
      
      <ImageUpload 
        bind:selectedFile 
        disabled={loading}
        onFileSelected={handleFileSelected}
        onFileRemoved={handleFileRemoved}
      />
      
      <!-- Debug info -->
      {#if selectedFile}
        <div class="debug-info">
          <small>Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</small>
        </div>
      {/if}
    </div>
    
    <div class="form-actions">
      <button type="submit" disabled={loading} class="submit-btn">
        {loading ? 'Saving...' : 'Submit'}
      </button>
      
      <!-- Quick date buttons -->
      <div class="quick-date-buttons">
        <button 
          type="button" 
          class="quick-date-btn"
          class:active={isToday(selectedDate)}
          onclick={() => selectedDate = getCurrentDate()}
          disabled={loading}
        >
          Today
        </button>
        <button 
          type="button" 
          class="quick-date-btn"
          onclick={() => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const year = yesterday.getFullYear();
            const month = String(yesterday.getMonth() + 1).padStart(2, '0');
            const day = String(yesterday.getDate()).padStart(2, '0');
            selectedDate = `${year}-${month}-${day}`;
          }}
          disabled={loading}
        >
          Yesterday
        </button>
      </div>
    </div>
  </form>

	{#if form?.success}
		<div class="message success">Record saved successfully!</div>
	{/if}

	{#if form?.error}
		<div class="message error">
			{form.error}
		</div>
	{/if}
</div>

<style>
  .form-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  h1 {
    text-align: center;
    color: #333;
    margin-bottom: 2rem;
  }
  
  .date-section {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    border-left: 4px solid #007bff;
  }
  
  .date-input-group {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-top: 0.5rem;
  }
  
  .date-input {
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    background: white;
    cursor: pointer;
    min-width: 150px;
  }
  
  .date-input:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
  
  .date-input:disabled {
    background-color: #f8f9fa;
    cursor: not-allowed;
  }
  
  .date-display {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
  }
  
  .date-text {
    font-weight: 500;
    color: #333;
    font-size: 1.1rem;
  }
  
  .today-badge {
    background: #28a745;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .date-help {
    color: #666;
    font-style: italic;
    margin-top: 0.5rem;
    display: block;
  }
  
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .image-section {
    grid-column: 1 / -1;
  }
  
  label {
    font-weight: 500;
    color: #333;
  }
  
  input[type="number"] {
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  input[type="number"]:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
  
  input:disabled {
    background-color: #f8f9fa;
    cursor: not-allowed;
  }
  
  .form-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-top: 2rem;
  }
  
  .submit-btn {
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.75rem 2rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .submit-btn:hover:not(:disabled) {
    background: #0056b3;
  }
  
  .submit-btn:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
  
  .quick-date-buttons {
    display: flex;
    gap: 0.5rem;
  }
  
  .quick-date-btn {
    background: #f8f9fa;
    color: #495057;
    border: 1px solid #dee2e6;
    border-radius: 20px;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .quick-date-btn:hover:not(:disabled) {
    background: #e9ecef;
    transform: translateY(-1px);
  }
  
  .quick-date-btn.active {
    background: #007bff;
    color: white;
    border-color: #007bff;
  }
  
  .quick-date-btn:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  .message {
    margin-top: 1rem;
    padding: 1rem;
    border-radius: 4px;
    text-align: center;
  }
  
  .success {
    background: #d4edda;
    border: 1px solid #c3e6cb;
    color: #155724;
  }
  
  .error {
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    color: #721c24;
  }
  
  .debug-info {
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: #f8f9fa;
    border-radius: 4px;
    color: #666;
    font-family: monospace;
  }
  
  @media (max-width: 768px) {
    .form-container {
      padding: 1rem;
    }
    
    .date-input-group {
      flex-direction: column;
      align-items: stretch;
      gap: 0.75rem;
    }
    
    .date-display {
      justify-content: center;
      text-align: center;
    }
    
    .form-grid {
      grid-template-columns: 1fr;
    }
    
    .quick-date-buttons {
      justify-content: center;
    }
  }
  
  @media (max-width: 480px) {
    h1 {
      font-size: 1.5rem;
    }
    
    .date-section {
      padding: 1rem;
    }
    
    .date-text {
      font-size: 1rem;
    }
  }
</style>
