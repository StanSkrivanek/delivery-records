<script lang="ts">
	import type { PageData } from './$types';

	let {
		data,
		form = null
	}: {
		data: PageData;
		form?: {
			error?: string;
			intent?: string;
			id?: number;
			values?: Record<string, unknown>;
		} | null;
	} = $props();

	const defaultDate = () => data.filters.startDate || new Date().toISOString().slice(0, 10);

	const defaultValues = () => ({
		entry_date: defaultDate(),
		driver: '',
		vehicle: '',
		start_time: '05:00',
		end_time: '',
		start_odometer: '',
		end_odometer: '',
		total_driving_hours: '',
		total_working_hours: '',
		break_minutes: '0'
	});

	let mode: 'create' | 'update' = $state('create');
	let editingId: number | null = $state(null);
	let formValues = $state(defaultValues());
	let skipAutoCalc = $state(false);

	const toInputString = (value: unknown, fallback = '') =>
		value === undefined || value === null || value === '' ? fallback : String(value);

	const handleEdit = (entry: PageData['entries'][number]) => {
		mode = 'update';
		editingId = entry.id ?? null;

		// Directly set values without triggering auto-calc
		skipAutoCalc = true;

		formValues.entry_date = entry.entry_date;
		formValues.driver = entry.driver;
		formValues.vehicle = entry.vehicle;
		formValues.start_time = entry.start_time;
		formValues.end_time = entry.end_time;
		formValues.start_odometer = toInputString(entry.start_odometer);
		formValues.end_odometer = toInputString(entry.end_odometer);
		formValues.break_minutes = toInputString(entry.break_minutes, '0');
		formValues.total_working_hours = toInputString(entry.total_working_hours);
		formValues.total_driving_hours = toInputString(entry.total_driving_hours);

		// Re-enable auto-calc for future changes
		queueMicrotask(() => {
			skipAutoCalc = false;
		});
	};

	const cancelEdit = () => {
		skipAutoCalc = false;
		mode = 'create';
		editingId = null;
		formValues = defaultValues();
	};

	$effect(() => {
		if (form?.values) {
			formValues = {
				entry_date: toInputString(form.values.entry_date, defaultDate()),
				driver: toInputString(form.values.driver, formValues.driver),
				vehicle: toInputString(form.values.vehicle, formValues.vehicle),
				start_time: toInputString(form.values.start_time, formValues.start_time),
				end_time: toInputString(form.values.end_time, formValues.end_time),
				start_odometer: toInputString(form.values.start_odometer, formValues.start_odometer),
				end_odometer: toInputString(form.values.end_odometer, formValues.end_odometer),
				total_driving_hours: toInputString(
					form.values.total_driving_hours,
					formValues.total_driving_hours
				),
				total_working_hours: toInputString(
					form.values.total_working_hours,
					formValues.total_working_hours
				),
				break_minutes: toInputString(form.values.break_minutes, formValues.break_minutes)
			};

			mode = form.intent === 'update' ? 'update' : 'create';
			editingId = form.intent === 'update' ? (form.id ?? editingId) : editingId;
		}
	});

	const formatHours = (value: number | null | undefined) => Number(value ?? 0).toFixed(2);

	const formatBreak = (minutes: number) => {
		if (!minutes) return '0 min';
		if (minutes < 60) return `${minutes} min`;
		const hours = Math.floor(minutes / 60);
		const rema = minutes % 60;
		if (!rema) {
			return `${hours} hr${hours === 1 ? '' : 's'}`;
		}
		return `${hours} hr${hours === 1 ? '' : 's'} ${rema} min`;
	};

	const formatDistance = (start: number, end: number) => {
		const diff = (end ?? 0) - (start ?? 0);
		return diff > 0 ? diff : 0;
	};

	// Helper to calculate hours between two time strings (HH:MM format)
	const calculateHoursBetweenTimes = (startTime: string, endTime: string): number => {
		if (!startTime || !endTime) return 0;

		const [startHour, startMin] = startTime.split(':').map(Number);
		const [endHour, endMin] = endTime.split(':').map(Number);

		const startTotalMinutes = startHour * 60 + startMin;
		let endTotalMinutes = endHour * 60 + endMin;

		// Handle next-day end time (e.g., start 22:00, end 02:00)
		if (endTotalMinutes < startTotalMinutes) {
			endTotalMinutes += 24 * 60;
		}

		const diffMinutes = endTotalMinutes - startTotalMinutes;
		return diffMinutes / 60;
	};

	// Auto-calculate total working hours from start_time to end_time
	const calculatedWorkingHours = $derived.by(() => {
		if (!formValues.start_time || !formValues.end_time) return '';
		const hours = calculateHoursBetweenTimes(formValues.start_time, formValues.end_time);
		return hours > 0 ? hours.toFixed(2) : '';
	});

	// Auto-calculate driving hours: working hours - 3 depot hours - break time
	const calculatedDrivingHours = $derived.by(() => {
		const workingHours =
			typeof calculatedWorkingHours === 'string'
				? parseFloat(calculatedWorkingHours)
				: calculatedWorkingHours;
		if (!workingHours || isNaN(workingHours) || workingHours <= 0) return '';

		const breakMinutes =
			typeof formValues.break_minutes === 'string'
				? parseFloat(formValues.break_minutes)
				: (formValues.break_minutes ?? 0);
		const breakHours = (breakMinutes || 0) / 60;

		const driving = workingHours - 3 - breakHours;
		return driving > 0 ? driving.toFixed(2) : '0.00';
	});

	// Sync calculated values back to formValues for form submission
	$effect(() => {
		if (!skipAutoCalc && formValues.start_time && formValues.end_time) {
			const newWorking = calculatedWorkingHours;
			const newDriving = calculatedDrivingHours;

			// Only update if values actually changed
			if (formValues.total_working_hours !== newWorking) {
				formValues.total_working_hours = newWorking;
			}
			if (formValues.total_driving_hours !== newDriving) {
				formValues.total_driving_hours = newDriving;
			}
		}
	});
