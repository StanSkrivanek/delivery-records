<script lang="ts">
	import UniversalChart from '$lib/components/charts/BarGoups.svelte';

	// Example 1: Sales data by month
	let salesData = $state([
		{ month: 'Jan', product_a: 120, product_b: 89, product_c: 156 },
		{ month: 'Feb', product_a: 135, product_b: 94, product_c: 142 },
		{ month: 'Mar', product_a: 98, product_b: 167, product_c: 178 },
		{ month: 'Apr', product_a: 156, product_b: 145, product_c: 134 },
		{ month: 'May', product_a: 142, product_b: 123, product_c: 189 },
		{ month: 'Jun', product_a: 178, product_b: 156, product_c: 145 }
	]);

	// Example 2: Website traffic by day (with missing dates)
	let trafficData = $state([
		{ date: '2025-01-01', visits: 1200, pageviews: 3400, bounces: 480 },
		{ date: '2025-01-02', visits: 1350, pageviews: 3750, bounces: 520 },
		{ date: '2025-01-04', visits: 980, pageviews: 2890, bounces: 390 },
		{ date: '2025-01-07', visits: 1560, pageviews: 4200, bounces: 620 },
		{ date: '2025-01-10', visits: 1780, pageviews: 4890, bounces: 710 },
		{ date: '2025-01-15', visits: 1450, pageviews: 3980, bounces: 580 },
		{ date: '2025-01-20', visits: 1670, pageviews: 4560, bounces: 650 },
		{ date: '2025-01-25', visits: 1890, pageviews: 5200, bounces: 750 },
		{ date: '2025-01-30', visits: 1420, pageviews: 3890, bounces: 570 }
	]);

	// Example 3: Performance metrics by quarter
	let performanceData = $state([
		{ quarter: 'Q1 2024', efficiency: 85, quality: 92, satisfaction: 88 },
		{ quarter: 'Q2 2024', efficiency: 88, quality: 94, satisfaction: 91 },
		{ quarter: 'Q3 2024', efficiency: 92, quality: 89, satisfaction: 87 },
		{ quarter: 'Q4 2024', efficiency: 90, quality: 96, satisfaction: 93 }
	]);

	// Example 4: Custom numeric data
	let numericData = $state([
		{ score: 10, teamA: 45, teamB: 52, teamC: 38 },
		{ score: 20, teamA: 67, teamB: 43, teamC: 59 },
		{ score: 30, teamA: 52, teamB: 71, teamC: 45 },
		{ score: 40, teamA: 78, teamB: 56, teamC: 67 },
		{ score: 50, teamA: 63, teamB: 84, teamC: 72 }
	]);

	// Custom formatters
	const percentageFormatter = (value: number) => `${value}%`;
	const currencyFormatter = (value: number) => `$${value.toLocaleString()}`;
	const thousandsFormatter = (value: number) => `${(value / 1000).toFixed(1)}k`;
</script>

<div class="examples-container">
	<header class="page-header">
		<h1>📊 Universal Grouped Bar Chart Examples</h1>
		<p>Flexible chart component that works with any dataset using xKey and yKeys</p>
	</header>

	<!-- Example 1: Monthly Sales Data -->
	<section class="example-section">
		<div class="example-header">
			<h2>📈 Monthly Sales by Product</h2>
			<p>Simple categorical data with custom colors and labels</p>
		</div>

		<div class="chart-wrapper">
			<UniversalChart
				data={salesData}
				xKey="month"
				yKeys={['product_a', 'product_b', 'product_c']}
				metrics={[
					{ key: 'product_a', name: 'Product A', color: '#10b981' },
					{ key: 'product_b', name: 'Product B', color: '#3b82f6' },
					{ key: 'product_c', name: 'Product C', color: '#f59e0b' }
				]}
				title="Monthly Sales Performance"
				xAxisLabel="Month"
				yAxisLabel="Sales Volume"
				width="100%"
				height={400}
				showValues={true}
				valueFormatter={currencyFormatter}
			/>
		</div>

		<div class="code-example">
			<h4>Usage:</h4>
			<pre>
