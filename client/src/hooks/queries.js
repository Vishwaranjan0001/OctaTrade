import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { useMemo } from "react";

import { loginRequest, meRequest, registerRequest } from "../api/auth.js";
import { fetchHoldings } from "../api/portfolio.js";
import { fetchQuote } from "../api/quotes.js";
import { fetchOrder, fetchOrders, placeOrderRequest } from "../api/orders.js";
import {
  depositRequest,
  fetchWallet,
  fetchWalletTransactions
} from "../api/wallet.js";
import { ApiError } from "../lib/apiClient.js";
import { isNum, normaliseSymbol } from "../lib/format.js";
import { useAuthStore } from "../store/authStore.js";

/* Central key registry so invalidation is never guesswork. */
export const queryKeys = {
  me: ["auth", "me"],
  wallet: ["wallet"],
  walletTransactions: ["wallet", "transactions"],
  holdings: ["portfolio", "holdings"],
  orders: ["orders"],
  order: (orderId) => ["orders", orderId],
  quote: (symbol) => ["quote", normaliseSymbol(symbol)]
};

/* ------------------------------------------------------------------ auth */

/**
 * The authenticated user from GET /api/auth/me.
 * Only runs when a bearer token exists. A 401 clears the session through the
 * apiClient handler, so this query is also the session validity check.
 */
export function useMe() {
  const hasSession = useAuthStore((state) => state.hasSession);

  return useQuery({
    queryKey: queryKeys.me,
    queryFn: ({ signal }) => meRequest({ signal }),
    enabled: hasSession,
    staleTime: 5 * 60_000,
    retry: false
  });
}

/**
 * Real login. On success stores the bearer token and seeds the `me` cache
 * from the login response so the dashboard renders without a second request.
 */
export function useLoginMutation() {
  const queryClient = useQueryClient();
  const signIn = useAuthStore((state) => state.signIn);

  return useMutation({
    mutationFn: (credentials) => loginRequest(credentials),
    onSuccess: (data) => {
      signIn(data?.token);
      if (data?.user) queryClient.setQueryData(queryKeys.me, data.user);
    }
  });
}

/**
 * Real registration.
 * POST /api/auth/register returns 201 { id, name, email } with NO token, so
 * this mutation chains a real POST /api/auth/login with the same credentials
 * to establish the session. Both calls hit the live API; nothing is faked.
 */
export function useRegisterMutation() {
  const queryClient = useQueryClient();
  const signIn = useAuthStore((state) => state.signIn);

  return useMutation({
    mutationFn: async ({ name, email, password }) => {
      const created = await registerRequest({ name, email, password });

      /* The account now exists. If the follow-up login fails we must not
         report "registration failed" — the user would try again and hit
         409 Email is already registered. Flag it so the form can send them
         to sign in instead. */
      let session;
      try {
        session = await loginRequest({ email, password });
      } catch (error) {
        error.accountCreated = true;
        throw error;
      }

      return { created, session };
    },
    onSuccess: ({ session }) => {
      signIn(session?.token);
      if (session?.user) queryClient.setQueryData(queryKeys.me, session.user);
    }
  });
}

/* ---------------------------------------------------------------- wallet */

export function useWallet(options = {}) {
  const hasSession = useAuthStore((state) => state.hasSession);

  return useQuery({
    queryKey: queryKeys.wallet,
    queryFn: ({ signal }) => fetchWallet({ signal }),
    enabled: hasSession && options.enabled !== false
  });
}

export function useWalletTransactions(options = {}) {
  const hasSession = useAuthStore((state) => state.hasSession);

  return useQuery({
    queryKey: queryKeys.walletTransactions,
    queryFn: ({ signal }) => fetchWalletTransactions({ signal }),
    enabled: hasSession && options.enabled !== false
  });
}

/**
 * Deposit virtual funds. Takes integer paise because that is what the
 * controller validates; the form converts rupees before calling.
 */
