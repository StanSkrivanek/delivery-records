<script>
	import UniversalChart from '$lib/components/charts/BarGoups.svelte';
	import { dlvPd } from '$lib/utils.js';
	let { data } = $props();
	console.log('🚀 ~ data:', data.monthly);
	// Map through each record in the array and process it, or process the entire array
	const delivery = data.monthly.map((record) => dlvPd(record));
	const monthly = data.monthly.map((item) => {
		return {
			date: item.entry_date,
			delivery: dlvPd(item),
			collections: (item.collected ?? 0) + (item.cutters ?? 0),
			fails: (item.returned ?? 0) + (item.missplaced ?? 0)
		};
	});
	console.log('🚀 ~ monthly:', monthly);
	console.log('🚀 ~ delivery:', delivery);
</script>

<UniversalChart
	title="Monthly Delivery Records"
	data={monthly}
	xKey="date"
	yKeys={['delivery', 'collections', 'fails']}
	height="400"
	fillMissingDates={false}
/>

<!-- 	yLabels={['Delivery', 'Collections', 'Fails']}
	xLabel="Date"
	xType="time"
	yType="linear"
	yMin={0}
	yMax={Math.max(...monthly.map((item) => Math.max(item.delivery, item.collections, item.fails)))}
	yTickFormat={(d) => d.toLocaleString()}
	xTickFormat={(d) => new Date(d).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric'
	})}
	tooltipFormat={(d) => new Date(d).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	})}
	tooltipLabelFormat={(d) => new Date(d).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	})}
	tooltipValueFormat={(d) => d.toLocaleString()}
	tooltipLabel="Date"		
	fillMissingDates={true} -->
