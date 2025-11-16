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

	let activeTab: 'drivers' | 'vehicles' | 'squoosh' = $state('drivers');
	let showDriverForm = $state(false);
	let showVehicleForm = $state(false);
	let editingDriver: Driver | null = $state(null);
	let editingVehicle: Vehicle | null = $state(null);
	let showAssignModal = $state(false);
	let selectedDriverForAssign: (typeof data.drivers)[number] | null = $state(null);
	let sidebarCollapsed = $state(false);

	// Advanced Squoosh settings state
	let advancedTab: 'webp' | 'avif' | 'jpeg' | 'png' = $state('webp');
	let advancedSettings = $state(data.squooshSettings?.advanced_settings || {});

	// Watch for changes to update hidden input
	$effect(() => {
		const input = document.getElementById('advanced_settings') as HTMLInputElement;
		if (input) {
			input.value = JSON.stringify(advancedSettings);
		}
	});

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

			<button
				class="nav-item"
				class:active={activeTab === 'squoosh'}
				onclick={() => (activeTab = 'squoosh')}
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
					<rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
					<circle cx="9" cy="9" r="2" />
					<path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
				</svg>
				{#if !sidebarCollapsed}
					<span class="nav-label">Image Optimization</span>
				{/if}
			</button>
		</nav>
	</aside>

	<!-- Main Content -->
	<main class="main-content">
		<div class="content-header">
			<h1>
				{activeTab === 'drivers'
					? 'Drivers Management'
					: activeTab === 'vehicles'
						? 'Vehicles Management'
						: 'Image Optimization'}
			</h1>
		</div>

		{#if form?.error}
			<div class="error-message">{form.error}</div>
		{/if}

		{#if form?.success && form?.message}
			<div class="success-message">{form.message}</div>
		{/if}

		{#if activeTab === 'squoosh'}
			<div class="section">
				<div class="section-header">
					<h2>Squoosh Image Optimization</h2>
					<p class="section-description">
						Automatically optimize images before uploading to reduce file size and improve
						performance.
					</p>
				</div>

				<form method="POST" action="?/updateSquooshSettings" class="form-card squoosh-form">
					<div class="form-group">
						<div class="toggle-wrapper">
							<label for="enabled">Enable Image Optimization</label>
							<input
								type="checkbox"
								id="enabled"
								name="enabled"
								checked={data.squooshSettings?.enabled ?? true}
								class="toggle-checkbox"
							/>
						</div>
						<p class="help-text">
							When enabled, images will be automatically optimized before saving.
						</p>
					</div>

					<div class="form-group">
						<label for="format">Output Format</label>
						<select id="format" name="format" value={data.squooshSettings?.format || 'webp'}>
							<option value="webp">WebP (Recommended)</option>
							<option value="avif">AVIF (Best compression)</option>
							<option value="jpeg">JPEG</option>
							<option value="png">PNG</option>
							<option value="original">Keep Original</option>
						</select>
						<p class="help-text">
							WebP offers great compression with wide browser support. AVIF provides the best
							compression but has limited browser support.
						</p>
					</div>

					<div class="form-group">
						<label for="quality">Quality: {data.squooshSettings?.quality || 80}%</label>
						<input
							type="range"
							id="quality"
							name="quality"
							min="1"
							max="100"
							value={data.squooshSettings?.quality || 80}
							class="quality-slider"
						/>
						<div class="slider-labels">
							<span>Lower size</span>
							<span>Higher quality</span>
						</div>
						<p class="help-text">
							Higher quality means larger file size. Recommended: 75-85 for photos, 85-95 for
							graphics.
						</p>
					</div>

					<div class="form-group">
						<div class="toggle-wrapper">
							<label for="resize_enabled">Enable Image Resizing</label>
							<input
								type="checkbox"
								id="resize_enabled"
								name="resize_enabled"
								checked={data.squooshSettings?.resize_enabled ?? false}
								class="toggle-checkbox"
							/>
						</div>
						<p class="help-text">Automatically resize large images to maximum dimensions.</p>
					</div>

					<div class="form-row">
						<div class="form-group">
							<label for="max_width">Max Width (px)</label>
							<input
								type="number"
								id="max_width"
								name="max_width"
								value={data.squooshSettings?.max_width || 1920}
								min="100"
								max="4096"
								step="1"
							/>
						</div>

						<div class="form-group">
							<label for="max_height">Max Height (px)</label>
							<input
								type="number"
								id="max_height"
								name="max_height"
								value={data.squooshSettings?.max_height || 1080}
								min="100"
								max="4096"
								step="1"
							/>
						</div>
					</div>

					<!-- Resize Advanced Options -->
					<details class="resize-advanced">
						<summary>Resize Method & Options</summary>
						<div class="resize-options">
							<div class="form-group">
								<label for="resize_method">Resize Method</label>
								<select
									id="resize_method"
									value={advancedSettings.resize?.method || 'lanczos3'}
									onchange={(e) => {
										advancedSettings.resize = {
											...advancedSettings.resize,
											method: e.currentTarget.value as
												| 'triangle'
												| 'catrom'
												| 'mitchell'
												| 'lanczos3'
										};
									}}
								>
									<option value="triangle">Triangle (fast, lower quality)</option>
									<option value="catrom">Catmull-Rom (balanced)</option>
									<option value="mitchell">Mitchell (sharp)</option>
									<option value="lanczos3">Lanczos3 (best quality, slower)</option>
								</select>
								<span class="setting-help">Algorithm used for image resizing</span>
							</div>

							<div class="form-group">
								<label for="resize_fitMethod">Fit Method</label>
								<select
									id="resize_fitMethod"
									value={advancedSettings.resize?.fitMethod || 'contain'}
									onchange={(e) => {
										advancedSettings.resize = {
											...advancedSettings.resize,
											fitMethod: e.currentTarget.value as 'stretch' | 'contain'
										};
									}}
								>
									<option value="contain">Contain (maintain aspect ratio)</option>
									<option value="stretch">Stretch (fill dimensions)</option>
								</select>
								<span class="setting-help">How to fit the image in target dimensions</span>
							</div>

							<div class="setting-item">
								<label>
									<input
										type="checkbox"
										checked={advancedSettings.resize?.premultiply ?? true}
										onchange={(e) => {
											advancedSettings.resize = {
												...advancedSettings.resize,
												premultiply: e.currentTarget.checked
											};
										}}
									/>
									Premultiply Alpha Channel
								</label>
								<span class="setting-help"
									>Improves quality when resizing images with transparency</span
								>
							</div>

							<div class="setting-item">
								<label>
									<input
										type="checkbox"
										checked={advancedSettings.resize?.linearRGB ?? true}
										onchange={(e) => {
											advancedSettings.resize = {
												...advancedSettings.resize,
												linearRGB: e.currentTarget.checked
											};
										}}
									/>
									Linear RGB
								</label>
								<span class="setting-help">More accurate color interpolation during resize</span>
							</div>
						</div>
					</details>

					<!-- Advanced Settings Section -->
					<div class="advanced-settings-section">
						<details class="advanced-details">
							<summary class="advanced-summary">
								<h3>Advanced Settings</h3>
								<p>Format-specific optimization parameters for fine-tuning</p>
							</summary>

							<div class="advanced-content">
								<p class="advanced-info">
									Configure format-specific encoding options. Changes are saved with your settings.
									<button
										type="button"
										class="btn-link"
										onclick={() => {
											if (
												confirm('This will reset all advanced settings to defaults. Are you sure?')
											) {
												// Reset logic will be handled by form
												document.getElementById('advanced_settings')?.setAttribute('value', '');
											}
										}}
									>
										Reset to Defaults
									</button>
								</p>

								<input
									type="hidden"
									id="advanced_settings"
									name="advanced_settings"
									value={JSON.stringify(advancedSettings)}
								/>

								<!-- Advanced Settings Tabs -->
								<div class="advanced-tabs">
									<div class="tab-buttons">
										<button
											type="button"
											class="tab-btn"
											class:active={advancedTab === 'webp'}
											onclick={() => (advancedTab = 'webp')}
										>
											WebP
										</button>
										<button
											type="button"
											class="tab-btn"
											class:active={advancedTab === 'avif'}
											onclick={() => (advancedTab = 'avif')}
										>
											AVIF
										</button>
										<button
											type="button"
											class="tab-btn"
											class:active={advancedTab === 'jpeg'}
											onclick={() => (advancedTab = 'jpeg')}
										>
											JPEG
										</button>
										<button
											type="button"
											class="tab-btn"
											class:active={advancedTab === 'png'}
											onclick={() => (advancedTab = 'png')}
										>
											PNG
										</button>
									</div>

									<div class="tab-content">
										{#if advancedTab === 'webp'}
											<div class="settings-grid">
												<div class="setting-item">
													<label>
														<input
															type="checkbox"
															checked={(advancedSettings.webp?.lossless ?? 0) === 1}
															onchange={(e) => {
																advancedSettings.webp = {
																	...advancedSettings.webp,
																	lossless: e.currentTarget.checked ? 1 : 0
																};
															}}
														/>
														Lossless
													</label>
													<span class="setting-help">Enable lossless compression</span>
												</div>

												<div class="setting-item">
													<label for="webp_method">Effort (Method 0-6)</label>
													<input
														type="range"
														id="webp_method"
														min="0"
														max="6"
														value={advancedSettings.webp?.method ?? 4}
														oninput={(e) => {
															advancedSettings.webp = {
																...advancedSettings.webp,
																method: parseInt(e.currentTarget.value)
															};
														}}
													/>
													<output>{advancedSettings.webp?.method ?? 4}</output>
													<span class="setting-help">0=fast, 6=slower but better quality</span>
												</div>

												<div class="setting-item">
													<label for="webp_near_lossless">Near Lossless (0-100)</label>
													<input
														type="range"
														id="webp_near_lossless"
														min="0"
														max="100"
														value={advancedSettings.webp?.near_lossless ?? 100}
														oninput={(e) => {
															advancedSettings.webp = {
																...advancedSettings.webp,
																near_lossless: parseInt(e.currentTarget.value)
															};
														}}
													/>
													<output>{advancedSettings.webp?.near_lossless ?? 100}</output>
													<span class="setting-help">Preprocessing quality (100=best)</span>
												</div>

												<div class="setting-item">
													<label>
														<input
															type="checkbox"
															checked={(advancedSettings.webp?.use_sharp_yuv ?? 0) === 1}
															onchange={(e) => {
																advancedSettings.webp = {
																	...advancedSettings.webp,
																	use_sharp_yuv: e.currentTarget.checked ? 1 : 0
																};
															}}
														/>
														Use Sharp YUV
													</label>
													<span class="setting-help">Better RGB↔YUV color conversion</span>
												</div>

												<!-- Alpha/Transparency Settings -->
												<div class="setting-item">
													<label>
														<input
															type="checkbox"
															checked={(advancedSettings.webp?.alpha_compression ?? 1) === 1}
															onchange={(e) => {
																advancedSettings.webp = {
																	...advancedSettings.webp,
																	alpha_compression: e.currentTarget.checked ? 1 : 0
																};
															}}
														/>
														Compress Alpha
													</label>
													<span class="setting-help">Compress alpha/transparency channel</span>
												</div>

												<div class="setting-item">
													<label for="webp_alpha_quality">Alpha Quality (0-100)</label>
													<input
														type="range"
														id="webp_alpha_quality"
														min="0"
														max="100"
														value={advancedSettings.webp?.alpha_quality ?? 100}
														oninput={(e) => {
															advancedSettings.webp = {
																...advancedSettings.webp,
																alpha_quality: parseInt(e.currentTarget.value)
															};
														}}
													/>
													<output>{advancedSettings.webp?.alpha_quality ?? 100}</output>
													<span class="setting-help">Quality of alpha channel compression</span>
												</div>

												<div class="setting-item">
													<label for="webp_alpha_filtering">Alpha Filter (0-2)</label>
													<select
														id="webp_alpha_filtering"
														value={advancedSettings.webp?.alpha_filtering ?? 1}
														onchange={(e) => {
															advancedSettings.webp = {
																...advancedSettings.webp,
																alpha_filtering: parseInt(e.currentTarget.value)
															};
														}}
													>
														<option value="0">None</option>
														<option value="1">Fast</option>
														<option value="2">Best</option>
													</select>
													<span class="setting-help">Alpha channel filtering method</span>
												</div>

												<!-- Filter Settings -->
												<div class="setting-item">
													<label>
														<input
															type="checkbox"
															checked={(advancedSettings.webp?.autofilter ?? 1) === 1}
															onchange={(e) => {
																advancedSettings.webp = {
																	...advancedSettings.webp,
																	autofilter: e.currentTarget.checked ? 1 : 0
																};
															}}
														/>
														Auto Adjust Filter Strength
													</label>
													<span class="setting-help">Automatically optimize filter settings</span>
												</div>

												<div class="setting-item">
													<label for="webp_filter_strength">Filter Strength (0-100)</label>
													<input
														type="range"
														id="webp_filter_strength"
														min="0"
														max="100"
														value={advancedSettings.webp?.filter_strength ?? 60}
														oninput={(e) => {
															advancedSettings.webp = {
																...advancedSettings.webp,
																filter_strength: parseInt(e.currentTarget.value)
															};
														}}
													/>
													<output>{advancedSettings.webp?.filter_strength ?? 60}</output>
													<span class="setting-help">Deblocking filter strength</span>
												</div>

												<div class="setting-item">
													<label for="webp_filter_sharpness">Filter Sharpness (0-7)</label>
													<input
														type="range"
														id="webp_filter_sharpness"
														min="0"
														max="7"
														value={advancedSettings.webp?.filter_sharpness ?? 0}
														oninput={(e) => {
															advancedSettings.webp = {
																...advancedSettings.webp,
																filter_sharpness: parseInt(e.currentTarget.value)
															};
														}}
													/>
													<output>{advancedSettings.webp?.filter_sharpness ?? 0}</output>
													<span class="setting-help"
														>Sharpness of filtering (0=sharp, 7=smooth)</span
													>
												</div>

												<!-- Advanced Options -->
												<div class="setting-item">
													<label for="webp_sns_strength">SNS Strength (0-100)</label>
													<input
														type="range"
														id="webp_sns_strength"
														min="0"
														max="100"
														value={advancedSettings.webp?.sns_strength ?? 50}
														oninput={(e) => {
															advancedSettings.webp = {
																...advancedSettings.webp,
																sns_strength: parseInt(e.currentTarget.value)
															};
														}}
													/>
													<output>{advancedSettings.webp?.sns_strength ?? 50}</output>
													<span class="setting-help">Spatial Noise Shaping strength</span>
												</div>

												<div class="setting-item">
													<label for="webp_segments">Segments (1-4)</label>
													<input
														type="number"
														id="webp_segments"
														min="1"
														max="4"
														value={advancedSettings.webp?.segments ?? 4}
														oninput={(e) => {
															advancedSettings.webp = {
																...advancedSettings.webp,
																segments: parseInt(e.currentTarget.value)
															};
														}}
													/>
													<span class="setting-help">Number of segments for compression</span>
												</div>

												<div class="setting-item">
													<label for="webp_pass">Passes (1-10)</label>
													<input
														type="number"
														id="webp_pass"
														min="1"
														max="10"
														value={advancedSettings.webp?.pass ?? 1}
														oninput={(e) => {
															advancedSettings.webp = {
																...advancedSettings.webp,
																pass: parseInt(e.currentTarget.value)
															};
														}}
													/>
													<span class="setting-help">Number of optimization passes</span>
												</div>
											</div>
										{:else if advancedTab === 'avif'}
											<div class="settings-grid">
												<div class="setting-item">
													<label>
														<input
															type="checkbox"
															checked={advancedSettings.avif?.lossless ?? false}
															onchange={(e) => {
																advancedSettings.avif = {
																	...advancedSettings.avif,
																	lossless: e.currentTarget.checked
																};
															}}
														/>
														Lossless
													</label>
													<span class="setting-help">Enable lossless compression</span>
												</div>

												<div class="setting-item">
													<label for="avif_speed">Speed (0-10)</label>
													<input
														type="range"
														id="avif_speed"
														min="0"
														max="10"
														value={advancedSettings.avif?.speed ?? 6}
														oninput={(e) => {
															advancedSettings.avif = {
																...advancedSettings.avif,
																speed: parseInt(e.currentTarget.value)
															};
														}}
													/>
													<output>{advancedSettings.avif?.speed ?? 6}</output>
													<span class="setting-help">0=slowest/best, 10=fastest</span>
												</div>

												<div class="setting-item">
													<label for="avif_subsample">Chroma Subsampling</label>
													<select
														id="avif_subsample"
														value={advancedSettings.avif?.subsample ?? 1}
														onchange={(e) => {
															advancedSettings.avif = {
																...advancedSettings.avif,
																subsample: parseInt(e.currentTarget.value)
															};
														}}
													>
														<option value="1">4:2:0 (Standard)</option>
														<option value="2">4:2:2</option>
														<option value="3">4:4:4 (Best quality)</option>
													</select>
													<span class="setting-help">Color subsampling method</span>
												</div>

												<div class="setting-item">
													<label for="avif_qualityAlpha">Alpha Quality (0-100)</label>
													<input
														type="range"
														id="avif_qualityAlpha"
														min="0"
														max="100"
														value={advancedSettings.avif?.qualityAlpha ?? 100}
														oninput={(e) => {
															advancedSettings.avif = {
																...advancedSettings.avif,
																qualityAlpha: parseInt(e.currentTarget.value)
															};
														}}
													/>
													<output>{advancedSettings.avif?.qualityAlpha ?? 100}</output>
													<span class="setting-help">Alpha channel quality</span>
												</div>

												<div class="setting-item">
													<label for="avif_sharpness">Sharpness (0-7)</label>
													<input
														type="range"
														id="avif_sharpness"
														min="0"
														max="7"
														value={advancedSettings.avif?.sharpness ?? 0}
														oninput={(e) => {
															advancedSettings.avif = {
																...advancedSettings.avif,
																sharpness: parseInt(e.currentTarget.value)
															};
														}}
													/>
													<output>{advancedSettings.avif?.sharpness ?? 0}</output>
													<span class="setting-help">Sharpness filter (0-7)</span>
												</div>

												<div class="setting-item">
													<label>
														<input
															type="checkbox"
															checked={advancedSettings.avif?.chromaDeltaQ ?? false}
															onchange={(e) => {
																advancedSettings.avif = {
																	...advancedSettings.avif,
																	chromaDeltaQ: e.currentTarget.checked
																};
															}}
														/>
														Chroma Delta Q
													</label>
													<span class="setting-help">Independent chroma quality adjustments</span>
												</div>

												<div class="setting-item">
													<label>
														<input
															type="checkbox"
															checked={advancedSettings.avif?.enableSharpYUV ?? false}
															onchange={(e) => {
																advancedSettings.avif = {
																	...advancedSettings.avif,
																	enableSharpYUV: e.currentTarget.checked
																};
															}}
														/>
														Enable Sharp YUV
													</label>
													<span class="setting-help">Better RGB↔YUV conversion</span>
												</div>

												<div class="setting-item">
													<label for="avif_denoiseLevel">Denoise Level (0-50)</label>
													<input
														type="range"
														id="avif_denoiseLevel"
														min="0"
														max="50"
														value={advancedSettings.avif?.denoiseLevel ?? 0}
														oninput={(e) => {
															advancedSettings.avif = {
																...advancedSettings.avif,
																denoiseLevel: parseInt(e.currentTarget.value)
															};
														}}
													/>
													<output>{advancedSettings.avif?.denoiseLevel ?? 0}</output>
													<span class="setting-help">Noise reduction strength</span>
												</div>

												<div class="setting-item">
													<label for="avif_tune">Tuning</label>
													<select
														id="avif_tune"
														value={advancedSettings.avif?.tune ?? 0}
														onchange={(e) => {
															advancedSettings.avif = {
																...advancedSettings.avif,
																tune: parseInt(e.currentTarget.value) as 0 | 1 | 2
															};
														}}
													>
														<option value="0">Auto</option>
														<option value="1">PSNR (quality metric)</option>
														<option value="2">SSIM (perceptual)</option>
													</select>
													<span class="setting-help">Optimization target</span>
												</div>

												<div class="setting-item">
													<label for="avif_tileRowsLog2">Tile Rows Log2 (0-6)</label>
													<input
														type="number"
														id="avif_tileRowsLog2"
														min="0"
														max="6"
														value={advancedSettings.avif?.tileRowsLog2 ?? 0}
														oninput={(e) => {
															advancedSettings.avif = {
																...advancedSettings.avif,
																tileRowsLog2: parseInt(e.currentTarget.value)
															};
														}}
													/>
													<span class="setting-help">Number of tile rows (power of 2)</span>
												</div>

												<div class="setting-item">
													<label for="avif_tileColsLog2">Tile Cols Log2 (0-6)</label>
													<input
														type="number"
														id="avif_tileColsLog2"
														min="0"
														max="6"
														value={advancedSettings.avif?.tileColsLog2 ?? 0}
														oninput={(e) => {
															advancedSettings.avif = {
																...advancedSettings.avif,
																tileColsLog2: parseInt(e.currentTarget.value)
															};
														}}
													/>
													<span class="setting-help">Number of tile columns (power of 2)</span>
												</div>
											</div>
										{:else if advancedTab === 'jpeg'}
											<div class="settings-grid">
												<div class="setting-item">
													<label>
														<input
															type="checkbox"
															checked={advancedSettings.jpeg?.baseline ?? false}
															onchange={(e) => {
																advancedSettings.jpeg = {
																	...advancedSettings.jpeg,
																	baseline: e.currentTarget.checked
																};
															}}
														/>
														Baseline
													</label>
													<span class="setting-help">Force baseline JPEG (compatible mode)</span>
												</div>

												<div class="setting-item">
													<label>
														<input
															type="checkbox"
															checked={advancedSettings.jpeg?.progressive ?? false}
															onchange={(e) => {
																advancedSettings.jpeg = {
																	...advancedSettings.jpeg,
																	progressive: e.currentTarget.checked
																};
															}}
														/>
														Progressive
													</label>
													<span class="setting-help">Progressive JPEG (loads gradually)</span>
												</div>

												<div class="setting-item">
													<label>
														<input
															type="checkbox"
															checked={advancedSettings.jpeg?.optimize_coding ?? true}
															onchange={(e) => {
																advancedSettings.jpeg = {
																	...advancedSettings.jpeg,
																	optimize_coding: e.currentTarget.checked
																};
															}}
														/>
														Optimize Coding
													</label>
													<span class="setting-help">Better compression (slower encoding)</span>
												</div>

												<div class="setting-item">
													<label>
														<input
															type="checkbox"
															checked={advancedSettings.jpeg?.arithmetic ?? false}
															onchange={(e) => {
																advancedSettings.jpeg = {
																	...advancedSettings.jpeg,
																	arithmetic: e.currentTarget.checked
																};
															}}
														/>
														Arithmetic Coding
													</label>
													<span class="setting-help">Better compression (not widely supported)</span
													>
												</div>

												<div class="setting-item">
													<label for="jpeg_smoothing">Smoothing (0-100)</label>
													<input
														type="range"
														id="jpeg_smoothing"
														min="0"
														max="100"
														value={advancedSettings.jpeg?.smoothing ?? 0}
														oninput={(e) => {
															advancedSettings.jpeg = {
																...advancedSettings.jpeg,
																smoothing: parseInt(e.currentTarget.value)
															};
														}}
													/>
													<output>{advancedSettings.jpeg?.smoothing ?? 0}</output>
													<span class="setting-help">Image smoothing/blur factor</span>
												</div>

												<div class="setting-item">
													<label for="jpeg_color_space">Color Space</label>
													<select
														id="jpeg_color_space"
														value={advancedSettings.jpeg?.color_space ?? 3}
														onchange={(e) => {
															advancedSettings.jpeg = {
																...advancedSettings.jpeg,
																color_space: parseInt(e.currentTarget.value) as 1 | 2 | 3
															};
														}}
													>
														<option value="1">Grayscale</option>
														<option value="2">RGB</option>
														<option value="3">YCbCr (Standard)</option>
													</select>
													<span class="setting-help">Color encoding method</span>
												</div>

												<div class="setting-item">
													<label for="jpeg_quant_table">Quantization Table (0-8)</label>
													<input
														type="number"
														id="jpeg_quant_table"
														min="0"
														max="8"
														value={advancedSettings.jpeg?.quant_table ?? 3}
														oninput={(e) => {
															advancedSettings.jpeg = {
																...advancedSettings.jpeg,
																quant_table: parseInt(e.currentTarget.value)
															};
														}}
													/>
													<span class="setting-help">Quantization table selection</span>
												</div>

												<div class="setting-item">
													<label>
														<input
															type="checkbox"
															checked={advancedSettings.jpeg?.auto_subsample ?? true}
															onchange={(e) => {
																advancedSettings.jpeg = {
																	...advancedSettings.jpeg,
																	auto_subsample: e.currentTarget.checked
																};
															}}
														/>
														Auto Subsample
													</label>
													<span class="setting-help"
														>Automatically determine chroma subsampling</span
													>
												</div>

												<div class="setting-item">
													<label for="jpeg_chroma_subsample">Chroma Subsampling</label>
													<select
														id="jpeg_chroma_subsample"
														value={advancedSettings.jpeg?.chroma_subsample ?? 2}
														onchange={(e) => {
															advancedSettings.jpeg = {
																...advancedSettings.jpeg,
																chroma_subsample: parseInt(e.currentTarget.value)
															};
														}}
													>
														<option value="0">4:4:4 (No subsampling)</option>
														<option value="1">4:2:2 (Horizontal)</option>
														<option value="2">4:2:0 (Standard)</option>
													</select>
													<span class="setting-help">Color subsampling method</span>
												</div>

												<!-- Trellis Optimization -->
												<div class="setting-item">
													<label>
														<input
															type="checkbox"
															checked={advancedSettings.jpeg?.trellis_multipass ?? false}
															onchange={(e) => {
																advancedSettings.jpeg = {
																	...advancedSettings.jpeg,
																	trellis_multipass: e.currentTarget.checked
																};
															}}
														/>
														Trellis Multipass
													</label>
													<span class="setting-help">Multi-pass trellis optimization</span>
												</div>

												<div class="setting-item">
													<label>
														<input
															type="checkbox"
															checked={advancedSettings.jpeg?.trellis_opt_zero ?? false}
															onchange={(e) => {
																advancedSettings.jpeg = {
																	...advancedSettings.jpeg,
																	trellis_opt_zero: e.currentTarget.checked
																};
															}}
														/>
														Trellis Optimize Zero
													</label>
													<span class="setting-help">Optimize zero coefficients</span>
												</div>

												<div class="setting-item">
													<label>
														<input
															type="checkbox"
															checked={advancedSettings.jpeg?.trellis_opt_table ?? false}
															onchange={(e) => {
																advancedSettings.jpeg = {
																	...advancedSettings.jpeg,
																	trellis_opt_table: e.currentTarget.checked
																};
															}}
														/>
														Trellis Optimize Table
													</label>
													<span class="setting-help">Optimize quantization tables</span>
												</div>

												<div class="setting-item">
													<label for="jpeg_trellis_loops">Trellis Loops (1-50)</label>
													<input
														type="number"
														id="jpeg_trellis_loops"
														min="1"
														max="50"
														value={advancedSettings.jpeg?.trellis_loops ?? 1}
														oninput={(e) => {
															advancedSettings.jpeg = {
																...advancedSettings.jpeg,
																trellis_loops: parseInt(e.currentTarget.value)
															};
														}}
													/>
													<span class="setting-help">Number of trellis optimization passes</span>
												</div>

												<!-- Separate Chroma Quality -->
												<div class="setting-item">
													<label>
														<input
															type="checkbox"
															checked={advancedSettings.jpeg?.separate_chroma_quality ?? false}
															onchange={(e) => {
																advancedSettings.jpeg = {
																	...advancedSettings.jpeg,
																	separate_chroma_quality: e.currentTarget.checked
																};
															}}
														/>
														Separate Chroma Quality
													</label>
													<span class="setting-help">Independent quality for color channels</span>
												</div>

												<div class="setting-item">
													<label for="jpeg_chroma_quality">Chroma Quality (0-100)</label>
													<input
														type="range"
														id="jpeg_chroma_quality"
														min="0"
														max="100"
														value={advancedSettings.jpeg?.chroma_quality ?? 75}
														oninput={(e) => {
															advancedSettings.jpeg = {
																...advancedSettings.jpeg,
																chroma_quality: parseInt(e.currentTarget.value)
															};
														}}
													/>
													<output>{advancedSettings.jpeg?.chroma_quality ?? 75}</output>
													<span class="setting-help">Quality of chroma channels</span>
												</div>
											</div>
										{:else if advancedTab === 'png'}
											<div class="settings-grid">
												<div class="setting-item">
													<h4>PNG Encoding Information</h4>
													<p class="info-message">
														The @jsquash/png library provides optimized PNG encoding with automatic
														compression. PNG is a lossless format that preserves all image data
														while reducing file size through efficient encoding algorithms.
													</p>
													<p class="info-message">
														<strong>Best for:</strong> Graphics, logos, screenshots, images with text,
														and images requiring transparency
													</p>
													<p class="info-message">
														<strong>Note:</strong> For photographs, WebP or AVIF formats typically provide
														much better compression ratios (smaller files) while maintaining similar
														visual quality.
													</p>
												</div>

												<div class="setting-item">
													<label for="png_bitDepth">Bit Depth</label>
													<select id="png_bitDepth" disabled>
														<option value="8">8-bit (Standard)</option>
													</select>
													<span class="setting-help"
														>@jsquash/png uses 8-bit color depth for optimal browser compatibility</span
													>
												</div>
											</div>
										{/if}
									</div>
								</div>
							</div>
						</details>
					</div>

					<div class="form-actions">
						<button type="submit" class="btn-primary">Save Settings</button>
					</div>
				</form>
			</div>
		{:else if activeTab === 'drivers'}
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

	/* Squoosh Settings Styles */
	.squoosh-form {
		max-width: 800px;
	}

	.section-description {
		color: #6b7280;
		font-size: 0.95rem;
		margin-top: 0.5rem;
	}

	.toggle-wrapper {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.toggle-checkbox {
		appearance: none;
		width: 48px;
		height: 24px;
		background: #d1d5db;
		border-radius: 12px;
		position: relative;
		cursor: pointer;
		transition: background 0.2s;
	}

	.toggle-checkbox:checked {
		background: #3b82f6;
	}

	.toggle-checkbox::before {
		content: '';
		position: absolute;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: white;
		top: 2px;
		left: 2px;
		transition: transform 0.2s;
	}

	.toggle-checkbox:checked::before {
		transform: translateX(24px);
	}

	.quality-slider {
		width: 100%;
		height: 6px;
		border-radius: 3px;
		background: #e5e7eb;
		outline: none;
		appearance: none;
		-webkit-appearance: none;
	}

	.quality-slider::-webkit-slider-thumb {
		appearance: none;
		-webkit-appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #3b82f6;
		cursor: pointer;
	}

	.quality-slider::-moz-range-thumb {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #3b82f6;
		cursor: pointer;
		border: none;
	}

	.slider-labels {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
		color: #6b7280;
		margin-top: 0.25rem;
	}

	.help-text {
		font-size: 0.875rem;
		color: #6b7280;
		margin-top: 0.5rem;
		line-height: 1.4;
	}

	/* Advanced Settings Styles */
	.advanced-settings-section {
		margin-top: 2rem;
		border-top: 2px solid #e5e7eb;
		padding-top: 2rem;
	}

	.advanced-details {
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		padding: 1rem;
		background: #f9fafb;
	}

	.advanced-summary {
		cursor: pointer;
		list-style: none;
		user-select: none;
	}

	.advanced-summary::-webkit-details-marker {
		display: none;
	}

	.advanced-summary h3 {
		margin: 0 0 0.25rem 0;
		color: #1f2937;
		font-size: 1.125rem;
		display: inline-block;
	}

	.advanced-summary p {
		margin: 0;
		color: #6b7280;
		font-size: 0.875rem;
	}

	.advanced-summary::before {
		content: '▶';
		display: inline-block;
		margin-right: 0.5rem;
		transition: transform 0.2s;
	}

	.advanced-details[open] .advanced-summary::before {
		transform: rotate(90deg);
	}

	.advanced-content {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #e5e7eb;
	}

	.advanced-info {
		background: #fff;
		padding: 1rem;
		border-radius: 0.375rem;
		margin-bottom: 1rem;
		font-size: 0.875rem;
		color: #4b5563;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.btn-link {
		background: none;
		border: none;
		color: #3b82f6;
		text-decoration: underline;
		cursor: pointer;
		padding: 0;
		font-size: 0.875rem;
	}

	.btn-link:hover {
		color: #2563eb;
	}

	/* Advanced Settings Tabs */
	.advanced-tabs {
		background: #fff;
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.tab-buttons {
		display: flex;
		border-bottom: 2px solid #e5e7eb;
		background: #f9fafb;
	}

	.tab-btn {
		flex: 1;
		padding: 1rem;
		background: none;
		border: none;
		cursor: pointer;
		font-weight: 500;
		color: #6b7280;
		transition: all 0.2s;
		border-bottom: 3px solid transparent;
		margin-bottom: -2px;
	}

	.tab-btn:hover {
		background: #f3f4f6;
		color: #374151;
	}

	.tab-btn.active {
		color: #3b82f6;
		border-bottom-color: #3b82f6;
		background: #fff;
	}

	.tab-content {
		padding: 1.5rem;
	}

	.settings-grid {
		display: grid;
		gap: 1.5rem;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	}

	.setting-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.setting-item label {
		font-weight: 500;
		color: #374151;
		font-size: 0.875rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.setting-item input[type='number'],
	.setting-item select {
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	.setting-item input[type='checkbox'] {
		width: 18px;
		height: 18px;
		cursor: pointer;
	}

	.setting-help {
		font-size: 0.75rem;
		color: #6b7280;
		font-style: italic;
	}

	/* Range Slider with Output */
	.setting-item input[type='range'] {
		width: 100%;
		appearance: none;
		-webkit-appearance: none;
		height: 6px;
		border-radius: 3px;
		background: #d1d5db;
		outline: none;
		margin: 0.5rem 0;
	}

	.setting-item input[type='range']::-webkit-slider-thumb {
		appearance: none;
		-webkit-appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #3b82f6;
		cursor: pointer;
		transition: background 0.2s;
	}

	.setting-item input[type='range']::-webkit-slider-thumb:hover {
		background: #2563eb;
	}

	.setting-item input[type='range']::-moz-range-thumb {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #3b82f6;
		cursor: pointer;
		border: none;
		transition: background 0.2s;
	}

	.setting-item input[type='range']::-moz-range-thumb:hover {
		background: #2563eb;
	}

	.setting-item output {
		display: inline-block;
		min-width: 40px;
		padding: 0.25rem 0.5rem;
		background: #f3f4f6;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		text-align: center;
	}

	/* Info Message */
	.info-message {
		font-size: 0.875rem;
		color: #4b5563;
		background: #eff6ff;
		padding: 0.75rem;
		border-radius: 0.375rem;
		border-left: 3px solid #3b82f6;
		margin: 0.5rem 0;
		line-height: 1.5;
	}

	.info-message strong {
		color: #1f2937;
	}

	/* Resize Advanced Options */
	.resize-advanced {
		margin-top: 1rem;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		padding: 1rem;
		background: #f9fafb;
	}

	.resize-advanced summary {
		cursor: pointer;
		list-style: none;
		user-select: none;
		font-weight: 500;
		color: #374151;
	}

	.resize-advanced summary::-webkit-details-marker {
		display: none;
	}

	.resize-advanced summary::before {
		content: '▶';
		display: inline-block;
		margin-right: 0.5rem;
		transition: transform 0.2s;
		font-size: 0.75rem;
	}

	.resize-advanced[open] summary::before {
		transform: rotate(90deg);
	}

	.resize-options {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #e5e7eb;
		display: grid;
		gap: 1rem;
	}

	.setting-item h4 {
		margin: 0 0 0.5rem 0;
		color: #1f2937;
		font-size: 1rem;
	}

	/* Disabled Inputs */
	.setting-item select:disabled {
		background: #f3f4f6;
		color: #9ca3af;
		cursor: not-allowed;
	}
</style>