</script>

<svelte:head>
	<title>Driving Log Book</title>
</svelte:head>

<section class="page-header">
	<h1>Driving Log Book</h1>
	<p>Track vehicle usage for revenue reporting with detailed driver logs.</p>
</section>

<section class="summary-grid">
	<div class="summary-card">
		<h3>Total Distance</h3>
		<p class="value">{data.summary.totalDistance.toLocaleString()} km</p>
	</div>
	<div class="summary-card">
		<h3>Total Driving Hours</h3>
		<p class="value">{formatHours(data.summary.totalDrivingHours)} hrs</p>
	</div>
	<div class="summary-card">
		<h3>Total Working Hours</h3>
		<p class="value">{formatHours(data.summary.totalWorkingHours)} hrs</p>
	</div>
	<div class="summary-card">
		<h3>Break Time</h3>
		<p class="value">{formatBreak(data.summary.totalBreakMinutes)}</p>
	</div>
</section>

<section class="filters">
	<h2>Filters</h2>
	<form method="get" class="filters-form">
		<label>
			<span>Start date</span>
			<input type="date" name="startDate" value={data.filters.startDate} />
		</label>
		<label>
			<span>End date</span>
			<input type="date" name="endDate" value={data.filters.endDate} />
		</label>
		<label>
			<span>Driver</span>
			<input type="search" name="driver" list="drivers" value={data.filters.driver} />
		</label>
		<label>
			<span>Vehicle</span>
			<input type="search" name="vehicle" list="vehicles" value={data.filters.vehicle} />
		</label>
		<div class="filters-actions">
			<button type="submit" class="primary">Apply</button>
			<a class="secondary" href="/driving-log">Reset</a>
		</div>
	</form>
	<datalist id="drivers">
		{#each data.drivers as driver (driver.id)}
			<option value={driver.full_name}>{driver.full_name}</option>
		{/each}
		{#each data.existingDrivers as driverOption (driverOption)}
			<option value={driverOption}>{driverOption}</option>
		{/each}
	</datalist>
	<datalist id="vehicles">
		{#each data.vehicles as vehicle (vehicle.id)}
			<option value="{vehicle.make} {vehicle.model} ({vehicle.registration_number})">
				{vehicle.make}
				{vehicle.model} ({vehicle.registration_number})
			</option>
		{/each}
		{#each data.existingVehicles as vehicleOption (vehicleOption)}
			<option value={vehicleOption}>{vehicleOption}</option>
		{/each}
	</datalist>
</section>

<section class="entry-form">
	<div class="form-header">
		<h2>{mode === 'create' ? 'Add New Entry' : 'Edit Entry'}</h2>
		{#if mode === 'update'}
			<button type="button" class="link" onclick={cancelEdit}>Cancel edit</button>
		{/if}
	</div>
	{#if form?.error}
		<p class="form-error">{form.error}</p>
	{/if}
	<form method="post" action={mode === 'create' ? '?/create' : '?/update'} class="grid">
		{#if mode === 'update' && editingId}
			<input type="hidden" name="id" value={editingId} />
		{/if}
		<label>
			<span>Date</span>
			<input type="date" name="entry_date" bind:value={formValues.entry_date} required />
		</label>
		<label>
			<span>Driver</span>
			<select name="driver" bind:value={formValues.driver} required>
				<option value="">-- Select a driver --</option>
				{#each data.drivers as driver (driver.id)}
					<option value={driver.full_name}>{driver.full_name}</option>
				{/each}
			</select>
		</label>
		<label>
			<span>Vehicle</span>
			<select name="vehicle" bind:value={formValues.vehicle} required>
				<option value="">-- Select a vehicle --</option>
				{#each data.vehicles as vehicle (vehicle.id)}
					<option value="{vehicle.make} {vehicle.model} ({vehicle.registration_number})">
						{vehicle.make}
						{vehicle.model} ({vehicle.registration_number})
					</option>
				{/each}
			</select>
		</label>
		<label>
			<span>Start time</span>
			<input type="time" name="start_time" bind:value={formValues.start_time} required />
		</label>
		<label>
			<span>End time</span>
			<input type="time" name="end_time" bind:value={formValues.end_time} required />
		</label>
		<label>
			<span>Start odometer</span>
			<input
				type="number"
				name="start_odometer"
				bind:value={formValues.start_odometer}
				min="0"
				required
			/>
		</label>
		<label>
			<span>End odometer</span>
			<input
				type="number"
				name="end_odometer"
				bind:value={formValues.end_odometer}
				min="0"
				required
			/>
		</label>
		<label>
			<span>Break (minutes)</span>
			<input
				type="number"
				name="break_minutes"
				bind:value={formValues.break_minutes}
				min="0"
				placeholder="0"
			/>
		</label>
		<label>
			<span>Total working hour</span>
			<input
				type="text"
				value={formValues.total_working_hours}
				readonly
				style="background: #f3f4f6; cursor: not-allowed;"
			/>
			<input type="hidden" name="total_working_hours" value={formValues.total_working_hours} />
		</label>
		<label>
			<span>Total driving hours</span>
			<input
				type="text"
				value={formValues.total_driving_hours}
				readonly
				style="background: #f3f4f6; cursor: not-allowed;"
			/>
			<input type="hidden" name="total_driving_hours" value={formValues.total_driving_hours} />
		</label>
		<div class="form-actions">
			<button type="submit" class="primary"
				>{mode === 'create' ? 'Save entry' : 'Update entry'}</button
			>
		</div>
	</form>
</section>

<section class="entries">
	<h2>Driving Log History</h2>
	{#if data.entries.length === 0}
		<p class="empty">No entries match your filters yet.</p>
	{:else}
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Date</th>
						<th>Driver</th>
						<th>Vehicle</th>
						<th>Start</th>
						<th>End</th>
						<th>Distance (km)</th>
						<th>Driving hrs</th>
						<th>Working hrs</th>
						<th>Break</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.entries as entry}
						<tr>
							<td>{entry.entry_date}</td>
							<td>{entry.driver}</td>
							<td>{entry.vehicle}</td>
							<td>
								<span class="time">{entry.start_time}</span>
								<span class="odo">{Number(entry.start_odometer ?? 0).toLocaleString()} km</span>
							</td>
							<td>
								<span class="time">{entry.end_time}</span>
								<span class="odo">{Number(entry.end_odometer ?? 0).toLocaleString()} km</span>
							</td>
							<td>{formatDistance(entry.start_odometer, entry.end_odometer).toLocaleString()}</td>
							<td>{formatHours(entry.total_driving_hours)}</td>
							<td>{formatHours(entry.total_working_hours)}</td>
							<td>{formatBreak(entry.break_minutes)}</td>
							<td class="row-actions">
								<button type="button" class="link" onclick={() => handleEdit(entry)}>Edit</button>
								<form
									method="post"
									action="?/delete"
									class="inline-form"
									onsubmit={(event) => {
										if (!confirm('Delete this entry?')) event.preventDefault();
									}}
								>
									<input type="hidden" name="id" value={entry.id} />
									<button type="submit" class="danger">Delete</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</section>

<style>
	.page-header {
		margin: 2rem 0;
		text-align: center;
	}

	.page-header h1 {
		font-family: 'regular', sans-serif;
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
	}

	.page-header p {
		color: #6b7280;
		margin: 0;
	}

	.summary-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1.5rem;
		margin-bottom: 3rem;
	}

	.summary-card {
		background: white;
		border-radius: 0.5rem;
		padding: 1.5rem;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
		border-left: 8px solid #3c9aff;
	}

	.summary-card h3 {
		margin: 0 0 0.75rem;
		font-size: 1rem;
		text-transform: uppercase;
		letter-spacing: 0.05rem;
		color: #6b7280;
	}

	.summary-card .value {
		margin: 0;
		font-size: 1.75rem;
		font-weight: 700;
		color: #111827;
	}

	.filters {
		margin-bottom: 3rem;
		background: #f9fafb;
		padding: 1.5rem;
		border-radius: 0.5rem;
		border: 1px solid #e5e7eb;
	}

	.filters h2 {
		margin-top: 0;
		font-size: 1.5rem;
	}

	.filters-form {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		align-items: end;
	}

	.filters-form label {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		font-size: 0.9rem;
		color: #4b5563;
	}

	.filters-form input {
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.4rem;
		font-size: 0.95rem;
	}

	.filters-actions {
		display: flex;
		gap: 0.75rem;
	}

	.filters-actions .primary,
	.form-actions .primary {
		background: #3c9aff;
		border: none;
		color: white;
		padding: 0.75rem 1.5rem;
		border-radius: 0.4rem;
		font-weight: 600;
		cursor: pointer;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}

	.filters-actions .primary:hover,
	.form-actions .primary:hover {
		transform: translateY(-1px);
		box-shadow: 0 8px 16px rgba(60, 154, 255, 0.2);
	}

	.filters-actions .secondary,
	.form-header .link,
	.row-actions .link {
		background: transparent;
		border: none;
		color: #3c9aff;
		text-decoration: none;
		padding: 0.75rem 1.5rem;
		border-radius: 0.4rem;
		font-weight: 600;
		cursor: pointer;
	}

	.filters-actions .secondary:hover,
	.form-header .link:hover,
	.row-actions .link:hover {
		text-decoration: underline;
	}

	.entry-form {
		background: white;
		padding: 1.5rem;
		border-radius: 0.5rem;
		border: 1px solid #e5e7eb;
		margin-bottom: 3rem;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
	}

	.form-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.entry-form form.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1rem;
	}

	.entry-form label {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		font-size: 0.9rem;
		color: #374151;
	}

	.entry-form input {
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.4rem;
		font-size: 1rem;
	}

	.form-actions {
		display: flex;
		align-items: center;
	}

	.form-error {
		margin: 0 0 1rem;
		padding: 0.75rem 1rem;
		background: #fee2e2;
		border: 1px solid #fca5a5;
		border-radius: 0.4rem;
		color: #b91c1c;
	}

	.entries h2 {
		font-size: 1.5rem;
		margin-bottom: 1rem;
	}

	.table-wrapper {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		background: white;
		border-radius: 0.5rem;
		overflow: hidden;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
	}

	thead {
		background: #f3f4f6;
	}

	thead th {
		text-align: left;
		padding: 0.75rem 1rem;
		font-weight: 600;
		font-size: 0.9rem;
		text-transform: uppercase;
		color: #4b5563;
	}

	tbody td {
		padding: 0.75rem 1rem;
		border-top: 1px solid #e5e7eb;
		vertical-align: top;
		font-size: 0.95rem;
		color: #1f2937;
	}

	tbody tr:hover {
		background: #f9fafb;
	}

	.time {
		display: block;
		font-weight: 600;
	}

	.odo {
		display: block;
		font-size: 0.85rem;
		color: #6b7280;
	}

	.row-actions {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.inline-form {
		margin: 0;
	}

	.inline-form button.danger {
		background: #f87171;
		border: none;
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 0.4rem;
		font-weight: 600;
		cursor: pointer;
	}

	.inline-form button.danger:hover {
		background: #ef4444;
	}

	.empty {
		margin: 2rem 0;
		text-align: center;
		color: #6b7280;
	}

	@media (max-width: 768px) {
		.summary-grid,
		.entry-form form.grid,
		.filters-form {
			grid-template-columns: 1fr;
		}

		.filters-actions {
			justify-content: flex-start;
		}

		.row-actions {
			flex-direction: column;
			align-items: flex-start;
		}

		.row-actions .link,
		.inline-form button.danger {
			width: 100%;
			text-align: center;
		}
	}
</style>
