<script lang="ts">
	import { onMount } from 'svelte';
	import { Spring } from 'svelte/motion';

	// Generic data point type
	type DataPoint = Record<string, any>;

	type ProcessedDataPoint = {
		xValue: any;
		xLabel: string;
		yValues: { [key: string]: number };
	};

	type MetricConfig = {
		key: string;
		name: string;
		color: string;
	};

	let {
		// Core data configuration
		data = [] as DataPoint[],
		xKey = 'date' as string,
		yKeys = ['value1', 'value2', 'value3'] as string[],

		// Metric configuration - can override yKeys if provided
		metrics = [] as MetricConfig[],

		// Chart appearance
		width = '100%' as number | string,
		height = 400 as number | string,
		padding = 60,

		// Interactivity
		showTooltip = true,
		animate = true,
		showLegend = true,
		showValues = false,

		// Spacing
		groupSpacing = 4,
		barSpacing = 2,
		legendGap = 10,

		// Customization
		title = '' as string,
		xAxisLabel = '' as string,
		yAxisLabel = '' as string,

		// Data processing options
		fillMissingDates = false, // For date-based charts
		dateRange = null as { start: string; end: string } | null, // For date ranges

		// Number formatting
		valueFormatter = (value: number) => value.toLocaleString(),

		// Color scheme
		defaultColors = [
			'#10b981',
			'#3b82f6',
			'#ef4444',
			'#f59e0b',
			'#8b5cf6',
			'#06b6d4',
			'#84cc16',
			'#f97316',
			'#ec4899',
			'#6366f1'
		] as string[]
	} = $props();

	let tooltip = $state({
		visible: false,
		x: 0,
		y: 0,
		content: ''
	});

	let hoveredBar = $state({ groupIndex: -1, metricIndex: -1 });
	let mounted = $state(false);
	let containerElement: HTMLDivElement;
	let containerWidth = $state(800);
	let containerHeight = $state(400);

	// Helper function to format dimension for CSS
	const formatDimension = (value: number | string): string => {
		if (typeof value === 'number') return `${value}px`;
		return value;
	};

	// Helper functions to handle responsive dimensions
	const getNumericValue = (value: number | string): number => {
		if (typeof value === 'number') return value;

		if (typeof value === 'string') {
			if (value.includes('vw')) {
				const num = parseFloat(value);
				if (typeof window !== 'undefined') {
					return (num / 100) * window.innerWidth;
				}
				return 800;
			}
			if (value.includes('vh')) {
				const num = parseFloat(value);
				if (typeof window !== 'undefined') {
					return (num / 100) * window.innerHeight;
				}
				return 400;
			}
			if (value.includes('px')) {
				return parseFloat(value);
			}
			if (value.includes('%')) {
				return containerWidth;
			}
			const parsed = parseFloat(value);
			return isNaN(parsed) ? 800 : parsed;
		}

		return 800;
	};

	// Get actual dimensions
	const actualWidth = $derived(
		(() => {
			if (typeof width === 'string' && (width.includes('%') || width === '100%')) {
				return containerWidth;
			}
			return getNumericValue(width);
		})()
	);

	const actualHeight = $derived(
		(() => {
			if (typeof height === 'string' && (height.includes('%') || height === '100%')) {
				return containerHeight;
			}
			return getNumericValue(height);
		})()
	);

	// Process metrics configuration
	const processedMetrics = $derived(
		(() => {
			if (metrics.length > 0) {
				return metrics;
			}

			// Auto-generate metrics from yKeys
			return yKeys.map((key, index) => ({
				key,
				name: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
				color: defaultColors[index % defaultColors.length]
			}));
		})()
	);

	// Helper function to generate date range
	const generateDateRange = (start: string, end: string): string[] => {
		const dates: string[] = [];
		const startDate = new Date(start);
		const endDate = new Date(end);

		const currentDate = new Date(startDate);
		while (currentDate <= endDate) {
			dates.push(currentDate.toISOString().split('T')[0]);
			currentDate.setDate(currentDate.getDate() + 1);
		}

		return dates;
	};

	// Helper function to get all dates in a month
	const getAllDatesInMonth = (yearMonth: string): string[] => {
		const [year, month] = yearMonth.split('-').map(Number);
		const daysInMonth = new Date(year, month, 0).getDate();

		const dates: string[] = [];
		for (let day = 1; day <= daysInMonth; day++) {
			const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
			dates.push(dateStr);
		}
		return dates;
	};

	// Process data for charting
	const processedData = $derived(
		(() => {
			// Create a map of existing data
			const dataMap = new Map<any, DataPoint>();
			data.forEach((item) => {
				dataMap.set(item[xKey], item);
			});

			let allXValues: any[] = [];
			// Determine x values based on fillMissingDates and dateRange
			// if true it will generate a complete date range
			// if false it will use existing x values
			if (fillMissingDates && typeof data[0]?.[xKey] === 'string') {
				// Handle date-based data
				if (dateRange) {
					allXValues = generateDateRange(dateRange.start, dateRange.end);
				} else {
					// Auto-detect month from first date
					const firstDate = data[0]?.[xKey];
					if (firstDate && firstDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
						const yearMonth = firstDate.slice(0, 7);
						allXValues = getAllDatesInMonth(yearMonth);
					} else {
						allXValues = [...new Set(data.map((item) => item[xKey]))].sort();
					}
				}
			} else {
				// Use existing data x values
				allXValues = [...new Set(data.map((item) => item[xKey]))];

				// Try to sort if possible
				try {
					allXValues.sort((a, b) => {
						if (typeof a === 'number' && typeof b === 'number') return a - b;
						if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
						return 0;
					});
				} catch (e) {
					// Keep original order if sorting fails
				}
			}

			// Process each x value
			return allXValues.map((xValue) => {
				const existingData = dataMap.get(xValue);
				const yValues: { [key: string]: number } = {};

				// Fill y values
				processedMetrics.forEach((metric) => {
					yValues[metric.key] = existingData?.[metric.key] || 0;
				});

				// Generate x label
				let xLabel = String(xValue);
				if (typeof xValue === 'string' && xValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
					// Format date
					const date = new Date(xValue);
					xLabel = date.getDate().toString();
				}

				return {
					xValue,
					xLabel,
					yValues
				} as ProcessedDataPoint;
			});
		})()
	);

	// Calculate dimensions
	const legendHeight = showLegend ? 40 : 0;
	const titleHeight = title ? 40 : 0;
	const chartWidth = $derived(actualWidth - padding * 2);
	const chartHeight = $derived(actualHeight - padding * 2 - legendHeight - titleHeight);

	// Calculate the SVG height directly
	const svgHeight = $derived(actualHeight - legendHeight - titleHeight);

	// Calculate bar dimensions
	const groupWidth = $derived(
		Math.max(1, (chartWidth - (processedData.length - 1) * groupSpacing) / processedData.length)
	);
	const barWidth = $derived(
		Math.max(1, (groupWidth - (processedMetrics.length - 1) * barSpacing) / processedMetrics.length)
	);

	// Find max value for scaling
	const maxValue = $derived(
		(() => {
			let max = 0;
			processedData.forEach((item) => {
				processedMetrics.forEach((metric) => {
					const value = item.yValues[metric.key] || 0;
					if (value > max) max = value;
				});
			});
			return max || 100; // Fallback
		})()
	);

	// Create Spring instances for each bar
	const animatedHeights = $derived(
		processedData.map(() =>
			processedMetrics.map(() => new Spring(0, { stiffness: 0.15, damping: 0.8 }))
		)
	);

	// Calculate bar heights
	const barHeights = $derived(
		processedData.map((item) =>
			processedMetrics.map((metric) => {
				const value = item.yValues[metric.key] || 0;
				return (value / maxValue) * chartHeight;
			})
		)
	);

	onMount(() => {
		mounted = true;

		// Set up ResizeObserver
		if (containerElement) {
			const updateContainerSize = () => {
				const rect = containerElement.getBoundingClientRect();
				containerWidth = rect.width;
				containerHeight = rect.height;
			};

			updateContainerSize();

			const resizeObserver = new ResizeObserver(updateContainerSize);
			resizeObserver.observe(containerElement);

			return () => {
				resizeObserver.disconnect();
			};
		}
	});

	// Animate bars when mounted
	$effect(() => {
		if (mounted && animate) {
			barHeights.forEach((heights, groupIndex) => {
				heights.forEach((height, metricIndex) => {
					// Remove setTimeout for the last group to avoid choppy ending
					const isLast =
						groupIndex === barHeights.length - 1 &&
						metricIndex === heights.length - 1;
					if (isLast) {
						animatedHeights[groupIndex][metricIndex].target = height;
					} else {
						setTimeout(
							() => {
								animatedHeights[groupIndex][metricIndex].target = height;
							},
							(groupIndex * processedMetrics.length + metricIndex) * 20
						);
					}
				});
			});
		} else if (mounted) {
			barHeights.forEach((heights, groupIndex) => {
				heights.forEach((height, metricIndex) => {
					animatedHeights[groupIndex][metricIndex].target = height;
				});
			});
		}
	});

	function handleMouseEnter(event: MouseEvent, groupIndex: number, metricIndex: number) {
		if (!showTooltip) return;

		hoveredBar = { groupIndex, metricIndex };
		const rect = (event.target as HTMLElement).getBoundingClientRect();

		const item = processedData[groupIndex];
		const metric = processedMetrics[metricIndex];
		const value = item.yValues[metric.key];

		tooltip.visible = true;
		tooltip.x = rect.left + rect.width / 2;
		tooltip.y = rect.top - 10;
		tooltip.content = `${metric.name}: ${valueFormatter(value)} (${item.xLabel})`;
	}

	function handleMouseLeave() {
		if (!showTooltip) return;
		hoveredBar = { groupIndex: -1, metricIndex: -1 };
		tooltip.visible = false;
	}

	function handleMouseMove(event: MouseEvent) {
		if (!showTooltip || !tooltip.visible) return;
		tooltip.x = event.clientX;
		tooltip.y = event.clientY - 10;
	}
