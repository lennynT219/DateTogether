import type { MemoryRepository } from '../../core/ports/MemoryRepository';
import type { Memory } from '../../core/entities/Memory';
import type { MemoryRow } from '../database/types';
import { getSupabaseClient } from '../database/SupabaseClient';

function mapMemoryRowToMemory(row: MemoryRow): Memory {
  return {
    id: row.id,
    dateId: row.date_id,
    imageUrl: row.image_url,
    location: row.location ?? undefined,
    note: row.note ?? undefined,
    createdBy: row.created_by ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

export class SupabaseMemoryRepository implements MemoryRepository {
  async findByDateId(dateId: string): Promise<Memory[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('date_id', dateId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map((row) => mapMemoryRowToMemory(row as MemoryRow));
  }

  async create(memory: Omit<Memory, 'id' | 'createdAt'>): Promise<Memory> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('memories')
      .insert({
        date_id: memory.dateId,
        image_url: memory.imageUrl,
        location: memory.location ?? null,
        note: memory.note ?? null,
        created_by: memory.createdBy ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return mapMemoryRowToMemory(data as MemoryRow);
  }

  async delete(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
