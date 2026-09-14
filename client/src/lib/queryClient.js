import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./apiClient.js";

/*
  A single QueryClient for the app.

  Retry policy: client errors (400-499) are never retried. A 401 means the
  session is gone, a 404 means the record does not exist and a 400 means the
  request was malformed — retrying any of them only delays the error state.
  Transport failures and 5xx/502 upstream failures are retried twice with
  backoff, which is what an intermittently reachable quote feed needs.
*/
function shouldRetry(failureCount, error) {
  if (failureCount >= 2) return false;
  if (error instanceof ApiError) {
    if (error.isNetworkError) return true;
    return error.status >= 500;
  }
  return false;
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        // Quotes and balances should never render a stale value as if it were
        // live, but we also do not want a spinner on every navigation.
        refetchOnReconnect: true
      },
      mutations: {
        retry: false
      }
    }
  });
}
