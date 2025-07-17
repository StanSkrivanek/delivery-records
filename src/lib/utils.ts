import fs from 'fs';
import path from 'path';

export function createImagePath(file: File): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = now.toLocaleDateString('en-US', { month: 'short' }); // jan, feb, etc.

	const folderPath = path.join(process.cwd(), 'static', 'images', year.toString(), month);

	// Create directory if it doesn't exist
	if (!fs.existsSync(folderPath)) {
		fs.mkdirSync(folderPath, { recursive: true });
	}

	// Generate unique filename
	const timestamp = Date.now();
	const extension = path.extname(file.name);
	const filename = `${timestamp}${extension}`;

	return path.join('images', year.toString(), month, filename);
}

export async function saveImageFile(file: File, relativePath: string): Promise<void> {
	const fullPath = path.join(process.cwd(), 'static', relativePath);
	const buffer = Buffer.from(await file.arrayBuffer());
	fs.writeFileSync(fullPath, buffer);
}

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

export function formatDate(dateString: string): string {
	const date = new Date(dateString);
	const month = date.toLocaleString('en-US', { month: 'short' });
	const day = date.getDate().toString().padStart(2, '0');
	return `${month} ${day}`;
}
