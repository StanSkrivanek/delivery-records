<script lang="ts">
	export let data: { invalid?: boolean; form?: any };
	let { form } = data as any;
</script>

<svelte:head>
	<title>Reset password</title>
</svelte:head>

<div class="page">
	<h1>Reset your password</h1>
	{#if data.invalid}
		<div class="err">This reset link is invalid or has expired. You can request a new one.</div>
		<p><a href="/auth/forgot">Request a new password reset link</a></p>
	{:else}
		{#if form?.error}<div class="err">{form.error}</div>{/if}
		<form method="POST">
			<label for="password">New password</label>
			<input id="password" name="password" type="password" minlength="12" required />
			<label for="confirm">Confirm password</label>
			<input id="confirm" name="confirm" type="password" minlength="12" required />
			<button type="submit">Set new password</button>
		</form>
	{/if}
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
	.err {
		background: #fef2f2;
		border: 1px solid #ef4444;
		padding: 0.6rem;
		border-radius: 6px;
	}
</style>
