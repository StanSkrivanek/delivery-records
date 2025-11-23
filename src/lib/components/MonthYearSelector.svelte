<script lang="ts">
	type DatedRecord = {
		entry_date?: string | null;
		created_at?: string | null;
	};

	type MonthOption = {
		value: number;
		label: string;
	};

	type MonthYearSelectorProps = {
		year: number;
		month: number;
		records?: DatedRecord[];
		availableYears?: number[];
		fallbackMonths?: number[];
		onSelectionChange?: (selection: { year: number; month: number }) => void;
		disabled?: boolean;
		showLabels?: boolean;
		yearLabel?: string;
		monthLabel?: string;
		containerClass?: string;
		monthOptions?: MonthOption[];
	};

	const DEFAULT_MONTH_OPTIONS: MonthOption[] = [
		{ value: 1, label: 'January' },
		{ value: 2, label: 'February' },
		{ value: 3, label: 'March' },
		{ value: 4, label: 'April' },
		{ value: 5, label: 'May' },
		{ value: 6, label: 'June' },
		{ value: 7, label: 'July' },
		{ value: 8, label: 'August' },
		{ value: 9, label: 'September' },
		{ value: 10, label: 'October' },
		{ value: 11, label: 'November' },
		{ value: 12, label: 'December' }
	];

	let {
		year = $bindable<number>(),
		month = $bindable<number>(),
		records = [],
		availableYears = [],
		fallbackMonths = [],
		onSelectionChange,
		disabled = false,
		showLabels = false,
		yearLabel = 'Year',
		monthLabel = 'Month',
		containerClass = '',
		monthOptions = DEFAULT_MONTH_OPTIONS
	}: MonthYearSelectorProps = $props();

	const fallbackMonthValues = $derived.by(() => {
		if (fallbackMonths.length > 0) {
			const unique = Array.from(new Set(fallbackMonths));
			return unique.sort((a, b) => a - b);
		}
		return monthOptions.map((option) => option.value);
	});

	const yearChoices = $derived.by(() => {
		if (availableYears.length > 0) {
			return availableYears;
		}
		const years = new Set<number>();
		records.forEach((record) => {
			const dateString = record.entry_date ?? record.created_at;
			if (!dateString) {
				return;
			}
			const parsed = new Date(dateString);
			if (Number.isNaN(parsed.getTime())) {
				return;
			}
			years.add(parsed.getFullYear());
		});
		return Array.from(years).sort((a, b) => b - a);
	});

	const monthsByYear = $derived.by(() => {
		const map = new Map<number, Set<number>>();
		records.forEach((record) => {
			const dateString = record.entry_date ?? record.created_at;
			if (!dateString) {
				return;
			}
			const parsed = new Date(dateString);
			if (Number.isNaN(parsed.getTime())) {
				return;
			}
			const recordYear = parsed.getFullYear();
			const recordMonth = parsed.getMonth() + 1;
			if (!map.has(recordYear)) {
				map.set(recordYear, new Set());
			}
			map.get(recordYear)!.add(recordMonth);
		});

		const normalized = new Map<number, number[]>();
		const fallback = fallbackMonthValues;
		const yearsToInclude =
			yearChoices.length > 0 ? yearChoices : Array.from(map.keys()).sort((a, b) => b - a);

		yearsToInclude.forEach((currentYear) => {
			const set = map.get(currentYear);
			if (!set || set.size === 0) {
				normalized.set(currentYear, fallback);
				return;
			}
			normalized.set(
				currentYear,
				Array.from(set).sort((a, b) => a - b)
			);
		});

		return normalized;
	});

	const monthChoices = $derived.by(() => {
		const months = monthsByYear.get(year) ?? fallbackMonthValues;
		return monthOptions.filter((option) => months.includes(option.value));
	});

	const baseId = crypto.randomUUID?.() ?? `month-year-${Math.random().toString(36).slice(2, 9)}`;
	const yearSelectId = `${baseId}-year`;
	const monthSelectId = `${baseId}-month`;

	function onYearChange(event: Event) {
		const select = event.currentTarget as HTMLSelectElement;
		const nextYear = Number(select.value);
		if (Number.isNaN(nextYear) || nextYear === year) {
			return;
		}
		year = nextYear;
		const months = monthsByYear.get(year) ?? fallbackMonthValues;
		if (months.length > 0 && !months.includes(month)) {
			month = months[0];
		}
		onSelectionChange?.({ year, month });
	}

	function onMonthChange(event: Event) {
		const select = event.currentTarget as HTMLSelectElement;
		const nextMonth = Number(select.value);
		if (Number.isNaN(nextMonth) || nextMonth === month) {
			return;
		}
		month = nextMonth;
		onSelectionChange?.({ year, month });
	}

	$effect(() => {
		const months = monthsByYear.get(year) ?? fallbackMonthValues;
		if (months.length > 0 && !months.includes(month)) {
			month = months[0];
		}
	});
</script>

<div class={`month-year-selector ${containerClass}`}>
	<div class="selector-group">
		{#if showLabels}
			<label for={yearSelectId}>{yearLabel}</label>
		{/if}
		<select
			id={yearSelectId}
			onchange={onYearChange}
			disabled={disabled || yearChoices.length === 0}
			aria-label={yearLabel}
		>
			{#each yearChoices as option}
				<option value={option} selected={option === year}>{option}</option>
			{/each}
		</select>
	</div>
	<div class="selector-group">
		{#if showLabels}
			<label for={monthSelectId}>{monthLabel}</label>
		{/if}
		<select
			id={monthSelectId}
			onchange={onMonthChange}
			disabled={disabled || monthChoices.length === 0}
			aria-label={monthLabel}
		>
			{#each monthChoices as option}
				<option value={option.value} selected={option.value === month}>{option.label}</option>
			{/each}
		</select>
	</div>
</div>

<style>
	.month-year-selector {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
	}

	.selector-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.selector-group label {
		font-size: 0.875rem;
		font-weight: 600;
		color: #4b5563;
	}

	.selector-group select {
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		border: 1px solid #d1d5db;
		background: #fff;
		color: #111827;
		font-size: 1rem;
		min-width: 160px;
	}

	.selector-group select:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