<code
					>&lt;UniversalChart
	data=&#123;"salesData"&#125;
	xKey="month"
	yKeys=&#123;['product_a', 'product_b', 'product_c']&#125;
	metrics=&#123;[
		&#123; key: 'product_a', name: 'Product A', color: '#10b981' &#125;,
		&#123; key: 'product_b', name: 'Product B', color: '#3b82f6' &#125;,
		&#123; key: 'product_c', name: 'Product C', color: '#f59e0b' &#125;
	]}
	title="Monthly Sales Performance"
	valueFormatter={currencyFormatter}
	/&gt;</code
				>
</pre>
		</div>
	</section>

	<!-- Example 2: Traffic Data with Missing Dates -->
	<section class="example-section">
		<div class="example-header">
			<h2>🌐 Website Traffic (with Missing Dates)</h2>
			<p>Date-based data with automatic date filling for complete month view</p>
		</div>

		<div class="chart-wrapper">
			<UniversalChart
				data={trafficData}
				xKey="date"
				yKeys={['visits', 'pageviews', 'bounces']}
				metrics={[
					{ key: 'visits', name: 'Visits', color: '#06b6d4' },
					{ key: 'pageviews', name: 'Page Views', color: '#8b5cf6' },
					{ key: 'bounces', name: 'Bounces', color: '#ef4444' }
				]}
				title="Daily Website Traffic - January 2025"
				xAxisLabel="Day of Month"
				yAxisLabel="Count"
				width="100%"
				height={450}
				fillMissingDates={true}
				valueFormatter={thousandsFormatter}
				groupSpacing={2}
				barSpacing={1}
			/>
		</div>

		<div class="code-example">
			<h4>Usage:</h4>
			<pre><code
					>&lt;UniversalChart
  data=&#123;trafficData&#125;
  xKey="date"
  yKeys=&#123;['visits', 'pageviews', 'bounces']&#125;
  fillMissingDates=&#123;true&#125;
  valueFormatter=&#123;(v) => `$&#123;(v/1000).toFixed(1)&#125;k`&#125;
/&gt;</code
				></pre>
		</div>
	</section>

	<!-- Example 3: Performance Metrics -->
	<section class="example-section">
		<div class="example-header">
			<h2>⚡ Performance Metrics by Quarter</h2>
			<p>Percentage-based data with custom formatting</p>
		</div>

		<div class="chart-wrapper">
			<UniversalChart
				data={performanceData}
				xKey="quarter"
				yKeys={['efficiency', 'quality', 'satisfaction']}
				title="Quarterly Performance Metrics"
				xAxisLabel="Quarter"
				yAxisLabel="Score (%)"
				width="100%"
				height={350}
				showValues={true}
				valueFormatter={percentageFormatter}
				defaultColors={['#10b981', '#8b5cf6', '#f97316']}
			/>
		</div>

		<div class="code-example">
			<h4>Usage:</h4>
			<pre><code
					>&lt;UniversalChart
  data=&#123;performanceData&#125;
  xKey="quarter"
  yKeys=&#123;['efficiency', 'quality', 'satisfaction']&#125;
  valueFormatter=&#123;(v) => `$&#123;v&#125;%`&#125;
  showValues=&#123;true&#125;
/&gt;</code
				></pre>
		</div>
	</section>

	<!-- Example 4: Numeric X-Axis -->
	<section class="example-section">
		<div class="example-header">
			<h2>🎯 Team Performance by Score Range</h2>
			<p>Numeric x-axis with automatic sorting and color scheme</p>
		</div>

		<div class="chart-wrapper">
			<UniversalChart
				data={numericData}
				xKey="score"
				yKeys={['teamA', 'teamB', 'teamC']}
				title="Team Performance Across Score Ranges"
				xAxisLabel="Score Range"
				yAxisLabel="Performance Value"
				width="100%"
				height={400}
				animate={true}
				showTooltip={true}
			/>
		</div>

		<div class="code-example">
			<h4>Usage:</h4>
			<pre><code
					>&lt;UniversalChart
  data=&#123;numericData&#125;
  xKey="score"
  yKeys=&#123;['teamA', 'teamB', 'teamC']&#125;
  title="Team Performance Across Score Ranges"
