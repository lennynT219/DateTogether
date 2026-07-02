export interface DateRow {
  id: string;
  title: string | null;
  description: string | null;
  category: 'predefined' | 'free';
  order_index: number;
  completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemoryRow {
  id: string;
  date_id: string;
  image_url: string;
  location: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
}
