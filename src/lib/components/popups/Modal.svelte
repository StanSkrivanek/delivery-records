<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		showModal = $bindable(false),
		header,
		footer,
		children
	}: {
		showModal?: boolean;
		header?: Snippet;
		footer?: Snippet;
		children?: Snippet;
	} = $props();

	let dialog = $state<HTMLDialogElement>();

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

<dialog
	bind:this={dialog}
	onclose={() => (showModal = false)}
	onclick={(event) => {
		if (event.target === dialog) {
			dialog.close();
		}
	}}
	onkeydown={(event) => {
		if ((event.key === 'Enter' || event.key === ' ') && event.target === dialog) {
			event.preventDefault();
			dialog.close();
		}
	}}
>
	<div class="dialog">
		{#if header}
			<div class="dialog-header">
				{@render header()}
			</div>
		{/if}

		<div class="dialog-content">
			{@render children?.()}
		</div>

		<div class="dialog-footer">
			{#if footer}
				{@render footer()}
			{:else}
				<button type="button" onclick={() => dialog?.close()}>Close</button>
			{/if}
		</div>
	</div>
</dialog>

<style>
	dialog {
		width: 48em;
		border-radius: 0.4em;
		border: none;
		padding: 0;
		@media screen and (max-width: 400px) {
			width: 90vw;
		}
	}
	dialog::backdrop {
		background: rgba(0, 0, 0, 0.3);
	}

	dialog > div {
		padding: 1em;
		background: white;
		border-radius: 0.4em;
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	dialog[open] {
		animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	@media (prefers-reduced-motion: reduce) {
		dialog[open] {
			animation: none;
		}
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
	.dialog-header {
		font-size: 1.2em;
		/* font-weight: bold; */
		/* margin-bottom: 0.5em; */
		border-bottom: 1px solid #ccc;
	}
	.dialog-content {
		flex: 1;
		overflow-y: auto;
	}
	.dialog-footer {
		padding-top: 1em;
		border-top: 1px solid #ccc;
	}
	/* .modal-footer {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	} */

	/* .modal-content {
		flex: 1;
		overflow-y: auto;
	} */
</style>
