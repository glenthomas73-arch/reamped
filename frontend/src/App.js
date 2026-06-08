import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './AuthContext';
import Header from './components/Header';
import SearchPage from './pages/SearchPage';
import ListingPage from './pages/ListingPage';
import PricingPage from './pages/PricingPage';
import WatchlistPage from './pages/WatchlistPage';
import AlertsPage from './pages/AlertsPage';
import AccountPage from './pages/AccountPage';

const queryClient = new QueryClient({
      defaultOptions: { queries: { staleTime: 2 * 60 * 1000, retry: 1 } },
});

export default function App() {
      return (
              <AuthProvider>
                <QueryClientProvider client={queryClient}>
                  <Router>
                    <div className="app">
                      <Header />
                      <main className="main-content">
                        <Routes>
                          <Route path="/" element={<SearchPage />} />
                <Route path="/listing/:platform/:id" element={<ListingPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/watchlist" element={<WatchlistPage />} />
                <Route path="/alerts" element={<AlertsPage />} />
                <Route path="/account" element={<AccountPage />} />
    </Routes>
    </main>
    </div>
    </Router>
    </QueryClientProvider>
    </AuthProvider>
  );
}
