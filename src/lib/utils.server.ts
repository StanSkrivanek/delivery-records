import fs from 'fs';
import path from 'path';

// IMAGE HELPER-fn-

// This function creates a path for storing images based on the specified date (or current date if not provided).
// It creates a directory structure like static/images/2023/Oct/ and returns the relative path to the image file.
// The filename is generated using the entry date in DD-MM-YYYY format, with sequential numbering for multiple images.
export function createImagePath(file: File, index: number = 0, entryDate?: string | Date): string {
	// Use provided date or current date
	const date = entryDate ? new Date(entryDate) : new Date();
	const year = date.getFullYear();
	const month = date.toLocaleDateString('en-US', { month: 'short' }); // jan, feb, etc.

	const folderPath = path.join(process.cwd(), 'static', 'images', year.toString(), month);

	// Create directory if it doesn't exist
	if (!fs.existsSync(folderPath)) {
		fs.mkdirSync(folderPath, { recursive: true });
	}

	// Generate filename using DD-MM-YYYY format with sequential numbering
	const day = String(date.getDate()).padStart(2, '0');
	const monthNum = String(date.getMonth() + 1).padStart(2, '0');
	const dateStr = `${day}-${monthNum}-${year}`;
	const sequenceNum = String(index).padStart(3, '0');
	const extension = path.extname(file.name);
	const filename = `${dateStr}_${sequenceNum}${extension}`;

	return path.join('images', year.toString(), month, filename);
}

// Helper function to create paths for multiple images
export function createImagePaths(files: File[], entryDate?: string | Date): string[] {
	return files.map((file, index) => createImagePath(file, index, entryDate));
}

/**  This function saves the file to the static/images directory with a unique name based on the current date in DD-MM-YYYY format.
 * It uses the `arrayBuffer` method to read the file data and writes it to the specified path.
 * The `relativePath` should be the path relative to the static directory, e.g., 'images/2023/Oct/25-10-2023_abc123.jpg'.
 * The function creates the necessary directories if they do not exist.*/

/**
 * Save an image file to the static directory
 * @param file File object to save
 * @param relativePath Relative path where the file should be saved
 */

export async function saveImageFile(file: File, relativePath: string): Promise<void> {
	const fullPath = path.join(process.cwd(), 'static', relativePath);
	const buffer = Buffer.from(await file.arrayBuffer());
	fs.writeFileSync(fullPath, buffer);
}

// This function checks if the file exists and deletes it if it does.

/**
 * Delete an image file from the static directory
 * @param relativePath Relative path to the image file
 */
export function deleteImageFile(relativePath: string): void {
	try {
		const fullPath = path.join(process.cwd(), 'static', relativePath);
		if (fs.existsSync(fullPath)) {
			fs.unlinkSync(fullPath);
		}
	} catch (error) {
		console.error('Failed to delete image:', error);
	}
}
