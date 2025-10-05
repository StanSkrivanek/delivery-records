<script lang="ts">
	let { form }: { form: any } = $props();
</script>

<svelte:head>
	<title>Forgot password</title>
</svelte:head>

<div class="page">
	<h1>Forgot your password?</h1>
	<p>Enter your email and we’ll send you a reset link.</p>
	{#if form?.message}<div class="msg">{form.message}</div>{/if}
	{#if form?.error}<div class="err">{form.error}</div>{/if}
	<form method="POST">
		<label for="email">Email</label>
		<input id="email" name="email" type="email" required />
		<button type="submit">Send reset link</button>
	</form>
</div>

<style>
	.page {
		max-width: 600px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}
	label {
		display: block;
		margin-top: 1rem;
	}
	input {
		width: 100%;
		padding: 0.6rem;
	}
	button {
		margin-top: 1rem;
	}
	.msg {
		background: #ecfdf5;
		border: 1px solid #10b981;
		padding: 0.6rem;
		border-radius: 6px;
	}
	.err {
		background: #fef2f2;
		border: 1px solid #ef4444;
		padding: 0.6rem;
		border-radius: 6px;
	}
</style>
