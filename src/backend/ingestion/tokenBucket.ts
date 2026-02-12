export class TokenBucket {
  private capacity: number;
  private refillPerSecond: number;
  private tokens: number;
  private lastRefillMs: number;

  constructor(config: {
    capacity: number;
    refillPerSecond: number;
    initialTokens?: number;
    initialTimeMs?: number;
  }) {
    this.capacity = Math.max(1, Math.floor(config.capacity));
    this.refillPerSecond = Math.max(0, config.refillPerSecond);
    this.tokens = Math.min(this.capacity, config.initialTokens ?? this.capacity);
    this.lastRefillMs = config.initialTimeMs ?? Date.now();
  }

  available(nowMs = Date.now()) {
    this.refill(nowMs);
    return this.tokens;
  }

  consume(amount = 1, nowMs = Date.now()): boolean {
    const required = Math.max(0, amount);
    this.refill(nowMs);
    if (this.tokens < required) {
      return false;
    }
    this.tokens -= required;
    return true;
  }

  private refill(nowMs: number) {
    if (nowMs <= this.lastRefillMs) {
      return;
    }

    const elapsedSeconds = (nowMs - this.lastRefillMs) / 1000;
    const refillAmount = elapsedSeconds * this.refillPerSecond;
    if (refillAmount > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + refillAmount);
      this.lastRefillMs = nowMs;
    }
  }
}
