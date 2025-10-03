
/**
 * Generate a unique ID
 */
export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
/**
 * Detect aspect ratio from image dimensions
 */

export function detectAspectRatio(width: number, height: number): string {
    const ratio = width / height;

    // Define common aspect ratios with tolerance
    const aspectRatios = [
        { ratio: 16 / 9, label: "16:9" },
        { ratio: 4 / 3, label: "4:3" },
        { ratio: 1, label: "1:1" },
        { ratio: 3 / 4, label: "3:4" },
        { ratio: 9 / 16, label: "9:16" }
    ];

    // Find closest match
    let closest = aspectRatios[0];
    let minDiff = Math.abs(ratio - closest.ratio);

    for (const ar of aspectRatios) {
        const diff = Math.abs(ratio - ar.ratio);
        if (diff < minDiff) {
            minDiff = diff;
            closest = ar;
        }
    }

    // If difference is too large, return custom ratio
    if (minDiff > 0.1) {
        // Simplify to nearest common fraction
        if (ratio > 1) {
            return `${Math.round(ratio * 10) / 10}:1`;
        } else {
            return `1:${Math.round((1 / ratio) * 10) / 10}`;
        }
    }

    return closest.label;
}

/**
 * Get image dimensions from file
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number; aspectRatio: string }> {
    return new Promise((resolve, reject) => {
        // Validate input
        if (!file || typeof file !== 'object' || !file.type?.startsWith('image/')) {
            reject(new Error('Invalid file provided - must be an image File object'));
            return;
        }

        const img = new Image();
        let objectUrl: string;

        img.onload = () => {
            const aspectRatio = detectAspectRatio(img.width, img.height);
            resolve({
                width: img.width,
                height: img.height,
                aspectRatio
            });
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };

        img.onerror = () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
            reject(new Error('Failed to load image'));
        };

        try {
            objectUrl = URL.createObjectURL(file);
            img.src = objectUrl;
        } catch (error) {
            reject(new Error(`Failed to create object URL: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    });
}