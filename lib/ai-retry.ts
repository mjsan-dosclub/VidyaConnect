// Retry only temporary provider failures. The total provider time stays within
// the route budget, leaving time to persist extraction before Vercel's deadline.
export async function retryTransientAI<T>(operation: (timeoutMs: number) => Promise<T>, options: { delayMs?: number; budgetMs?: number } = {}) {
  const deadline = Date.now() + (options.budgetMs ?? 45000);
  for (let attempt = 0; ; attempt++) {
    try { return await operation(Math.max(1, Math.min(20000, deadline - Date.now()))); }
    catch (error) {
      const status = (error as { status?: number }).status;
      if (attempt >= 2 || ![502, 503, 504].includes(status ?? 0) || deadline - Date.now() < 2000) throw error;
      await new Promise(resolve => setTimeout(resolve, (options.delayMs ?? 350) * (attempt + 1)));
    }
  }
}
