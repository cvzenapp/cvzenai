import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';

/**
 * Dataset Loader - Loads and caches CSV datasets for prompt optimization
 */
class DatasetLoader {
  private cache: Map<string, any[]> = new Map();
  private datasetPath = path.join(process.cwd(), 'server', 'data_sets');

  /**
   * Load a CSV dataset
   */
  async loadDataset(filename: string): Promise<any[]> {
    if (this.cache.has(filename)) {
      return this.cache.get(filename)!;
    }

    try {
      const filePath = path.join(this.datasetPath, filename);
      const content = await fs.readFile(filePath, 'utf-8');
      
      const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      this.cache.set(filename, records);
      console.log(`✅ Loaded dataset: ${filename} (${records.length} records)`);
      
      return records;
    } catch (error) {
      console.error(`❌ Failed to load dataset ${filename}:`, error.message);
      return [];
    }
  }

  /**
   * Extract unique values from a column
   */
  extractUniqueValues(records: any[], column: string): string[] {
    const values = new Set<string>();
    
    records.forEach(record => {
      const value = record[column];
      if (value && typeof value === 'string') {
        // Split by common delimiters
        const items = value.split(/[,;|\/]/).map(v => v.trim()).filter(v => v);
        items.forEach(item => values.add(item));
      }
    });

    return Array.from(values).sort();
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

export const datasetLoader = new DatasetLoader();
