<script lang="ts">
  import FormData from '$lib/components/FormData.svelte';
  import RecordsList from '$lib/components/RecordsList.svelte';
  import type { PageData } from './$types';
  
  let { data, form }: {
    data: PageData;
    form: import('./$types').ActionData;
  } = $props();
  
  let loading = $state(false);
</script>

<svelte:head>
  <title>Data Entry Application</title>
</svelte:head>

<main>
  <FormData {form} bind:loading />
  <RecordsList records={data.records} />
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: #f8f9fa;
    line-height: 1.6;
  }
  
  main {
    min-height: 100vh;
    padding: 2rem 0;
  }
</style>

