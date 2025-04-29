import { supabase } from "../supabaseClient";
import toast from 'react-hot-toast';


export async function fetchFromSupabase<T>(table: string): Promise<T[] | null> {
  const { data, error } = await supabase.from(table).select('*');
  if (error) {
    console.error(`Error fetching from ${table}:`, error.message);
    toast.error(`Failed to fetch from ${table}`);
    return null;
  }
  return data as T[];
}


export async function insertToSupabase<T>(table: string, record: T): Promise<boolean> {
  const { error } = await supabase.from(table).insert(record);
  if (error) {
    console.error(`Error inserting into ${table}:`, error.message);
    toast.error(`Failed to insert into ${table}`);
    return false;
  }
  toast.success('Data inserted successfully!');
  return true;
}

export async function updateSupabaseRecord<T>(
  table: string,
  matchKey: string,
  matchValue: any,
  newData: Partial<T>
): Promise<boolean> {
  const { error } = await supabase.from(table).update(newData).eq(matchKey, matchValue);
  if (error) {
    console.error(`Error updating ${table}:`, error.message);
    toast.error(`Failed to update ${table}`);
    return false;
  }
  toast.success('Data updated successfully!');
  return true;
}
