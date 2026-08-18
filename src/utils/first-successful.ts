export async function firstSuccessful<T>(
  attempts: Array<() => Promise<T | null>>
): Promise<T | null> {
  for (const attempt of attempts) {
    try {
      const value = await attempt();
      if (value) return value;
    } catch {
      continue;
    }
  }
  return null;
}
