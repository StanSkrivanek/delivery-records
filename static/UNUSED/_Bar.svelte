<script lang="ts">
	import { dlvPd } from '$lib/utils';
	import { onMount } from 'svelte';

	// Type definitions - Real-world API data structure
	type ApiDataType = {
		row_id: string;
		loaded: number;
		collected: number;
		cutters: number;
		returned: number;
		missplaced: number;
		entry_date: string;
	};

	type ProductInfo = {
		id: string;
		name: string;
		color: string;
	};

	// Define bar colors for different metrics
	const barColors = {
		delivery: '#1982c4',
		collections: '#8ac926',
		fails: '#ff595e'
	};

	let {
		apiData,
		width = 800,
		height = 400,
		padding = 40,
		showTooltip = true,
		barSpacing = 2,
		groupSpacing = 10,
		showLegend = true,
		animate = true
	} = $props(); // API data for the chart

	// Prepare the data
	let deliveredPerDay = $derived(() => {
		return apiData.map((record: ApiDataType) => {
			let delivery = dlvPd(record),
				load = record.loaded || 0,
				collections = (record.collected || 0) + (record.cutters || 0),
				fails = (record.returned || 0) + (record.missplaced || 0);
			return { delivery, load, collections, fails, entry_date: record.entry_date };
		});
	});

	// Extract current month data
	const currentMonthData = $derived(() => {
		const now = new Date();
		const currentMonth = now.getMonth();
		const currentYear = now.getFullYear();

		return deliveredPerDay().filter((item: { entry_date: string | number | Date }) => {
			const date = new Date(item.entry_date);
			return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
		});
	});

	$inspect('🚀 ~ currentMonthData:', currentMonthData);

	let tooltip = $state({
		visible: false,
		x: 0,
		y: 0,
		content: ''
	});

	let hoveredBar = $state({ dayIndex: -1, metricIndex: -1 });
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

		// Handle viewport units
		if (typeof value === 'string') {
			if (value.includes('vw')) {
				const num = parseFloat(value);
				if (typeof window !== 'undefined') {
					return (num / 100) * window.innerWidth;
				}
				return 900; // SSR fallback
			}
			if (value.includes('vh')) {
				const num = parseFloat(value);
				if (typeof window !== 'undefined') {
					return (num / 100) * window.innerHeight;
				}
				return 360; // SSR fallback
			}
			if (value.includes('px')) {
				return parseFloat(value);
			}
			if (value.includes('%')) {
				// For percentage, we need to handle it in CSS
				// For now, provide a reasonable numeric fallback
				const num = parseFloat(value);
				return (num / 100) * 800; // Fallback to 800px as base
			}
			// Try to parse as number
			const parsed = parseFloat(value);
			return isNaN(parsed) ? 900 : parsed;
		}

		return 900; // Default fallback
	};

	// Get actual dimensions - use container size for percentage/relative units
	const actualWidth = $derived(
		(() => {
			if (typeof width === 'string') {
				const widthStr: string = width; // Cast to string for type safety
				if (widthStr.includes('%') || widthStr === '100%') {
					return containerWidth;
				}
			}
			return getNumericValue(width);
		})()
	);

	const actualHeight = $derived(
		(() => {
			if (typeof height === 'string') {
				const heightStr: string = height; // Cast to string for type safety
				if (heightStr.includes('%') || heightStr === '100%') {
					return containerHeight;
				}
			}
			return getNumericValue(height);
		})()
	);

	// Calculate dimensions
	const legendHeight = showLegend ? 30 : 0;
	const chartWidth = $derived(actualWidth - padding * 2);
	const chartHeight = $derived(actualHeight - padding * 2 - legendHeight);

	// Define metrics for our grouped bars
	const metrics = [
		{ id: 'delivery', name: 'Delivery', color: barColors.delivery },
		{ id: 'collections', name: 'Collections', color: barColors.collections },
		{ id: 'fails', name: 'Fails', color: barColors.fails }
	];

	// Minimum width for each day's group (so bars are always visible)
	const minGroupWidth = 36;
	const minBarWidth = 6;

	// Calculate SVG dimensions with fallbacks for all calculations
	const svgWidth = $derived(() => {
		const days = daysOfMonth()?.length || 0;
		if (days === 0) return actualWidth;
		const calculatedWidth = padding * 2 + days * minGroupWidth + (days - 1) * groupSpacing;
		return isFinite(calculatedWidth) && calculatedWidth > 0
			? Math.max(actualWidth, calculatedWidth)
			: actualWidth;
	});

	const groupWidth = $derived(() => {
		const days = daysOfMonth()?.length || 0;
		if (days === 0) return minGroupWidth;
		const availableSpace = svgWidth() - padding * 2 - (days - 1) * groupSpacing;
		const calculated = availableSpace / Math.max(1, days);
		return isFinite(calculated) && calculated > 0
			? Math.max(minGroupWidth, calculated)
			: minGroupWidth;
	});

	const barWidth = $derived(() => {
		const gWidth = groupWidth();
		if (!isFinite(gWidth) || gWidth <= 0) return minBarWidth;
		const availableSpace = gWidth - (metrics.length - 1) * barSpacing;
		const calculated = availableSpace / Math.max(1, metrics.length);
		return isFinite(calculated) && calculated > 0 ? Math.max(minBarWidth, calculated) : minBarWidth;
	});

	// Find max value for scaling
	const maxValue = $derived(
		(() => {
			let max = 0;
			currentMonthData().forEach((day: { [x: string]: number }) => {
				metrics.forEach((metric) => {
					const value = day[metric.id] || 0;
					if (value > max) max = value;
				});
			});
			// Ensure we have a reasonable max value even if data is sparse
			return max > 0 ? max : 100;
		})()
	);

	// Function to format dates for x-axis labels
	const formatDate = (dateString: string | number | Date) => {
		const date = new Date(dateString);
		return date.getDate().toString(); // Just the day of month
	};

	// Handle interactions
	function handleMouseEnter(event: MouseEvent, dayIndex: number, metricIndex: number) {
		if (!showTooltip) return;

		hoveredBar = { dayIndex, metricIndex };
		const rect = (event.target as HTMLElement).getBoundingClientRect();

		const day = currentMonthData()[dayIndex];
		const metric = metrics[metricIndex];
		const value = day[metric.id] || 0;
		const date = new Date(day.entry_date);
		const formattedDate = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

		tooltip.visible = true;
		tooltip.x = rect.left + rect.width / 2;
		tooltip.y = rect.top - 10;
		tooltip.content = `${metric.name} (${formattedDate}): ${value.toLocaleString()}`;
	}

	function handleMouseLeave() {
		if (!showTooltip) return;

		hoveredBar = { dayIndex: -1, metricIndex: -1 };
		tooltip.visible = false;
	}

	function handleMouseMove(event: MouseEvent) {
		if (!showTooltip || !tooltip.visible) return;

		tooltip.x = event.clientX;
		tooltip.y = event.clientY - 10;
	}

	onMount(() => {
		mounted = true;

		// Set up ResizeObserver to track container size changes
		if (containerElement) {
			const updateContainerSize = () => {
				const rect = containerElement.getBoundingClientRect();
				containerWidth = rect.width;
				containerHeight = rect.height;
			};

			// Initial size
			updateContainerSize();

			// Watch for size changes
			const resizeObserver = new ResizeObserver(updateContainerSize);
			resizeObserver.observe(containerElement);

			return () => {
				resizeObserver.disconnect();
			};
		}
	});
