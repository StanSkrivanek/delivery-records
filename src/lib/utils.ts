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
	return new Date(dateString).toLocaleDateString('en-US', {
		// year: 'numeric',
		month: 'short',
		day: 'numeric',
		// hour: '2-digit',
		// minute: '2-digit'
	});
}

export function formatDateOnly(dateString: string): string {
	return new Date(dateString).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}

// export function isToday(dateString: string): boolean {
// 	const date = new Date(dateString);
// 	const today = new Date();
// 	return date.toDateString() === today.toDateString();
// }

// export function isYesterday(dateString: string): boolean {
// 	const date = new Date(dateString);
// 	const yesterday = new Date();
// 	yesterday.setDate(yesterday.getDate() - 1);
// 	return date.toDateString() === yesterday.toDateString();
// }
