// utils/queries/stats.ts
import { createClient } from '@/lib/supabase/server';

/**
 * Retrieves the total number of draws executed by the logged-in user 
 * within a custom number of trailing days.
 */
export async function getDrawStatsByPeriod(daysAgo: number = 30): Promise<number> {
  const supabase = await createClient();

  // 1. Grab current authenticated user context
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User context unavailable.");

  // 2. Calculate the target cutoff timestamp
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

  // 3. Query your live 'draw_usage_stats' table using Postgres filters
  const { count, error } = await supabase
    .from('draw_usage_stats')
    .select('*', { count: 'exact', head: true }) // Fast, efficient index counting
    .eq('user_id', user.id)
    .gte('event_timestamp', cutoffDate.toISOString());

  if (error) {
    console.error("Error fetching usage window:", error.message);
    return 0;
  }

  return count || 0;
}