export function useDepositMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (amountPaise) => depositRequest(amountPaise),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet });
      queryClient.invalidateQueries({ queryKey: queryKeys.walletTransactions });
    }
  });
}

/* ------------------------------------------------------------- portfolio */

export function useHoldings(options = {}) {
  const hasSession = useAuthStore((state) => state.hasSession);

  return useQuery({
    queryKey: queryKeys.holdings,
    queryFn: ({ signal }) => fetchHoldings({ signal }),
    enabled: hasSession && options.enabled !== false
  });
}

/* ---------------------------------------------------------------- quotes */

/** Shared options object so single and batched quote reads stay consistent. */
export function quoteQueryOptions(symbol, { enabled = true } = {}) {
  const normalised = normaliseSymbol(symbol);
  return {
    queryKey: queryKeys.quote(normalised),
    queryFn: ({ signal }) => fetchQuote(normalised, { signal }),
    enabled: Boolean(normalised) && enabled,
    // A quote is a live value: keep it briefly, then refetch on demand.
    staleTime: 15_000,
    gcTime: 60_000
  };
}

export function useQuote(symbol, options) {
  return useQuery(quoteQueryOptions(symbol, options));
}

/** Batched quotes for a symbol list (watchlist, holdings valuation). */
export function useQuotes(symbols, { enabled = true } = {}) {
  const list = useMemo(
    () => Array.from(new Set((symbols || []).map(normaliseSymbol).filter(Boolean))),
    [symbols]
  );

  const results = useQueries({
    queries: list.map((symbol) => quoteQueryOptions(symbol, { enabled }))
  });

  /* Map symbol -> { price, currency, isLoading, error } for easy lookup. */
  return useMemo(() => {
    const bySymbol = new Map();
    list.forEach((symbol, index) => {
      const result = results[index];
      bySymbol.set(symbol, {
        symbol,
        price: isNum(result?.data?.price) ? result.data.price : null,
        currency: result?.data?.currency ?? null,
        isLoading: Boolean(result?.isLoading),
        isFetching: Boolean(result?.isFetching),
        error: result?.error ?? null,
        refetch: result?.refetch
      });
    });
    return {
      bySymbol,
      isLoading: results.some((result) => result.isLoading),
      isFetching: results.some((result) => result.isFetching),
      refetchAll: () => results.forEach((result) => result.refetch?.())
    };
  }, [list, results]);
}

/* ---------------------------------------------------------------- orders */

export function useOrders(options = {}) {
  const hasSession = useAuthStore((state) => state.hasSession);

  return useQuery({
    queryKey: queryKeys.orders,
    queryFn: ({ signal }) => fetchOrders({ signal }),
    enabled: hasSession && options.enabled !== false
  });
}

export function useOrder(orderId, options = {}) {
  const hasSession = useAuthStore((state) => state.hasSession);

  return useQuery({
    queryKey: queryKeys.order(orderId),
    queryFn: ({ signal }) => fetchOrder(orderId, { signal }),
    enabled: hasSession && Boolean(orderId) && options.enabled !== false
  });
}

/**
 * Places a real order. Every account surface the order touches is
 * invalidated: wallet balances, the ledger, holdings and the order list.
 */
export function usePlaceOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => placeOrderRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet });
      queryClient.invalidateQueries({ queryKey: queryKeys.walletTransactions });
      queryClient.invalidateQueries({ queryKey: queryKeys.holdings });
    }
  });
}

/* ------------------------------------------------------- derived analytics */

