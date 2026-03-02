/**
 * Compress base64 image to reduce size
 * @param base64Image - Base64 encoded image string
 * @param maxWidth - Maximum width (default 800px)
 * @param quality - JPEG quality 0-1 (default 0.8)
 * @returns Compressed base64 image
 */
export async function compressBase64Image(
  base64Image: string,
  maxWidth: number = 800,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Skip if not a base64 image
    if (!base64Image.startsWith('data:image/')) {
      resolve(base64Image);
      return;
    }

    const img = new Image();
    img.onload = () => {
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      // Create canvas and compress
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Convert to JPEG with quality compression
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64Image;
  });
}

/**
 * Compress all images in projects array
 */
export async function compressProjectImages(projects: any[]): Promise<any[]> {
  if (!projects || !Array.isArray(projects)) return projects;

  return Promise.all(
    projects.map(async (project) => {
      if (project.image && project.image.startsWith('data:image/')) {
        return {
          ...project,
          image: await compressBase64Image(project.image, 800, 0.8),
        };
      }
      return project;
    })
  );
}

/**
 * Check if image data has changed (not just a reference)
 */
export function hasImageChanged(oldImage: string | undefined, newImage: string | undefined): boolean {
  // Both empty - no change
  if (!oldImage && !newImage) return false;
  
  // One is empty, other isn't - changed
  if (!oldImage || !newImage) return true;
  
  // Compare the actual data
  return oldImage !== newImage;
}
