export function recordMetric(name: string, value: number, tags: Record<string, string> = {}): void {
  console.log(
    JSON.stringify({
      type: 'metric',
      name,
      value,
      tags,
      at: new Date().toISOString(),
    }),
  );
}