/**
 * Joins cost-basis holdings from /api/portfolio with live prices from
 * /api/quotes/:symbol to produce portfolio valuation.
 *
 * Honesty rules encoded here:
 *   - Invested cost is always exact: it comes straight from the API.
 *   - Market value, P&L and return % are computed ONLY over holdings whose
 *     quote actually resolved. `pricedCount` / `unpricedSymbols` are returned
 *     so the UI can disclose partial coverage instead of presenting an
 *     understated total as complete.
 *   - Nothing is estimated, carried forward or defaulted to the buy price.
 *
 * @returns {{
 *   holdings: Array, rows: Array, investedPaise: number|null,
 *   marketValuePaise: number|null, unrealisedPaise: number|null,
 *   returnPct: number|null, pricedCount: number, totalCount: number,
 *   unpricedSymbols: string[], isLoading: boolean, isFetching: boolean,
 *   error: Error|null, refetch: Function
 * }}
 */
export function usePortfolioValuation() {
  const holdingsQuery = useHoldings();
  const holdings = holdingsQuery.data ?? [];

  const symbols = useMemo(
    () => holdings.map((holding) => holding.symbol),
    [holdings]
  );

  const quotes = useQuotes(symbols, { enabled: holdings.length > 0 });

  return useMemo(() => {
    const rows = holdings.map((holding) => {
      const quote = quotes.bySymbol.get(normaliseSymbol(holding.symbol));
      const quantity = isNum(holding.quantity) ? holding.quantity : 0;
      const investedPaise = quantity * (holding.averageBuyPricePaise || 0);

      // Quote price is in rupees; holdings are in paise.
      const lastPricePaise = isNum(quote?.price)
        ? Math.round(quote.price * 100)
        : null;

      const marketValuePaise =
        lastPricePaise === null ? null : Math.round(quantity * lastPricePaise);

      const unrealisedPaise =
        marketValuePaise === null ? null : marketValuePaise - investedPaise;

      const returnPct =
        unrealisedPaise === null || investedPaise === 0
          ? null
          : (unrealisedPaise / investedPaise) * 100;

      return {
        id: holding._id || holding.id || holding.symbol,
        symbol: holding.symbol,
        quantity,
        averageBuyPricePaise: holding.averageBuyPricePaise ?? null,
        investedPaise,
        lastPricePaise,
        marketValuePaise,
        unrealisedPaise,
        returnPct,
        currency: quote?.currency ?? null,
        quoteError: quote?.error ?? null,
        isQuoteLoading: Boolean(quote?.isLoading),
        updatedAt: holding.updatedAt ?? null
      };
    });

    const investedPaise = rows.reduce((sum, row) => sum + row.investedPaise, 0);

    const priced = rows.filter((row) => row.marketValuePaise !== null);
    const pricedCount = priced.length;

    const marketValuePaise = pricedCount
      ? priced.reduce((sum, row) => sum + row.marketValuePaise, 0)
      : null;

    /* P&L is only meaningful against the invested cost of the SAME subset of
       holdings we could price, otherwise the percentage is nonsense. */
    const pricedInvestedPaise = priced.reduce(
      (sum, row) => sum + row.investedPaise,
      0
    );

    const unrealisedPaise =
      marketValuePaise === null ? null : marketValuePaise - pricedInvestedPaise;

    const returnPct =
      unrealisedPaise === null || pricedInvestedPaise === 0
        ? null
        : (unrealisedPaise / pricedInvestedPaise) * 100;

    return {
      holdings,
      rows,
      investedPaise: holdings.length ? investedPaise : null,
      pricedInvestedPaise: pricedCount ? pricedInvestedPaise : null,
      marketValuePaise,
      unrealisedPaise,
      returnPct,
      pricedCount,
      totalCount: rows.length,
      unpricedSymbols: rows
        .filter((row) => row.marketValuePaise === null)
        .map((row) => row.symbol),
      isLoading: holdingsQuery.isLoading,
      isFetching: holdingsQuery.isFetching || quotes.isFetching,
      error: holdingsQuery.error ?? null,
      refetch: () => {
        holdingsQuery.refetch();
        quotes.refetchAll();
      }
    };
  }, [holdings, quotes, holdingsQuery]);
}

/** Re-exported so pages can branch on error kind without importing the lib. */
export { ApiError };
