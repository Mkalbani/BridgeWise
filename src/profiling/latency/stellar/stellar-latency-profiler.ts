export class StellarLatencyProfiler {
  private records: Map<string, number[]> = new Map();

  startOperation(operationName: string): number {
    const startTime = Date.now();
    return startTime;
  }

  endOperation(operationName: string, startTime: number): number {
    const endTime = Date.now();
    const latency = endTime - startTime;
    this.recordLatency(operationName, latency);
    return latency;
  }

  recordLatency(operationName: string, latency: number): void {
    if (!this.records.has(operationName)) {
      this.records.set(operationName, []);
    }
    const latencies = this.records.get(operationName)!;
    latencies.push(latency);
  }

  getLatencyReport(): Record<string, { count: number; average: number; min: number; max: number }> {
    const report: Record<string, { count: number; average: number; min: number; max: number }> = {};
    for (const [operationName, latencies] of this.records.entries()) {
      const sum = latencies.reduce((acc, val) => acc + val, 0);
      const min = Math.min(...latencies);
      const max = Math.max(...latencies);
      report[operationName] = {
        count: latencies.length,
        average: Number((sum / latencies.length).toFixed(2)),
        min,
        max,
      };
    }
    return report;
  }

  printReport(): void {
    const report = this.getLatencyReport();
    console.log('Stellar Latency Profile Report:');
    for (const [operationName, metrics] of Object.entries(report)) {
      console.log(`  ${operationName}:`);
      console.log(`    Count: ${metrics.count}`);
      console.log(`    Average Latency: ${metrics.average}ms`);
      console.log(`    Min Latency: ${metrics.min}ms`);
      console.log(`    Max Latency: ${metrics.max}ms`);
    }
  }

  clear(): void {
    this.records.clear();
  }
}

// Export a singleton instance for convenience
export const stellarLatencyProfiler = new StellarLatencyProfiler();