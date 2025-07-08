// hooks/useApiCache.ts - Simple but effective API caching hook
import { useState, useCallback } from 'react';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export const useApiCache = () => {
  const [cache] = useState<Map<string, CacheItem<any>>>(new Map());

  const get = useCallback(<T>(key: string, ttlMinutes: number = 5): T | null => {
    const item = cache.get(key);
    if (!item) return null;
    
    const isExpired = Date.now() - item.timestamp > ttlMinutes * 60 * 1000;
    if (isExpired) {
      cache.delete(key);
      return null;
    }
    
    return item.data;
  }, [cache]);

  const set = useCallback(<T>(key: string, data: T, ttlMinutes: number = 5) => {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }, [cache]);

  const invalidate = useCallback((key: string) => {
    cache.delete(key);
  }, [cache]);

  const clear = useCallback(() => {
    cache.clear();
  }, [cache]);

  return { get, set, invalidate, clear };
};

// Rate limiter for API calls
export class APIRateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 30, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return this.requests.length < this.maxRequests;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  getTimeUntilNextRequest(): number {
    if (this.canMakeRequest()) return 0;
    const oldestRequest = Math.min(...this.requests);
    return this.windowMs - (Date.now() - oldestRequest);
  }
}

export const finnhubRateLimiter = new APIRateLimiter(30, 60000); // 30 requests per minute