import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from './components/Header';
import SearchPage from './pages/SearchPage';
import ListingPage from './pages/ListingPage';
import PricingPage from './pages/PricingPage';

const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 2 * 60 * 1000, retry: 1 } },
});

export default function App() {
    return (
          <QueryClientProvider client={queryClient}>
            <Router>
              <div className="app">
                <Header />
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<SearchPage />} />
              <Route path="/listing/:platform/:id" element={<ListingPage />} />
              <Route path="/pricing" element={<PricingPage />} />
  </Routes>
  </main>
  </div>
  </Router>
  </QueryClientProvider>
  );
}
