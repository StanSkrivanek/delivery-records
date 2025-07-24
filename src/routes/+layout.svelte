<script>
	//  props we can access {children, data, form}
	let { children } = $props();
	import '../app.css';
</script>

<nav>
	<a href="/">Home</a>
	<a href="/overview">Overview</a>
</nav>
<main>
	{@render children()}
</main>
