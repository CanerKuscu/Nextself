import { useMemo as useReactMemo, useRef } from 'react';

export function useCustomMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  options?: {
    equalityFn?: (a: T, b: T) => boolean;
  }
): T {
  const prevValueRef = useRef<T | undefined>(undefined);
  const prevDepsRef = useRef<React.DependencyList | undefined>(undefined);

  // Check if deps have changed
  const depsChanged = !prevDepsRef.current ||
    deps.length !== prevDepsRef.current.length ||
    deps.some((dep, i) => !Object.is(dep, prevDepsRef.current![i]));

  if (depsChanged) {
    const newValue = factory();

    if (options?.equalityFn && prevValueRef.current !== undefined) {
      // If custom equality says values are equal, keep old reference
      if (options.equalityFn(prevValueRef.current, newValue)) {
        prevDepsRef.current = deps;
        return prevValueRef.current;
      }
    }

    prevValueRef.current = newValue;
    prevDepsRef.current = deps;
  }

  return prevValueRef.current as T;
}
