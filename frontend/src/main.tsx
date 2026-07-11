import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App.tsx';

// Create a single QueryClient instance for the entire app.
// This manages all server state caching, refetching, and loading states.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't retry failed requests automatically —
      // a 401 or 404 should stay failed, not retry 3 times.
      retry: false,
      // Keep data fresh for 5 minutes before refetching.
      staleTime: 5 * 60 * 1000,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* BrowserRouter enables client-side routing (/shop, /admin, /login) */}
    <BrowserRouter>
      {/* QueryClientProvider makes React Query available to every component */}
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);