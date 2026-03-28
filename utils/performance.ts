import React from 'react';
import { InteractionManager, Platform } from 'react-native';

export class PerformanceUtils {
  // Run expensive operations after interactions complete
  static runAfterInteractions<T>(callback: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      InteractionManager.runAfterInteractions(() => {
        callback().then(resolve).catch(reject);
      });
    });
  }

  // Debounce function for performance
  static debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  // Throttle function for performance
  static throttle<T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Measure performance of a function
  static async measurePerformance<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();

    console.log(`${name} took ${end - start} milliseconds`);
    return result;
  }

  // Batch multiple operations
  static async batch<T>(
    operations: Array<() => Promise<T>>,
    batchSize: number = 5
  ): Promise<T[]> {
    const results: T[] = [];

    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(op => op()));
      results.push(...batchResults);

      // Allow UI to breathe between batches
      if (i + batchSize < operations.length) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    return results;
  }

  // Cache expensive computations
  static memoize<T extends (...args: unknown[]) => unknown>(
    fn: T,
    getKey?: (...args: Parameters<T>) => string,
    maxCacheSize: number = 500
  ): T {
    const cache = new Map<string, ReturnType<T>>();

    return ((...args: Parameters<T>) => {
      const key = getKey ? getKey(...args) : JSON.stringify(args);

      if (cache.has(key)) {
        // Move to end for LRU behavior
        const value = cache.get(key);
        cache.delete(key);
        cache.set(key, value!);
        return value;
      }

      const result = fn(...args);
      cache.set(key, result as ReturnType<T>);

      // Evict oldest entries when cache exceeds max size
      if (cache.size > maxCacheSize) {
        const firstKey = cache.keys().next().value;
        if (firstKey !== undefined) cache.delete(firstKey);
      }

      return result;
    }) as T;
  }

  // Lazy load expensive resources
  static lazyLoad<T>(factory: () => Promise<T>): () => Promise<T> {
    let instance: T | null = null;
    let loading: Promise<T> | null = null;

    return async () => {
      if (instance) return instance;

      if (loading) return loading;

      loading = factory();
      instance = await loading;
      return instance;
    };
  }

  // Check if device is low-end based on available memory
  static isLowEndDevice(): boolean {
    try {
      const Device = require('expo-device');
      // totalMemory is in bytes; consider < 3GB as low-end
      if (Device.totalMemory && Device.totalMemory < 3 * 1024 * 1024 * 1024) {
        return true;
      }
    } catch {
      // expo-device not available
    }
    return false;
  }

  // Performance monitoring
  static startPerformanceMonitor() {
    // Monitor key performance metrics
    if (typeof window !== 'undefined' && window.PerformanceObserver) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log(`Performance: ${entry.name} - ${entry.duration}ms`);
        }
      });

      observer.observe({ entryTypes: ['measure', 'navigation'] });

      return observer;
    }

    return null;
  }


  // Adjust quality based on device performance
  static getQualityForDevice(): 'low' | 'medium' | 'high' {
    if (this.isLowEndDevice()) {
      return 'low';
    }

    return 'high';
  }

  // Optimize animations based on device
  static getAnimationConfig() {
    const quality = this.getQualityForDevice();

    switch (quality) {
      case 'low':
        return {
          duration: 200,
          useNativeDriver: true,
          reduceMotion: true,
        };
      case 'medium':
        return {
          duration: 300,
          useNativeDriver: true,
          reduceMotion: false,
        };
      default:
        return {
          duration: 400,
          useNativeDriver: true,
          reduceMotion: false,
        };
    }
  }
}

// Performance hooks
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = React.useState<Record<string, number>>({});

  const measure = React.useCallback((name: string, duration: number) => {
    setMetrics(prev => ({
      ...prev,
      [name]: duration,
    }));
  }, []);

  const startMeasure = React.useCallback((name: string) => {
    if (typeof performance !== 'undefined') {
      const start = performance.now();

      return () => {
        const end = performance.now();
        measure(name, end - start);
      };
    }

    return () => { };
  }, [measure]);

  return { metrics, startMeasure };
};

// Memory monitoring — polls infrequently to avoid excessive re-renders
export const useMemoryMonitor = () => {
  const [memoryUsage, setMemoryUsage] = React.useState<number>(0);

  React.useEffect(() => {
    if (Platform.OS !== 'web') {
      setMemoryUsage(0);
      return;
    }

    const interval = setInterval(() => {
      interface PerformanceMemory {
        memory?: { usedJSHeapSize: number };
      }
      const perf = performance as unknown as PerformanceMemory;
      if (typeof performance !== 'undefined' && perf.memory) {
        const current = perf.memory.usedJSHeapSize;
        setMemoryUsage(prev => prev === current ? prev : current);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return memoryUsage;
};
