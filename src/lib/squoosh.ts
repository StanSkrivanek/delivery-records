// Client-side image optimization using @jsquash packages
// Works in the browser with WebAssembly codecs

import { encode as encodeAvif } from '@jsquash/avif';
import { encode as encodeJpeg } from '@jsquash/jpeg';
import { encode as encodePng } from '@jsquash/png';
import resize from '@jsquash/resize';
import { encode as encodeWebP } from '@jsquash/webp';

export interface AdvancedSquooshSettings {
	webp?: {
		target_size?: number;
		target_PSNR?: number;
		method?: number; // 0-6
		sns_strength?: number; // 0-100
		filter_strength?: number; // 0-100
		filter_sharpness?: number; // 0-7
		filter_type?: number; // 0-1
		partitions?: number; // 0-3
		segments?: number; // 1-4
		pass?: number; // 1-10
		show_compressed?: number; // 0-1
		preprocessing?: number; // 0-7
		autofilter?: number; // 0-1
		partition_limit?: number; // 0-100
		alpha_compression?: number; // 0-1
		alpha_filtering?: number; // 0-2
		alpha_quality?: number; // 0-100
		lossless?: number; // 0-1
		exact?: number; // 0-1
		image_hint?: number; // 0-3
		emulate_jpeg_size?: number; // 0-1
		thread_level?: number; // 0-1
		low_memory?: number; // 0-1
		near_lossless?: number; // 0-100
		use_delta_palette?: number; // 0-1
		use_sharp_yuv?: number; // 0-1
	};
	avif?: {
		qualityAlpha?: number; // 0-100
		denoiseLevel?: number; // 0-50
		tileRowsLog2?: number; // 0-6
		tileColsLog2?: number; // 0-6
		speed?: number; // 0-10
		subsample?: number; // 1-3
		chromaDeltaQ?: boolean;
		sharpness?: number; // 0-7
		enableSharpYUV?: boolean;
		tune?: 0 | 1 | 2; // auto=0, psnr=1, ssim=2
		lossless?: boolean;
	};
	jpeg?: {
		baseline?: boolean;
		arithmetic?: boolean;
		progressive?: boolean;
		optimize_coding?: boolean;
		smoothing?: number; // 0-100
		color_space?: 1 | 2 | 3; // GRAYSCALE=1, RGB=2, YCbCr=3
		quant_table?: number; // 0-8
		trellis_multipass?: boolean;
		trellis_opt_zero?: boolean;
		trellis_opt_table?: boolean;
		trellis_loops?: number; // 1-50
		auto_subsample?: boolean;
		chroma_subsample?: number; // 0-2
		separate_chroma_quality?: boolean;
		chroma_quality?: number; // 0-100
	};
	png?: {
		// PNG in @jsquash only supports bitDepth, no compression level
		bitDepth?: 8;
	};
	resize?: {
		method?: 'triangle' | 'catrom' | 'mitchell' | 'lanczos3';
		fitMethod?: 'stretch' | 'contain';
		premultiply?: boolean;
		linearRGB?: boolean;
	};
}

export interface SquooshOptions {
	enabled: boolean;
	format: 'webp' | 'avif' | 'jpeg' | 'png' | 'original';
	quality: number; // 1-100
	resize_enabled: boolean;
	max_width: number;
	max_height: number;
	advanced_settings?: AdvancedSquooshSettings;
}

/**
 * Load an image file and convert it to ImageData
 */
async function fileToImageData(file: File): Promise<globalThis.ImageData> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			const canvas = document.createElement('canvas');
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext('2d');
			if (!ctx) {
				reject(new Error('Failed to get canvas context'));
				return;
			}
			ctx.drawImage(img, 0, 0);
			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			resolve(imageData);
		};
		img.onerror = () => reject(new Error('Failed to load image'));
		img.src = URL.createObjectURL(file);
	});
}

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
function calculateResizeDimensions(
	width: number,
	height: number,
	maxWidth: number,
	maxHeight: number
): { width: number; height: number } {
	if (width <= maxWidth && height <= maxHeight) {
		return { width, height };
	}

	const aspectRatio = width / height;

	if (width > height) {
		return {
			width: maxWidth,
			height: Math.round(maxWidth / aspectRatio)
		};
	} else {
		return {
			width: Math.round(maxHeight * aspectRatio),
			height: maxHeight
		};
	}
}

/**
 * Optimize an image file using Squoosh
 */
export async function optimizeImage(file: File, options: SquooshOptions): Promise<File> {
	// If optimization is disabled or format is 'original', return the original file
	if (!options.enabled || options.format === 'original') {
		return file;
	}

	try {
		// Load the image
		let imageData = await fileToImageData(file);

		// Resize if enabled
		if (options.resize_enabled) {
			const newDimensions = calculateResizeDimensions(
				imageData.width,
				imageData.height,
				options.max_width,
				options.max_height
			);

			// Only resize if dimensions changed
			if (newDimensions.width !== imageData.width || newDimensions.height !== imageData.height) {
				imageData = await resize(imageData, newDimensions);
			}
		}

		// Encode to the selected format
		let encodedData: ArrayBuffer;
		let mimeType: string;
		let extension: string;

		// Prepare encoding options with advanced settings or defaults
		const advancedSettings = options.advanced_settings || {};

		switch (options.format) {
			case 'webp':
				encodedData = await encodeWebP(imageData, {
					quality: options.quality,
					...advancedSettings.webp
				});
				mimeType = 'image/webp';
				extension = 'webp';
				break;
			case 'avif':
				// AVIF only supports 8-bit for standard ImageData
				encodedData = await encodeAvif(imageData, {
					quality: options.quality,
					...advancedSettings.avif
				});
				mimeType = 'image/avif';
				extension = 'avif';
				break;
			case 'jpeg':
				encodedData = await encodeJpeg(imageData, {
					quality: options.quality,
					...advancedSettings.jpeg
				});
				mimeType = 'image/jpeg';
				extension = 'jpg';
				break;
			case 'png':
				encodedData = await encodePng(imageData, {
					...advancedSettings.png
				});
				mimeType = 'image/png';
				extension = 'png';
				break;
			default:
				throw new Error(`Unsupported format: ${options.format}`);
		}

		// Create a new File from the encoded data
		const originalName = file.name.replace(/\.[^/.]+$/, '');
		const newFile = new File([encodedData], `${originalName}.${extension}`, {
			type: mimeType,
			lastModified: Date.now()
		});

		console.log(
			`Optimized ${file.name}: ${(file.size / 1024).toFixed(2)}KB → ${(newFile.size / 1024).toFixed(2)}KB (${Math.round((1 - newFile.size / file.size) * 100)}% reduction)`
		);

		return newFile;
	} catch (error) {
		console.error('Failed to optimize image:', error);
		// Return original file if optimization fails
		return file;
	}
}

/**
 * Optimize multiple image files
 */
export async function optimizeImages(files: File[], options: SquooshOptions): Promise<File[]> {
	return Promise.all(files.map((file) => optimizeImage(file, options)));
}
