<script lang="ts">
  // Public Contact placeholder
</script>

<svelte:head>
  <title>Contact - Fleet Manager</title>
  <meta name="description" content="Get in touch with the Fleet Manager team." />
</svelte:head>

<section class="hero">
  <h1>Contact</h1>
  <p>Questions or feedback? Reach out and we’ll get back to you.</p>

  <form class="contact-form" on:submit|preventDefault>
    <label>
      Name
      <input type="text" placeholder="Your name" required />
    </label>
    <label>
      Email
      <input type="email" placeholder="you@example.com" required />
    </label>
    <label>
      Message
      <textarea rows="5" placeholder="How can we help?" required></textarea>
    </label>
    <button type="submit">Send</button>
  </form>
</section>

<style>
  .hero { max-width: 900px; margin: 2rem auto; padding: 0 1rem; }
  h1 { margin: 0 0 0.5rem 0; color: #111827; }
  p { color: #4b5563; margin-bottom: 1rem; }
  .contact-form { display: grid; gap: 0.75rem; max-width: 520px; }
  label { display: grid; gap: 0.25rem; color: #374151; font-weight: 500; }
  input, textarea { padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font: inherit; }
  button { background: #2563eb; color: white; border: 0; border-radius: 6px; padding: 0.5rem 0.85rem; font-weight: 600; }
  button:hover { background: #1d4ed8; }
</style>
