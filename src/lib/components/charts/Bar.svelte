<script lang="ts">
	import { onMount } from 'svelte';
	import { Spring } from 'svelte/motion';
	import {dlvPd} from '$lib/utils.js';

	// Type definitions
	type DeliveryDataPoint = {
		date: string; // Format: YYYY-MM-DD
		delivery: number;
		collections: number;
		fails: number;
	};

	type ProcessedDayData = {
		date: string;
		day: number;
		delivery: number;
		collections: number;
		fails: number;
	};

	type MetricInfo = {
		key: 'delivery' | 'collections' | 'fails';
		name: string;
		color: string;
	};

	let {
		// Sample data - replace with your actual data
		apiData = [
			{ date: '2025-01-01', delivery: 120, collections: 45, fails: 8 },
			{ date: '2025-01-02', delivery: 135, collections: 52, fails: 12 },
			{ date: '2025-01-03', delivery: 98, collections: 38, fails: 5 },
			{ date: '2025-01-05', delivery: 156, collections: 61, fails: 15 },
			{ date: '2025-01-07', delivery: 89, collections: 29, fails: 3 },
			{ date: '2025-01-08', delivery: 142, collections: 55, fails: 9 },
			{ date: '2025-01-10', delivery: 167, collections: 68, fails: 18 },
			{ date: '2025-01-12', delivery: 134, collections: 48, fails: 11 },
			{ date: '2025-01-15', delivery: 178, collections: 72, fails: 22 },
			{ date: '2025-01-18', delivery: 145, collections: 58, fails: 14 },
			{ date: '2025-01-20', delivery: 159, collections: 63, fails: 16 },
			{ date: '2025-01-22', delivery: 123, collections: 41, fails: 7 },
			{ date: '2025-01-25', delivery: 188, collections: 78, fails: 25 },
			{ date: '2025-01-28', delivery: 156, collections: 65, fails: 19 },
			{ date: '2025-01-30', delivery: 142, collections: 54, fails: 13 }
		] as DeliveryDataPoint[],
		
		// Target month (format: YYYY-MM) - defaults to current month
		targetMonth = new Date().toISOString().slice(0, 7) as string,
		
		// Color mapping for metrics
		metricColors = {
			delivery: '#10b981', // Green
			collections: '#3b82f6', // Blue  
			fails: '#ef4444' // Red
		} as { [key: string]: string },
		
		width = '100%' as number | string,
		height = 400 as number | string,
		padding = 60,
		showTooltip = true,
		animate = true,
		groupSpacing = 4,
		barSpacing = 2,
		showLegend = true,
		showValues = false,
		legendGap = 10
	} = $props();

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
				return containerWidth; // Use container width for percentage
			}
			const parsed = parseFloat(value);
			return isNaN(parsed) ? 800 : parsed;
		}
		
		return 800;
	};

	// Get actual dimensions
	const actualWidth = $derived((() => {
		if (typeof width === 'string' && (width.includes('%') || width === '100%')) {
			return containerWidth;
		}
		return getNumericValue(width);
	})());

	const actualHeight = $derived((() => {
		if (typeof height === 'string' && (height.includes('%') || height === '100%')) {
			return containerHeight;
		}
		return getNumericValue(height);
	})());

	// Metrics configuration
	const metrics = $derived(
		(() => {
			const metricList: MetricInfo[] = [
				{ key: 'delivery', name: 'Deliveries', color: metricColors.delivery },
				{ key: 'collections', name: 'Collections', color: metricColors.collections },
				{ key: 'fails', name: 'Fails', color: metricColors.fails }
			];
			return metricList;
		})()
	);

	// Generate all dates for the target month
	const allDatesInMonth = $derived(
		(() => {
			const year = parseInt(targetMonth.split('-')[0]);
			const month = parseInt(targetMonth.split('-')[1]);
			const daysInMonth = new Date(year, month, 0).getDate();
			
			const dates: string[] = [];
			for (let day = 1; day <= daysInMonth; day++) {
				const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
				dates.push(dateStr);
			}
			return dates;
		})()
	);

	// Process data to include all dates with zero values for missing dates
	const processedData = $derived(
		(() => {
			const dataMap = new Map<string, DeliveryDataPoint>();
			
			// Create map from existing data
			apiData.forEach((item) => {
				if (item.date.startsWith(targetMonth)) {
					dataMap.set(item.date, item);
				}
			});

			// Generate complete dataset with all dates
			return allDatesInMonth.map((date) => {
				const existing = dataMap.get(date);
				const day = parseInt(date.split('-')[2]);
				
				return {
					date,
					day,
					delivery: existing?.delivery || 0,
					collections: existing?.collections || 0,
					fails: existing?.fails || 0
				} as ProcessedDayData;
			});
		})()
	);

	// Calculate dimensions
	const legendHeight = showLegend ? 40 : 0;
	const chartWidth = $derived(actualWidth - padding * 2);
	const chartHeight = $derived(actualHeight - padding * 2 - legendHeight);

	// Calculate bar dimensions
	const groupWidth = $derived(
		(chartWidth - (processedData.length - 1) * groupSpacing) / processedData.length
	);
	const barWidth = $derived(
		Math.max(1, (groupWidth - (metrics.length - 1) * barSpacing) / metrics.length)
	);

	// Find max value for scaling
	const maxValue = $derived(
		(() => {
			let max = 0;
			processedData.forEach((dayData) => {
				metrics.forEach((metric) => {
					const value = dayData[metric.key];
					if (value > max) max = value;
				});
			});
			return max || 100; // Fallback to 100 if no data
		})()
	);

	// Create Spring instances for each bar
	const animatedHeights = $derived(
		processedData.map(() =>
			metrics.map(() => new Spring(0, { stiffness: 0.15, damping: 0.8 }))
		)
	);

	// Calculate bar heights
	const barHeights = $derived(
		processedData.map((dayData) =>
			metrics.map((metric) => {
				const value = dayData[metric.key];
				return (value / maxValue) * chartHeight;
			})
		)
	);

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

	// Animate bars when mounted
	$effect(() => {
		if (mounted && animate) {
			barHeights.forEach((dayHeights, dayIndex) => {
				dayHeights.forEach((height, metricIndex) => {
					setTimeout(
						() => {
							animatedHeights[dayIndex][metricIndex].target = height;
						},
						(dayIndex * metrics.length + metricIndex) * 20
					);
				});
			});
		} else if (mounted) {
			barHeights.forEach((dayHeights, dayIndex) => {
				dayHeights.forEach((height, metricIndex) => {
					animatedHeights[dayIndex][metricIndex].target = height;
				});
			});
		}
	});

	function handleMouseEnter(event: MouseEvent, dayIndex: number, metricIndex: number) {
		if (!showTooltip) return;

		hoveredBar = { dayIndex, metricIndex };
		const rect = (event.target as HTMLElement).getBoundingClientRect();

		const dayData = processedData[dayIndex];
		const metric = metrics[metricIndex];
		const value = dayData[metric.key];

		tooltip.visible = true;
		tooltip.x = rect.left + rect.width / 2;
		tooltip.y = rect.top - 10;
		tooltip.content = `${metric.name} on ${dayData.day}${getOrdinalSuffix(dayData.day)}: ${value}`;
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

	function getOrdinalSuffix(day: number): string {
		if (day >= 11 && day <= 13) return 'th';
		const lastDigit = day % 10;
		switch (lastDigit) {
			case 1: return 'st';
			case 2: return 'nd';
			case 3: return 'rd';
			default: return 'th';
		}
	}

	// Format month name for display
	const monthName = $derived(
		(() => {
			const date = new Date(targetMonth + '-01');
			return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
		})()
	);
</script>

<div
	bind:this={containerElement}
	class="chart-container"
	style="width: {formatDimension(width)}; height: {formatDimension(height)}; --legend-gap: {legendGap}px; --legend-height: {legendHeight}px;"
>
	<!-- Chart Title -->
	<div class="chart-title">
		<h3>Daily Delivery Statistics - {monthName}</h3>
	</div>

	<svg width="100%" height="calc(100% - 40px)" viewBox="0 0 {actualWidth} {actualHeight - legendHeight - 40}">
		<!-- Chart bars -->
		{#each processedData as dayData, dayIndex}
			{@const groupX = padding + dayIndex * (groupWidth + groupSpacing)}

			{#each metrics as metric, metricIndex}
				{@const value = dayData[metric.key]}
				{@const x = groupX + metricIndex * (barWidth + barSpacing)}
				{@const barHeight = animate
					? animatedHeights[dayIndex][metricIndex].current
					: barHeights[dayIndex][metricIndex]}
				{@const y = padding + chartHeight - barHeight}
				{@const isHovered =
					hoveredBar.dayIndex === dayIndex && hoveredBar.metricIndex === metricIndex}

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
					aria-label="{metric.name} {dayData.day}: {value}"
					onmouseenter={(e) => handleMouseEnter(e, dayIndex, metricIndex)}
					onmouseleave={handleMouseLeave}
					onmousemove={handleMouseMove}
				/>

				<!-- Value labels on top of bars -->
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
						{value}
					</text>
				{/if}
			{/each}

			<!-- Day labels at bottom - show every 2nd, 5th, or 10th day based on width -->
			{@const shouldShowLabel = groupWidth > 30 || dayData.day % (groupWidth > 15 ? 2 : groupWidth > 8 ? 5 : 10) === 1}
			{#if shouldShowLabel}
				<text
					x={groupX + groupWidth / 2}
					y={padding + chartHeight + 16}
					text-anchor="middle"
					class="day-label"
					fill="#666"
					font-size="10"
					font-weight="500"
				>
					{dayData.day}
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
				{value}
			</text>
		{/each}

		<!-- Y-axis line -->
		<line
			x1={padding}
			y1={padding}
			x2={padding}
			y2={padding + chartHeight}
			stroke="#d1d5db"
			stroke-width="1"
		/>

		<!-- X-axis line -->
		<line
			x1={padding}
			y1={padding + chartHeight}
			x2={padding + chartWidth}
			y2={padding + chartHeight}
			stroke="#d1d5db"
			stroke-width="1"
		/>

		<!-- X-axis label -->
		<text
			x={padding + chartWidth / 2}
			y={padding + chartHeight + 35}
			text-anchor="middle"
			class="axis-title"
			fill="#4b5563"
			font-size="12"
			font-weight="500"
		>
			Day of Month
		</text>

		<!-- Y-axis label -->
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
			Count
		</text>
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
		background: #fefefe;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 16px;
	}

	.chart-title {
		text-align: center;
		margin-bottom: 8px;
	}

	.chart-title h3 {
		margin: 0;
		font-size: 16px;
		font-weight: 600;
		color: #1f2937;
	}

	.chart-container svg {
		width: 100%;
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

	.day-label {
		pointer-events: none;
		font-family: inherit;
	}

	.axis-label {
		pointer-events: none;
		font-family: inherit;
	}

	.axis-title {
		pointer-events: none;
		font-family: inherit;
	}

	.legend {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: 20px;
		margin-top: var(--legend-gap);
		padding: 12px 20px;
		background: #f9fafb;
		border-radius: 6px;
		border: 1px solid #e5e7eb;
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