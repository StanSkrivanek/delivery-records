<script lang="ts">
	import type { Driver, Vehicle } from '$lib/types';
	import type { PageData } from './$types';

	let {
		data,
		form
	}: {
		data: PageData;
		form:
			| {
					error?: string;
					success?: boolean;
					message?: string;
			  }
			| null
			| undefined;
	} = $props();

	let activeTab: 'drivers' | 'vehicles' = $state('drivers');
	let showDriverForm = $state(false);
	let showVehicleForm = $state(false);
	let editingDriver: Driver | null = $state(null);
	let editingVehicle: Vehicle | null = $state(null);
	let showAssignModal = $state(false);
	let selectedDriverForAssign: (typeof data.drivers)[number] | null = $state(null);
	let sidebarCollapsed = $state(false);

	const resetDriverForm = () => {
		showDriverForm = false;
		editingDriver = null;
	};

	const resetVehicleForm = () => {
		showVehicleForm = false;
		editingVehicle = null;
	};

	const handleEditDriver = (driver: (typeof data.drivers)[number]) => {
		editingDriver = driver;
		showDriverForm = true;
	};

	const handleEditVehicle = (vehicle: Vehicle) => {
		editingVehicle = vehicle;
		showVehicleForm = true;
	};

	const handleAssignVehicle = (driver: (typeof data.drivers)[number]) => {
		selectedDriverForAssign = driver;
		showAssignModal = true;
	};

	const getAvailableVehiclesForDriver = (driver: (typeof data.drivers)[number]): Vehicle[] => {
		const assignedIds = new Set(driver.assignedVehicles.map((v) => v.id));
		return data.vehicles.filter((v) => !assignedIds.has(v.id));
	};

	$effect(() => {
		if (form?.success) {
			resetDriverForm();
			resetVehicleForm();
			showAssignModal = false;
		}
	});
</script>

