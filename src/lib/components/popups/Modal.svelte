<script>
	let { showModal = $bindable(), header, children, footer = null } = $props();

	let dialog = $state(); // HTMLDialogElement

	$effect(() => {
		if (showModal && dialog) {
			dialog.showModal();
		} else if (!showModal && dialog) {
			dialog.close();
		}
	});

	// Expose close function
	// function closeModal() {
	// 	showModal = false;
	// }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialog}
	onclose={() => (showModal = false)}
	onclick={(e) => {
		if (e.target === dialog) dialog.close();
	}}
>
	<div>
		<div class="modal-header">
			{@render header?.()}
		</div>
		<hr />
		<div class="modal-content">
			{@render children?.()}
		</div>
		<hr />
		<div class="modal-footer">
			{#if footer}
				{@render footer()}
			{:else}
				<!-- svelte-ignore a11y_autofocus -->
				<button autofocus onclick={() => dialog.close()}>Close</button>
			{/if}
		</div>
	</div>
</dialog>

<style>
	dialog {
		max-width: 48em;
		border-radius: 0.2em;
		border: none;
		padding: 0;
	}
	dialog::backdrop {
		background: rgba(0, 0, 0, 0.3);
	}
	dialog > div {
		padding: 1em;
	}
	dialog[open] {
		animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	hr {
		border: none;
		border-top: 1px solid #ccc;
		margin: 1em 0;
	}
	@keyframes zoom {
		from {
			transform: scale(0.95);
		}
		to {
			transform: scale(1);
		}
	}
	dialog[open]::backdrop {
		animation: fade 0.2s ease-out;
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	button {
		display: block;
		margin: 1em auto;
		padding: 0.5em 1em;
		border: none;
		border-radius: 4px;
		background: #07121e;
		color: white;
		font-size: 1em;
		cursor: pointer;
	}

	.modal-footer {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.modal-content {
		flex: 1;
		overflow-y: auto;
	}
</style>
