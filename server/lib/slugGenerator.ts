import crypto from 'crypto';

/**
 * Generate a unique slug from a name
 * Format: lowercase-name-with-random-suffix
 * Example: "Alex Morgan" -> "john-doe-a1b2c3"
 */
export function generateSlug(name: string): string {
  // Clean and normalize the name
  const cleanName = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .substring(0, 50); // Limit length

  // Generate random suffix for uniqueness
  const randomSuffix = crypto.randomBytes(4).toString('hex');

  return `${cleanName}-${randomSuffix}`;
}

/**
 * Check if a slug already exists in the database
 */
export async function isSlugUnique(db: any, slug: string): Promise<boolean> {
  const result = await db.query(
    'SELECT 1 FROM resume_shares WHERE share_token = $1 LIMIT 1',
    [slug]
  );
  return result.rows.length === 0;
}

/**
 * Generate a guaranteed unique slug
 */
export async function generateUniqueSlug(db: any, name: string): Promise<string> {
  let slug = generateSlug(name);
  let attempts = 0;
  const maxAttempts = 10;

  while (!await isSlugUnique(db, slug) && attempts < maxAttempts) {
    slug = generateSlug(name);
    attempts++;
  }

  if (attempts >= maxAttempts) {
    // Fallback: add timestamp
    slug = `${slug}-${Date.now()}`;
  }

  return slug;
}