/&gt;</code
				></pre>
		</div>
	</section>

	<!-- Example 5: Delivery Data (Original Use Case) -->
	<section class="example-section">
		<div class="example-header">
			<h2>📦 Delivery Statistics</h2>
			<p>Your original delivery use case with the universal component</p>
		</div>

		<div class="chart-wrapper">
			<UniversalChart
				data={[
					{ date: '2025-01-01', delivery: 120, collections: 45, fails: 8 },
					{ date: '2025-01-02', delivery: 135, collections: 52, fails: 12 },
					{ date: '2025-01-03', delivery: 98, collections: 38, fails: 5 },
					{ date: '2025-01-05', delivery: 156, collections: 61, fails: 15 },
					{ date: '2025-01-08', delivery: 142, collections: 55, fails: 9 },
					{ date: '2025-01-12', delivery: 134, collections: 48, fails: 11 },
					{ date: '2025-01-15', delivery: 178, collections: 72, fails: 22 },
					{ date: '2025-01-20', delivery: 159, collections: 63, fails: 16 },
					{ date: '2025-01-25', delivery: 188, collections: 78, fails: 25 },
					{ date: '2025-01-30', delivery: 142, collections: 54, fails: 13 }
				]}
				xKey="date"
				yKeys={['delivery', 'collections', 'fails']}
				metrics={[
					{ key: 'delivery', name: 'Deliveries', color: '#10b981' },
					{ key: 'collections', name: 'Collections', color: '#3b82f6' },
					{ key: 'fails', name: 'Fails', color: '#ef4444' }
				]}
				title="Daily Delivery Statistics - January 2025"
				xAxisLabel="Day of Month"
				yAxisLabel="Count"
				width="100%"
				height={450}
				fillMissingDates={true}
				showTooltip={true}
				animate={true}
			/>
		</div>

		<div class="code-example">
			<h4>Usage:</h4>
			<pre><code
					>&lt;UniversalChart
  data=&#123;deliveryData&#125;
  xKey="date"
  yKeys=&#123;['delivery', 'collections', 'fails']&#125;
  fillMissingDates=&#123;true&#125;
  title="Daily Delivery Statistics"
/&gt;</code
				></pre>
		</div>
	</section>

	<!-- Configuration Reference -->
	<section class="reference-section">
		<h2>📚 Configuration Reference</h2>

		<div class="reference-grid">
			<div class="reference-card">
				<h3>Core Props</h3>
				<ul>
					<li><code>data</code> - Array of data objects</li>
					<li><code>xKey</code> - Property name for x-axis values</li>
					<li><code>yKeys</code> - Array of property names for y-axis values</li>
					<li><code>metrics</code> - Optional custom metric configuration</li>
				</ul>
			</div>

			<div class="reference-card">
				<h3>Appearance</h3>
				<ul>
					<li><code>width</code> - Chart width (number, string, %)</li>
					<li><code>height</code> - Chart height (number, string, %)</li>
					<li><code>title</code> - Chart title</li>
					<li><code>xAxisLabel</code> - X-axis label</li>
					<li><code>yAxisLabel</code> - Y-axis label</li>
				</ul>
			</div>

			<div class="reference-card">
				<h3>Interactivity</h3>
				<ul>
					<li><code>showTooltip</code> - Enable/disable tooltips</li>
					<li><code>animate</code> - Enable/disable animations</li>
					<li><code>showLegend</code> - Show/hide legend</li>
					<li><code>showValues</code> - Show values on bars</li>
				</ul>
			</div>

			<div class="reference-card">
				<h3>Data Processing</h3>
				<ul>
					<li><code>fillMissingDates</code> - Fill gaps in date series</li>
					<li><code>dateRange</code> - Custom date range</li>
					<li><code>valueFormatter</code> - Custom value formatting</li>
					<li><code>defaultColors</code> - Color palette</li>
				</ul>
			</div>

			<div class="reference-card">
				<h3>Spacing & Layout</h3>
				<ul>
					<li><code>padding</code> - Chart padding</li>
					<li><code>groupSpacing</code> - Space between groups</li>
					<li><code>barSpacing</code> - Space between bars in group</li>
					<li><code>legendGap</code> - Space before legend</li>
				</ul>
			</div>

			<!-- <div class="reference-card">
				<h3>Data Examples</h3>
				<ul>
					<li>Date series: <code>[{date: '2025-01-01', value: 100}]</code></li>
					<li>Categorical: <code>[{month: 'Jan', sales: 200}]</code></li>
					<li>Numeric: <code>[{score: 10, result: 50}]</code></li>
					<li>Multiple metrics: <code>[{date: '2025-01-01', a: 10, b: 20}]</code></li>
				</ul>
			</div> -->
		</div>
	</section>