</script>

<div
	bind:this={containerElement}
	class="chart-container"
	style="width: {formatDimension(width)}; height: {formatDimension(
		height
	)}; --legend-gap: 10px; --legend-height: {legendHeight}px; overflow-x: auto;"
>
	<svg
		width={svgWidth()}
		height="100%"
		viewBox={`0 0 ${svgWidth()} ${actualHeight - legendHeight}`}
	>
		<!-- Y-axis guidelines -->
		{#each Array(6) as _, i}
			{@const yPos = padding + (chartHeight / 5) * i}
			{@const value = Math.round(maxValue - (maxValue / 5) * i)}

			<line
				x1={padding}
				y1={yPos}
				x2={padding + chartWidth}
				y2={yPos}
				stroke="#e0e0e0"
				stroke-width="1"
				opacity="0.5"
			/>

			<text
				x={padding - 8}
				y={yPos + 4}
				text-anchor="end"
				class="axis-label"
				fill="#999"
				font-size="10"
			>
				{value}
			</text>
		{/each}

		<!-- Y-axis line -->
		<line
			x1={padding}
			y1={padding}
			x2={padding}
			y2={padding + chartHeight}
			stroke="#ccc"
			stroke-width="1"
		/>

		<!-- X-axis line -->
		<line
			x1={padding}
			y1={padding + chartHeight}
			x2={padding + chartWidth}
			y2={padding + chartHeight}
			stroke="#ccc"
			stroke-width="1"
		/>

		<!-- Always render all days in month -->
		{#if daysOfMonth()?.length > 0}
			{#each daysOfMonth() as dayData, dayIndex}
				{@const groupX = isFinite(padding + dayIndex * (groupWidth() + groupSpacing))
					? padding + dayIndex * (groupWidth() + groupSpacing)
					: padding}

				{#each metrics as metric, metricIndex}
					{@const value = Number(dayData[metric.id]) || 0}
					{@const barWidthVal = isFinite(barWidth()) ? barWidth() : minBarWidth}
					{@const x = isFinite(groupX + metricIndex * (barWidthVal + barSpacing))
						? groupX + metricIndex * (barWidthVal + barSpacing)
						: groupX}
					{@const barHeight = isFinite((value / maxValue) * chartHeight)
						? Math.max(0, (value / maxValue) * chartHeight)
						: 0}
					{@const y = isFinite(padding + chartHeight - barHeight)
						? padding + chartHeight - barHeight
						: padding + chartHeight}
					{@const isHovered =
						hoveredBar.dayIndex === dayIndex && hoveredBar.metricIndex === metricIndex}

					{#if value > 0 && isFinite(x) && isFinite(y) && isFinite(barWidthVal) && barWidthVal > 0}
						<rect
							{x}
							{y}
							width={barWidthVal}
							height={barHeight}
							fill={metric.color}
							stroke={isHovered ? 'rgba(255,255,255,0.3)' : 'none'}
							stroke-width={isHovered ? 2 : 0}
							opacity={isHovered ? 0.8 : 1}
							rx="3"
							ry="3"
							class="bar"
							role="graphics-symbol"
							aria-label="{metric.name} {dayData.day}: {value}"
							onmouseenter={(e) => handleMouseEnter(e, dayIndex, metricIndex)}
							onmouseleave={handleMouseLeave}
							onmousemove={handleMouseMove}
						/>

						{#if barHeight > 20}
							<text
								x={x + barWidthVal / 2}
								y={y - 8}
								text-anchor="middle"
								class="value-label"
								fill="#333"
								font-size="10"
								font-weight="500"
							>
								{value.toLocaleString()}
							</text>
						{/if}
					{/if}
				{/each}

				<!-- Day labels at bottom -->
				<text
					x={groupX + (isFinite(groupWidth()) ? groupWidth() / 2 : minGroupWidth / 2)}
					y={padding + chartHeight + 16}
					text-anchor="middle"
					class="month-label"
					fill="#666"
					font-size="12"
					font-weight="500"
				>
					{dayData.day}
				</text>
			{/each}
		{:else}
			<!-- ...existing no-data message... -->
		{/if}
	</svg>

	<!-- Legend -->
	{#if showLegend}
		<div class="legend">
			{#each metrics as metric}
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
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		box-sizing: border-box;
	}

	.chart-container svg {
		width: 100%;
		height: calc(100% - var(--legend-height, 0px));
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

	.value-label {
		pointer-events: none;
		font-family: inherit;
	}

	.month-label {
		pointer-events: none;
		font-family: inherit;
	}

	.axis-label {
		pointer-events: none;
		font-family: inherit;
	}

	.legend {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: 16px;
		margin-top: var(--legend-gap);
		padding: 0 20px;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.legend-color {
		width: 12px;
		height: 12px;
		border-radius: 2px;
		flex-shrink: 0;
	}

	.legend-label {
		font-size: 12px;
		color: #666;
		white-space: nowrap;
	}

	.tooltip {
		position: fixed;
		background: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 8px 12px;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 500;
		pointer-events: none;
		z-index: 1000;
		transform: translateX(-50%) translateY(-100%);
		white-space: nowrap;
		font-family: inherit;
		max-width: 200px;
	}

	.tooltip::after {
		content: '';
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		width: 0;
		height: 0;
		border: 4px solid transparent;
		border-top-color: rgba(0, 0, 0, 0.8);
	}
</style>
