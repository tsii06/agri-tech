/* eslint-disable react/prop-types */
// providers/QueryProvider.jsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 15, // 5min avant considéré "stale"
      gcTime: 1000 * 60 * 30, // 30min en cache
      retry: 1, // 1 seul retry
      refetchOnWindowFocus: false, // Pas de refetch au focus
      refetchOnReconnect: true, // Refetch si reconnexion
    },
    mutations: {
      retry: 0, // Pas de retry sur mutations
    },
  },
});

export function QueryProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Afficher l'interface dev de React query dans le browser */}
      <ReactQueryDevtools initialIsOpen={false} /> 
    </QueryClientProvider>
  );
}
