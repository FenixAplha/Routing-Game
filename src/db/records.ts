// db/records.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { RunRecord } from '../calc/types';

interface RoutingVizDB extends DBSchema {
  records: {
    key: string;
    value: RunRecord;
    indexes: { 'by-date': string };
  };
  presets: {
    key: string;
    value: {
      id: string;
      name: string;
      description: string;
      config: any;
      createdAt: string;
    };
  };
}

class RecordsDB {
  private db: IDBPDatabase<RoutingVizDB> | null = null;
  private readonly MAX_RECORDS = 50;

  async init(): Promise<void> {
    this.db = await openDB<RoutingVizDB>('routing-viz', 1, {
      upgrade(db) {
        // Records store
        const recordStore = db.createObjectStore('records', { keyPath: 'id' });
        recordStore.createIndex('by-date', 'startedAt');
        
        // Presets store
        db.createObjectStore('presets', { keyPath: 'id' });
      },
    });
  }

  private async ensureDB(): Promise<IDBPDatabase<RoutingVizDB>> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  /**
   * Save a run record
   */
  async saveRecord(record: RunRecord): Promise<void> {
    const db = await this.ensureDB();
    
    // Add the new record
    await db.put('records', record);
    
    // Prune old records if we exceed the limit
    await this.pruneOldRecords();
  }

  /**
   * Get all records, newest first
   */
  async listRecords(limit = this.MAX_RECORDS): Promise<RunRecord[]> {
    const db = await this.ensureDB();
    const records = await db.getAllFromIndex('records', 'by-date');
    
    // Sort newest first and limit
    return records
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .slice(0, limit);
  }

  /**
   * Get a specific record by ID
   */
  async getRecord(id: string): Promise<RunRecord | undefined> {
    const db = await this.ensureDB();
    return db.get('records', id);
  }

  /**
   * Delete a record
   */
  async deleteRecord(id: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete('records', id);
  }

  /**
   * Clear all records
   */
  async clearAllRecords(): Promise<void> {
    const db = await this.ensureDB();
    const tx = db.transaction('records', 'readwrite');
    await tx.store.clear();
    await tx.done;
  }

  /**
   * Prune old records to maintain limit
   */
  private async pruneOldRecords(): Promise<void> {
    const db = await this.ensureDB();
    const records = await db.getAllFromIndex('records', 'by-date');
    
    if (records.length <= this.MAX_RECORDS) return;
    
    // Sort by date (oldest first) and remove excess
    const sortedRecords = records.sort(
      (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
    );
    
    const toDelete = sortedRecords.slice(0, records.length - this.MAX_RECORDS);
    const tx = db.transaction('records', 'readwrite');
    
    for (const record of toDelete) {
      await tx.store.delete(record.id);
    }
    
    await tx.done;
  }

  /**
   * Export records as JSON
   */
  async exportJSON(): Promise<string> {
    const records = await this.listRecords();
    return JSON.stringify({
      exported: new Date().toISOString(),
      version: '1.0',
      records,
    }, null, 2);
  }

  /**
   * Export records as CSV
   */
  async exportCSV(): Promise<string> {
    const records = await this.listRecords();
    
    if (records.length === 0) {
      return 'No records to export';
    }
    
    // CSV headers
    const headers = [
      'ID',
      'Started At',
      'Duration (s)',
      'Forwards',
      'Returns',
      'Tokens Prompt',
      'Tokens Completion', 
      'Tokens Total',
      'Model Cost (USD)',
      'Commission (USD)',
      'Energy (Wh)',
      'CO2e (kg)',
      'Phone Charges',
      'Household Hours',
    ];
    
    // Convert records to CSV rows
    const rows = records.map(record => [
      record.id,
      record.startedAt,
      record.durationSeconds,
      record.forwards,
      record.returns,
      record.tokensPrompt,
      record.tokensCompletion,
      record.tokensTotal,
      record.modelCostUSD.toFixed(4),
      record.commissionUSD.toFixed(4),
      record.energyWh.toFixed(2),
      record.co2eKg.toFixed(4),
      record.phoneCharges.toFixed(1),
      record.householdHours.toFixed(1),
    ]);
    
    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    return csvContent;
  }

  /**
   * Get storage usage stats
   */
  async getStats(): Promise<{
    recordCount: number;
    presetCount: number;
    oldestRecord?: string;
    newestRecord?: string;
  }> {
    const db = await this.ensureDB();
    
    const records = await db.getAllFromIndex('records', 'by-date');
    const presets = await db.getAll('presets');
    
    let oldestRecord: string | undefined;
    let newestRecord: string | undefined;
    
    if (records.length > 0) {
      const sorted = records.sort(
        (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
      );
      oldestRecord = sorted[0].startedAt;
      newestRecord = sorted[sorted.length - 1].startedAt;
    }
    
    return {
      recordCount: records.length,
      presetCount: presets.length,
      oldestRecord,
      newestRecord,
    };
  }
}

// Singleton instance
export const recordsDB = new RecordsDB();

// Auto-initialize on first import
recordsDB.init().catch(console.error);