</script>

<div
	bind:this={containerElement}
	class="chart-container"
	style="width: {formatDimension(width)}; height: {formatDimension(
		height
	)}; --legend-gap: {legendGap}px; --legend-height: {legendHeight}px; --title-height: {titleHeight}px;"
>
	<!-- Chart Title -->
	{#if title}
		<div class="chart-title">
			<h3>{title}</h3>
		</div>
	{/if}

	<svg
		width="100%"
		height={svgHeight}
		viewBox="0 0 {actualWidth} {actualHeight - legendHeight - titleHeight}"
	>
		<!-- Chart bars -->
		{#each processedData as item, groupIndex}
			{@const groupX = padding + groupIndex * (groupWidth + groupSpacing)}

			{#each processedMetrics as metric, metricIndex}
				{@const value = item.yValues[metric.key]}
				{@const x = groupX + metricIndex * (barWidth + barSpacing)}
				{@const barHeight = animate
					? animatedHeights[groupIndex][metricIndex].current
					: barHeights[groupIndex][metricIndex]}
				{@const y = padding + chartHeight - barHeight}
				{@const isHovered =
					hoveredBar.groupIndex === groupIndex && hoveredBar.metricIndex === metricIndex}

				<rect
					{x}
					{y}
					width={barWidth}
					height={barHeight}
					fill={metric.color}
					stroke={isHovered ? 'rgba(255,255,255,0.4)' : 'none'}
					stroke-width={isHovered ? 2 : 0}
					opacity={isHovered ? 0.8 : value === 0 ? 0.3 : 1}
					rx="2"
					ry="2"
					class="bar"
					role="graphics-symbol"
					aria-label="{metric.name} {item.xLabel}: {value}"
					onmouseenter={(e) => handleMouseEnter(e, groupIndex, metricIndex)}
					onmouseleave={handleMouseLeave}
					onmousemove={handleMouseMove}
				/>

				<!-- Value labels on bars -->
				{#if showValues && barHeight > 15 && value > 0}
					<text
						x={x + barWidth / 2}
						y={y - 4}
						text-anchor="middle"
						class="value-label"
						fill="#333"
						font-size="9"
						font-weight="500"
					>
						{valueFormatter(value)}
					</text>
				{/if}
			{/each}

			<!-- X-axis labels -->
			{@const shouldShowLabel =
				groupWidth > 20 || groupIndex % Math.max(1, Math.floor(processedData.length / 15)) === 0}
			{#if shouldShowLabel}
				<text
					x={groupX + groupWidth / 2}
					y={padding + chartHeight + 16}
					text-anchor="middle"
					class="x-label"
					fill="#666"
					font-size="10"
					font-weight="500"
				>
					{item.xLabel}
				</text>
			{/if}
		{/each}

		<!-- Y-axis guidelines -->
		{#each Array(6) as _, i}
			{@const yPos = padding + (chartHeight / 5) * i}
			{@const value = Math.round(maxValue - (maxValue / 5) * i)}

			<line
				x1={padding}
				y1={yPos}
				x2={padding + chartWidth}
				y2={yPos}
				stroke="#e5e7eb"
				stroke-width="1"
				opacity="0.5"
			/>

			<text
				x={padding - 8}
				y={yPos + 4}
				text-anchor="end"
				class="axis-label"
				fill="#9ca3af"
				font-size="10"
			>
				{valueFormatter(value)}
			</text>
		{/each}

		<!-- Axes -->
		<line
			x1={padding}
			y1={padding}
			x2={padding}
			y2={padding + chartHeight}
			stroke="#d1d5db"
			stroke-width="1"
		/>
		<line
			x1={padding}
			y1={padding + chartHeight}
			x2={padding + chartWidth}
			y2={padding + chartHeight}
			stroke="#d1d5db"
			stroke-width="1"
		/>

		<!-- Axis labels -->
		{#if xAxisLabel}
			<text
				x={padding + chartWidth / 2}
				y={padding + chartHeight + 35}
				text-anchor="middle"
				class="axis-title"
				fill="#4b5563"
				font-size="12"
				font-weight="500"
			>
				{xAxisLabel}
			</text>
		{/if}

		{#if yAxisLabel}
			<text
				x={20}
				y={padding + chartHeight / 2}
				text-anchor="middle"
				class="axis-title"
				fill="#4b5563"
				font-size="12"
				font-weight="500"
				transform="rotate(-90, 20, {padding + chartHeight / 2})"
			>
				{yAxisLabel}
			</text>
		{/if}
	</svg>

	<!-- Legend -->
	{#if showLegend}
		<div class="legend">
			{#each processedMetrics as metric}
				<div class="legend-item">
					<div class="legend-color" style="background-color: {metric.color};"></div>
					<span class="legend-label">{metric.name}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Tooltip -->
{#if showTooltip && tooltip.visible}
	<div class="tooltip" style="left: {tooltip.x}px; top: {tooltip.y}px;" role="tooltip">
		{tooltip.content}
	</div>
{/if}

<style>
	.chart-container {
		position: relative;
		display: inline-block;
		font-family:
			'regular',
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			Roboto,
			sans-serif;
		box-sizing: border-box;
		background: #fefefe;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 16px;
	}

	.chart-title {
		text-align: center;
		margin-bottom: 8px;
		height: var(--title-height, 0px);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.chart-title h3 {
		margin: 0;
		font-size: 24px;
		font-weight: 600;
		/* color: #1f2937; */
	}

	.chart-container svg {
		width: 100%;
		height: 100%;
		display: block;
		overflow: visible;
	}

	.bar {
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.bar:hover {
		filter: brightness(1.1);
	}

	.value-label,
	.x-label,
	.axis-label,
	.axis-title {
		pointer-events: none;
		font-family: inherit;
	}

	.legend {
		display: flex;
		justify-content: center;
		align-items: center;
		flex-wrap: wrap;
		gap: 20px;
		margin-top: var(--legend-gap);
		padding: 12px 20px;
		background: #f9fafb;
		border-radius: 6px;
		border: 1px solid #e5e7eb;
		height: calc(var(--legend-height, 0px) - 12px);
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.legend-color {
		width: 14px;
		height: 14px;
		border-radius: 3px;
		flex-shrink: 0;
		border: 1px solid rgba(0, 0, 0, 0.1);
	}

	.legend-label {
		font-size: 13px;
		color: #374151;
		font-weight: 500;
		white-space: nowrap;
	}

	.tooltip {
		position: fixed;
		background: rgba(0, 0, 0, 0.85);
		color: white;
		padding: 8px 12px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 500;
		pointer-events: none;
		z-index: 1000;
		transform: translateX(-50%) translateY(-100%);
		white-space: nowrap;
		font-family: inherit;
		max-width: 250px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.tooltip::after {
		content: '';
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		width: 0;
		height: 0;
		border: 5px solid transparent;
		border-top-color: rgba(0, 0, 0, 0.85);
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.chart-container {
			padding: 12px;
		}

		.chart-title h3 {
			font-size: 14px;
		}

		.legend {
			gap: 12px;
			padding: 8px 12px;
		}

		.legend-label {
			font-size: 12px;
		}
	}
</style>
