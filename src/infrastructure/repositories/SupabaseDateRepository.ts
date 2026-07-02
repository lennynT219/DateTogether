import type { DateRepository } from '../../core/ports/DateRepository';
import type { DateEntry } from '../../core/entities/DateEntry';
import type { Memory } from '../../core/entities/Memory';
import type { DateRow, MemoryRow } from '../database/types';
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

function mapDateRowToDateEntry(row: DateRow, memories: Memory[] = []): DateEntry {
  return {
    id: row.id,
    title: row.title ?? '',
    description: row.description ?? undefined,
    category: row.category,
    orderIndex: row.order_index,
    completed: row.completed,
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    completedBy: row.completed_by ?? undefined,
    memories,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class SupabaseDateRepository implements DateRepository {
  async findAll(): Promise<DateEntry[]> {
    const supabase = getSupabaseClient();
    const { data: dates, error } = await supabase
      .from('dates')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) throw error;
    if (!dates) return [];

    const { data: memories, error: memError } = await supabase
      .from('memories')
      .select('*');

    if (memError) throw memError;

    const memoriesByDate = new Map<string, Memory[]>();
    for (const mem of memories ?? []) {
      const mapped = mapMemoryRowToMemory(mem as MemoryRow);
      const list = memoriesByDate.get(mapped.dateId) ?? [];
      list.push(mapped);
      memoriesByDate.set(mapped.dateId, list);
    }

    return dates.map((row) =>
      mapDateRowToDateEntry(row as DateRow, memoriesByDate.get((row as DateRow).id) ?? [])
    );
  }

  async findById(id: string): Promise<DateEntry | null> {
    const supabase = getSupabaseClient();
    const { data: date, error } = await supabase
      .from('dates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    if (!date) return null;

    const { data: memories } = await supabase
      .from('memories')
      .select('*')
      .eq('date_id', id);

    const mappedMemories = (memories ?? []).map((m) => mapMemoryRowToMemory(m as MemoryRow));
    return mapDateRowToDateEntry(date as DateRow, mappedMemories);
  }

  async findByCategory(category: 'predefined' | 'free'): Promise<DateEntry[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('dates')
      .select('*')
      .eq('category', category)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return (data ?? []).map((row) => mapDateRowToDateEntry(row as DateRow));
  }

  async markAsCompleted(id: string, completedBy: string): Promise<DateEntry> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('dates')
      .update({ completed: true, completed_at: new Date().toISOString(), completed_by: completedBy })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapDateRowToDateEntry(data as DateRow);
  }

  async markAsIncomplete(id: string): Promise<DateEntry> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('dates')
      .update({ completed: false, completed_at: null, completed_by: null })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapDateRowToDateEntry(data as DateRow);
  }

  async getProgress(): Promise<{ completed: number; total: number }> {
    const supabase = getSupabaseClient();
    const { count: total, error: totalError } = await supabase
      .from('dates')
      .select('*', { count: 'exact', head: true });

    if (totalError) throw totalError;

    const { count: completed, error: compError } = await supabase
      .from('dates')
      .select('*', { count: 'exact', head: true })
      .eq('completed', true);

    if (compError) throw compError;

    return { completed: completed ?? 0, total: total ?? 0 };
  }
}