</div>

<style>
	.examples-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 20px;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background-color: #f8fafc;
		min-height: 100vh;
	}

	.page-header {
		text-align: center;
		margin-bottom: 3rem;
		padding: 2rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border-radius: 12px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
	}

	.page-header h1 {
		margin: 0;
		font-size: 2.5rem;
		font-weight: 700;
	}

	.page-header p {
		margin: 0.5rem 0 0 0;
		font-size: 1.1rem;
		opacity: 0.9;
	}

	.example-section {
		margin-bottom: 4rem;
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
		overflow: hidden;
	}

	.example-header {
		padding: 2rem 2rem 1rem 2rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.example-header h2 {
		margin: 0 0 0.5rem 0;
		color: #1f2937;
		font-size: 1.5rem;
	}

	.example-header p {
		margin: 0;
		color: #6b7280;
		font-size: 1rem;
	}

	.chart-wrapper {
		padding: 2rem;
		background: #fafbfc;
	}

	.code-example {
		padding: 1.5rem 2rem;
		background: #f3f4f6;
		border-top: 1px solid #e5e7eb;
	}

	.code-example h4 {
		margin: 0 0 1rem 0;
		color: #374151;
		font-size: 0.9rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.code-example pre {
		margin: 0;
		padding: 1rem;
		background: #1f2937;
		color: #f9fafb;
		border-radius: 6px;
		overflow-x: auto;
		font-size: 0.85rem;
		line-height: 1.4;
	}

	.code-example code {
		font-family: 'SF Mono', Monaco, 'Inconsolata', 'Roboto Mono', monospace;
	}

	.reference-section {
		margin-top: 4rem;
		padding: 2rem;
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
	}

	.reference-section h2 {
		margin: 0 0 2rem 0;
		text-align: center;
		color: #1f2937;
		font-size: 1.8rem;
	}

	.reference-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.reference-card {
		padding: 1.5rem;
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
	}

	.reference-card h3 {
		margin: 0 0 1rem 0;
		color: #374151;
		font-size: 1.1rem;
		font-weight: 600;
	}

	.reference-card ul {
		margin: 0;
		padding-left: 1.2rem;
		list-style-type: disc;
	}

	.reference-card li {
		margin-bottom: 0.5rem;
		color: #4b5563;
		line-height: 1.4;
	}

	.reference-card code {
		background: #e5e7eb;
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		font-size: 0.85rem;
		font-family: 'SF Mono', Monaco, monospace;
		color: #374151;
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.examples-container {
			padding: 10px;
		}

		.page-header {
			padding: 1.5rem;
		}

		.page-header h1 {
			font-size: 2rem;
		}

		.example-header {
			padding: 1.5rem 1.5rem 1rem 1.5rem;
		}

		.chart-wrapper {
			padding: 1rem;
		}

		.code-example {
			padding: 1rem 1.5rem;
		}

		.reference-section {
			padding: 1.5rem;
		}

		.reference-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
