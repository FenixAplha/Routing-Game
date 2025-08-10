// db/presets.ts
import { openDB, IDBPDatabase } from 'idb';
import { RunConfig } from '../calc/types';

interface PresetData {
  id: string;
  name: string;
  description: string;
  config: RunConfig;
  createdAt: string;
  isBuiltin?: boolean;
}

class PresetsDB {
  private db: IDBPDatabase | null = null;

  async init(): Promise<void> {
    // Use the same database as records
    this.db = await openDB('routing-viz', 1);
  }

  private async ensureDB(): Promise<IDBPDatabase> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  /**
   * Save a custom preset
   */
  async savePreset(preset: PresetData): Promise<void> {
    const db = await this.ensureDB();
    await db.put('presets', preset);
  }

  /**
   * Get all custom presets
   */
  async listPresets(): Promise<PresetData[]> {
    const db = await this.ensureDB();
    const presets = await db.getAll('presets');
    
    return presets.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Get a specific preset by ID
   */
  async getPreset(id: string): Promise<PresetData | undefined> {
    const db = await this.ensureDB();
    return db.get('presets', id);
  }

  /**
   * Delete a preset
   */
  async deletePreset(id: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete('presets', id);
  }

  /**
   * Clear all custom presets
   */
  async clearAllPresets(): Promise<void> {
    const db = await this.ensureDB();
    const tx = db.transaction('presets', 'readwrite');
    await tx.store.clear();
    await tx.done;
  }

  /**
   * Export presets as JSON
   */
  async exportJSON(): Promise<string> {
    const presets = await this.listPresets();
    return JSON.stringify({
      exported: new Date().toISOString(),
      version: '1.0',
      presets,
    }, null, 2);
  }

  /**
   * Import presets from JSON
   */
  async importJSON(jsonData: string): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;
    
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.presets || !Array.isArray(data.presets)) {
        throw new Error('Invalid preset data format');
      }
      
      for (const preset of data.presets) {
        try {
          // Validate preset structure
          if (!preset.id || !preset.name || !preset.config) {
            errors.push(`Invalid preset structure: ${preset.name || 'Unknown'}`);
            continue;
          }
          
          // Generate new ID to avoid conflicts
          const importedPreset: PresetData = {
            ...preset,
            id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            isBuiltin: false,
          };
          
          await this.savePreset(importedPreset);
          imported++;
        } catch (error) {
          errors.push(`Failed to import preset ${preset.name}: ${error}`);
        }
      }
    } catch (error) {
      errors.push(`Failed to parse JSON: ${error}`);
    }
    
    return { imported, errors };
  }

  /**
   * Create preset from configuration
   */
  createPresetFromConfig(
    name: string,
    description: string,
    config: RunConfig
  ): PresetData {
    return {
      id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      config: {
        ...config,
        id: `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      isBuiltin: false,
    };
  }

  /**
   * Duplicate an existing preset
   */
  async duplicatePreset(id: string, newName: string): Promise<PresetData | null> {
    const original = await this.getPreset(id);
    if (!original) return null;
    
    const duplicate = this.createPresetFromConfig(
      newName,
      `Copy of ${original.description}`,
      original.config
    );
    
    await this.savePreset(duplicate);
    return duplicate;
  }
}

// Singleton instance
export const presetsDB = new PresetsDB();

// Auto-initialize
presetsDB.init().catch(console.error);

export type { PresetData };