<div class="settings-layout">
	<!-- Sidebar -->
	<aside class="sidebar" class:collapsed={sidebarCollapsed}>
		<div class="sidebar-header">
			{#if !sidebarCollapsed}
				<h2>Settings</h2>
			{/if}
			<button class="toggle-btn" onclick={() => (sidebarCollapsed = !sidebarCollapsed)}>
				{#if sidebarCollapsed}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="m9 18 6-6-6-6" />
					</svg>
				{:else}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="m15 18-6-6 6-6" />
					</svg>
				{/if}
			</button>
		</div>

		<nav class="sidebar-nav">
			<button
				class="nav-item"
				class:active={activeTab === 'drivers'}
				onclick={() => (activeTab = 'drivers')}
			>
				<svg
					class="nav-icon"
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
					<circle cx="9" cy="7" r="4" />
					<path d="M22 21v-2a4 4 0 0 0-3-3.87" />
					<path d="M16 3.13a4 4 0 0 1 0 7.75" />
				</svg>
				{#if !sidebarCollapsed}
					<span class="nav-label">Drivers</span>
					<span class="nav-badge">{data.drivers.length}</span>
				{/if}
			</button>

			<button
				class="nav-item"
				class:active={activeTab === 'vehicles'}
				onclick={() => (activeTab = 'vehicles')}
			>
				<svg
					class="nav-icon"
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path
						d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"
					/>
					<circle cx="6.5" cy="16.5" r="2.5" />
					<circle cx="16.5" cy="16.5" r="2.5" />
				</svg>
				{#if !sidebarCollapsed}
					<span class="nav-label">Vehicles</span>
					<span class="nav-badge">{data.vehicles.length}</span>
				{/if}
			</button>
		</nav>
	</aside>

	<!-- Main Content -->
	<main class="main-content">
		<div class="content-header">
			<h1>{activeTab === 'drivers' ? 'Drivers Management' : 'Vehicles Management'}</h1>
		</div>

		{#if form?.error}
			<div class="error-message">{form.error}</div>
		{/if}

		{#if form?.success && form?.message}
			<div class="success-message">{form.message}</div>
		{/if}

		{#if activeTab === 'drivers'}
			<div class="section">
				<div class="section-header">
					<h2>Drivers</h2>
					<button class="btn-primary" onclick={() => (showDriverForm = !showDriverForm)}>
						{showDriverForm ? 'Cancel' : 'Add Driver'}
					</button>
				</div>

				{#if showDriverForm}
					<form
						method="POST"
						action="?/{editingDriver ? 'updateDriver' : 'createDriver'}"
						class="form-card"
						enctype="multipart/form-data"
					>
						{#if editingDriver}
							<input type="hidden" name="id" value={editingDriver.id} />
						{/if}

						<div class="form-row">
							<div class="form-group">
								<label for="full_name">Full Name *</label>
								<input
									type="text"
									id="full_name"
									name="full_name"
									value={editingDriver?.full_name || ''}
									required
								/>
							</div>

							<div class="form-group">
								<label for="date_of_birth">Date of Birth *</label>
								<input
									type="date"
									id="date_of_birth"
									name="date_of_birth"
									value={editingDriver?.date_of_birth || ''}
									required
								/>
							</div>
						</div>

						<div class="form-group">
							<label for="address">Address *</label>
							<textarea id="address" name="address" required rows="3"
								>{editingDriver?.address || ''}</textarea
							>
						</div>

						<div class="form-row">
							<div class="form-group">
								<label for="driver_license_number">Driver License Number *</label>
								<input
									type="text"
									id="driver_license_number"
									name="driver_license_number"
									value={editingDriver?.driver_license_number || ''}
									required
								/>
							</div>

							<div class="form-group">
								<label for="email">Email</label>
								<input type="email" id="email" name="email" value={editingDriver?.email || ''} />
							</div>
						</div>

						<div class="form-row">
							<div class="form-group">
								<label for="phone">Phone</label>
								<input type="tel" id="phone" name="phone" value={editingDriver?.phone || ''} />
							</div>

							<div class="form-group">
								<label for="license_image">Driver License Image</label>
								<input type="file" id="license_image" name="license_image" accept="image/*" />
								{#if editingDriver?.driver_license_image_path}
									<div class="current-image">
										<img
											src="/{editingDriver.driver_license_image_path}"
											alt="Current license"
											class="thumbnail"
										/>
										<label>
											<input type="checkbox" name="remove_image" value="true" />
											Remove current image
										</label>
									</div>
								{/if}
							</div>
						</div>

						<div class="form-actions">
							<button type="submit" class="btn-primary">
								{editingDriver ? 'Update Driver' : 'Create Driver'}
							</button>
							<button type="button" class="btn-secondary" onclick={resetDriverForm}>
								Cancel
							</button>
						</div>
					</form>
				{/if}

				<div class="cards-grid">
					{#each data.drivers as driver (driver.id)}
						<div class="card">
							<div class="card-header">
								<h3>{driver.full_name}</h3>
								<div class="card-actions">
									<button class="btn-icon" onclick={() => handleEditDriver(driver)}>✏️</button>
									<form method="POST" action="?/deleteDriver" style="display: inline;">
										<input type="hidden" name="id" value={driver.id} />
										<button
											type="submit"
											class="btn-icon btn-danger"
											onclick={(e) => {
												if (!confirm('Are you sure you want to delete this driver?')) {
													e.preventDefault();
												}
											}}
										>
											🗑️
										</button>
									</form>
								</div>
							</div>

							<div class="card-content">
								<p><strong>License:</strong> {driver.driver_license_number}</p>
								<p><strong>DOB:</strong> {driver.date_of_birth}</p>
								<p><strong>Address:</strong> {driver.address}</p>
								{#if driver.email}
									<p><strong>Email:</strong> {driver.email}</p>
								{/if}
								{#if driver.phone}
									<p><strong>Phone:</strong> {driver.phone}</p>
								{/if}
								{#if driver.driver_license_image_path}
									<div class="license-preview">
										<img
											src="/{driver.driver_license_image_path}"
											alt="Driver license"
											class="thumbnail"
										/>
									</div>
								{/if}

								<div class="assigned-vehicles">
									<strong>Assigned Vehicles:</strong>
									{#if driver.assignedVehicles.length > 0}
										<ul>
											{#each driver.assignedVehicles as vehicle (vehicle.id)}
												<li>
													{vehicle.make}
													{vehicle.model} ({vehicle.registration_number})
													<form method="POST" action="?/unassignVehicle" style="display: inline;">
														<input type="hidden" name="driver_id" value={driver.id} />
														<input type="hidden" name="vehicle_id" value={vehicle.id} />
														<button type="submit" class="btn-icon-small">❌</button>
													</form>
												</li>
											{/each}
										</ul>
									{:else}
										<p>No vehicles assigned</p>
									{/if}
									<button class="btn-small" onclick={() => handleAssignVehicle(driver)}>
										Assign Vehicle
									</button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<div class="section">
				<div class="section-header">
					<h2>Vehicles</h2>
					<button class="btn-primary" onclick={() => (showVehicleForm = !showVehicleForm)}>
						{showVehicleForm ? 'Cancel' : 'Add Vehicle'}
					</button>
				</div>

				{#if showVehicleForm}
					<form
						method="POST"
						action="?/{editingVehicle ? 'updateVehicle' : 'createVehicle'}"
						class="form-card"
					>
						{#if editingVehicle}
							<input type="hidden" name="id" value={editingVehicle.id} />
						{/if}

						<div class="form-row">
							<div class="form-group">
								<label for="make">Make *</label>
								<input
									type="text"
									id="make"
									name="make"
									value={editingVehicle?.make || ''}
									required
								/>
							</div>

							<div class="form-group">
								<label for="model">Model *</label>
								<input
									type="text"
									id="model"
									name="model"
									value={editingVehicle?.model || ''}
									required
								/>
							</div>

							<div class="form-group">
								<label for="type">Type *</label>
								<input
									type="text"
									id="type"
									name="type"
									value={editingVehicle?.type || ''}
									placeholder="e.g., Van, Truck"
									required
								/>
							</div>
						</div>

						<div class="form-row">
							<div class="form-group">
								<label for="registration_number">Registration Number *</label>
								<input
									type="text"
									id="registration_number"
									name="registration_number"
									value={editingVehicle?.registration_number || ''}
									required
								/>
							</div>

							<div class="form-group">
								<label for="color">Color *</label>
								<input
									type="text"
									id="color"
									name="color"
									value={editingVehicle?.color || ''}
									required
								/>
							</div>

							<div class="form-group">
								<label for="year">Year</label>
								<input
									type="number"
									id="year"
									name="year"
									value={editingVehicle?.year || ''}
									min="1900"
									max="2100"
								/>
							</div>
						</div>

						<div class="form-row">
							<div class="form-group">
								<label for="initial_mileage">Initial Mileage *</label>
								<input
									type="number"
									id="initial_mileage"
									name="initial_mileage"
									value={editingVehicle?.initial_mileage || 0}
									min="0"
									required
								/>
							</div>

							<div class="form-group">
								<label for="current_mileage">Current Mileage *</label>
								<input
									type="number"
									id="current_mileage"
									name="current_mileage"
									value={editingVehicle?.current_mileage || 0}
									min="0"
									required
								/>
							</div>

							<div class="form-group">
								<label for="vin">VIN</label>
								<input type="text" id="vin" name="vin" value={editingVehicle?.vin || ''} />
							</div>
						</div>

						<div class="form-actions">
							<button type="submit" class="btn-primary">
								{editingVehicle ? 'Update Vehicle' : 'Create Vehicle'}
							</button>
							<button type="button" class="btn-secondary" onclick={resetVehicleForm}>
								Cancel
							</button>
						</div>
					</form>
				{/if}

				<div class="cards-grid">
					{#each data.vehicles as vehicle (vehicle.id)}
						<div class="card">
							<div class="card-header">
								<h3>{vehicle.make} {vehicle.model}</h3>
								<div class="card-actions">
									<button class="btn-icon" onclick={() => handleEditVehicle(vehicle)}>✏️</button>
									<form method="POST" action="?/deleteVehicle" style="display: inline;">
										<input type="hidden" name="id" value={vehicle.id} />
										<button
											type="submit"
											class="btn-icon btn-danger"
											onclick={(e) => {
												if (!confirm('Are you sure you want to delete this vehicle?')) {
													e.preventDefault();
												}
											}}
										>
											🗑️
										</button>
									</form>
								</div>
							</div>

							<div class="card-content">
								<p><strong>Type:</strong> {vehicle.type}</p>
								<p><strong>Registration:</strong> {vehicle.registration_number}</p>
								<p><strong>Color:</strong> {vehicle.color}</p>
								{#if vehicle.year}
									<p><strong>Year:</strong> {vehicle.year}</p>
								{/if}
								<p>
									<strong>Initial Mileage:</strong>
									{vehicle.initial_mileage.toLocaleString()} km
								</p>
								<p>
									<strong>Current Mileage:</strong>
									{vehicle.current_mileage.toLocaleString()} km
								</p>
								{#if vehicle.vin}
									<p><strong>VIN:</strong> {vehicle.vin}</p>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</main>
</div>

{#if showAssignModal && selectedDriverForAssign}
	<div
		class="modal-overlay"
		role="button"
		tabindex="0"
		onclick={() => (showAssignModal = false)}
		onkeydown={(e) => e.key === 'Escape' && (showAssignModal = false)}
	>
		<div
			class="modal"
			role="dialog"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<div class="modal-header">
				<h3>Assign Vehicle to {selectedDriverForAssign.full_name}</h3>
				<button class="btn-close" onclick={() => (showAssignModal = false)}>×</button>
			</div>

			<div class="modal-content">
				{#if getAvailableVehiclesForDriver(selectedDriverForAssign).length > 0}
					<form method="POST" action="?/assignVehicle">
						<input type="hidden" name="driver_id" value={selectedDriverForAssign.id} />

						<div class="form-group">
							<label for="vehicle_id">Select Vehicle</label>
							<select id="vehicle_id" name="vehicle_id" required>
								<option value="">-- Select a vehicle --</option>
								{#each getAvailableVehiclesForDriver(selectedDriverForAssign) as vehicle (vehicle.id)}
									<option value={vehicle.id}>
										{vehicle.make}
										{vehicle.model} ({vehicle.registration_number})
									</option>
								{/each}
							</select>
						</div>

						<div class="modal-actions">
							<button type="submit" class="btn-primary">Assign</button>
							<button type="button" class="btn-secondary" onclick={() => (showAssignModal = false)}>
								Cancel
							</button>
						</div>
					</form>
				{:else}
					<p>All vehicles are already assigned to this driver.</p>
					<div class="modal-actions">
						<button type="button" class="btn-secondary" onclick={() => (showAssignModal = false)}>
							Close
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.settings-layout {
		display: flex;
		min-height: 100vh;
		background: #f9fafb;
	}

	/* Sidebar Styles */
	.sidebar {
		width: 280px;
		background: white;
		border-right: 1px solid #e5e7eb;
		display: flex;
		flex-direction: column;
		transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: sticky;
		top: 0;
		height: 100vh;
		overflow: hidden;
	}

	.sidebar.collapsed {
		width: 64px;
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem 1rem;
		border-bottom: 1px solid #e5e7eb;
		min-height: 72px;
	}

	.sidebar-header h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
		white-space: nowrap;
	}

	.toggle-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: none;
		background: #f3f4f6;
		border-radius: 0.375rem;
		cursor: pointer;
		color: #6b7280;
		transition: all 0.2s;
		flex-shrink: 0;
	}

	.toggle-btn:hover {
		background: #e5e7eb;
		color: #111827;
	}

	.sidebar-nav {
		display: flex;
		flex-direction: column;
		padding: 1rem 0.5rem;
		gap: 0.25rem;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border: none;
		background: transparent;
		border-radius: 0.5rem;
		cursor: pointer;
		color: #4b5563;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.2s;
		text-align: left;
		white-space: nowrap;
		width: 100%;
	}

	.sidebar.collapsed .nav-item {
		justify-content: center;
		padding: 0.75rem;
	}

	.nav-item:hover {
		background: #f3f4f6;
		color: #111827;
	}

	.nav-item.active {
		background: #eff6ff;
		color: #2563eb;
	}

	.nav-icon {
		flex-shrink: 0;
	}

	.nav-label {
		flex: 1;
	}

	.sidebar.collapsed .nav-label,
	.sidebar.collapsed .nav-badge {
		display: none;
	}

	.nav-badge {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 20px;
		height: 20px;
		padding: 0 0.375rem;
		background: #e5e7eb;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		color: #374151;
	}

	.nav-item.active .nav-badge {
		background: #dbeafe;
		color: #2563eb;
	}

	/* Main Content Styles */
	.main-content {
		flex: 1;
		padding: 2rem;
		overflow-y: auto;
	}

	.content-header {
		margin-bottom: 2rem;
	}

	.content-header h1 {
		font-size: 1.875rem;
		font-weight: 700;
		color: #111827;
		margin: 0;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	h2 {
		color: #374151;
		margin: 0;
	}

	.form-card {
		background: #f9fafb;
		padding: 2rem;
		border-radius: 0.5rem;
		margin-bottom: 2rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.form-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	label {
		font-weight: 500;
		color: #374151;
		font-size: 0.875rem;
	}

	input,
	textarea,
	select {
		padding: 0.625rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 1rem;
		transition: border-color 0.2s;
	}

	input:focus,
	textarea:focus,
	select:focus {
		outline: none;
		border-color: #2563eb;
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
	}

	.current-image {
		margin-top: 0.5rem;
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.thumbnail {
		max-width: 100px;
		max-height: 100px;
		border-radius: 0.375rem;
		object-fit: cover;
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: 1.5rem;
	}

	.card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		overflow: hidden;
		transition: box-shadow 0.2s;
	}

	.card:hover {
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.card-header {
		background: #f9fafb;
		padding: 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid #e5e7eb;
	}

	.card-header h3 {
		margin: 0;
		color: #1f2937;
		font-size: 1.125rem;
	}

	.card-actions {
		display: flex;
		gap: 0.5rem;
	}

	.card-content {
		padding: 1rem;
	}

	.card-content p {
		margin: 0.5rem 0;
		color: #4b5563;
	}

	.license-preview {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #e5e7eb;
	}

	.assigned-vehicles {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #e5e7eb;
	}

	.assigned-vehicles ul {
		list-style: none;
		padding: 0;
		margin: 0.5rem 0;
	}

	.assigned-vehicles li {
		padding: 0.5rem;
		background: #f3f4f6;
		border-radius: 0.25rem;
		margin: 0.25rem 0;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.btn-primary {
		background: #2563eb;
		color: white;
		padding: 0.625rem 1.25rem;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-primary:hover {
		background: #1d4ed8;
	}

	.btn-secondary {
		background: #6b7280;
		color: white;
		padding: 0.625rem 1.25rem;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-secondary:hover {
		background: #4b5563;
	}

	.btn-small {
		background: #3b82f6;
		color: white;
		padding: 0.375rem 0.75rem;
		border: none;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		cursor: pointer;
		margin-top: 0.5rem;
	}

	.btn-small:hover {
		background: #2563eb;
	}

	.btn-icon {
		background: none;
		border: none;
		font-size: 1.125rem;
		cursor: pointer;
		padding: 0.25rem;
		transition: transform 0.2s;
	}

	.btn-icon:hover {
		transform: scale(1.2);
	}

	.btn-icon-small {
		background: none;
		border: none;
		font-size: 0.875rem;
		cursor: pointer;
		padding: 0;
		margin-left: 0.5rem;
	}

	.btn-danger:hover {
		filter: brightness(1.2);
	}

	.error-message {
		background: #fef2f2;
		color: #991b1b;
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
		border-left: 4px solid #dc2626;
	}

	.success-message {
		background: #f0fdf4;
		color: #166534;
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
		border-left: 4px solid #16a34a;
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal {
		background: white;
		border-radius: 0.5rem;
		max-width: 500px;
		width: 90%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.modal-header h3 {
		margin: 0;
		color: #1f2937;
	}

	.btn-close {
		background: none;
		border: none;
		font-size: 2rem;
		line-height: 1;
		cursor: pointer;
		color: #6b7280;
		padding: 0;
		width: 2rem;
		height: 2rem;
	}

	.btn-close:hover {
		color: #1f2937;
	}

	.modal-content {
		padding: 1.5rem;
	}

	.modal-actions {
		display: flex;
		gap: 1rem;
		margin-top: 1.5rem;
	}
</style>
