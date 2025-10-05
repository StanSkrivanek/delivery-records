<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Sessions - Account</title>
</svelte:head>

<div class="page">
	<h1>Your sessions</h1>
	<form method="POST" action="?/revokeAll" class="actions">
		<button type="submit" class="btn danger">Revoke all</button>
	</form>
	<table>
		<thead>
			<tr>
				<th>Session ID</th>
				<th>Last seen</th>
				<th>IP</th>
				<th>Agent</th>
				<th>Expires</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each data.sessions as s}
				<tr>
					<td><code>{s.id}</code></td>
					<td>{s.last_seen ?? s.created_at}</td>
					<td>{s.ip ?? '-'}</td>
					<td>{s.user_agent ?? '-'}</td>
					<td>{s.expires_at}</td>
					<td>
						<form method="POST" action="?/revoke">
							<input type="hidden" name="session_id" value={s.id} />
							<button type="submit" class="btn">Revoke</button>
						</form>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.page { max-width: 900px; margin: 0 auto; padding: 2rem 1rem; }
	h1 { margin: 0 0 1rem 0; }
	.actions { margin-bottom: 1rem; }
	.btn { padding: 0.4rem 0.8rem; border-radius: 6px; border: 1px solid #d1d5db; background: #f9fafb; cursor: pointer; }
	.btn.danger { border-color: #ef4444; color: #ef4444; }
	table { width: 100%; border-collapse: collapse; }
	th, td { padding: 0.5rem 0.6rem; border-bottom: 1px solid #eee; text-align: left; }
	code { font-size: 0.8rem; }
</style>
