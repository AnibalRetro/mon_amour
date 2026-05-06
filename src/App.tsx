/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Home } from '@/pages/Home';
import { About } from '@/pages/About';
import { Catalog } from '@/pages/Catalog';
import { Contact } from '@/pages/Contact';
import { AdminPortal } from '@/pages/AdminPortal';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useEffect } from 'react';

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.5 }}
  >
    {children}
  </motion.div>
);

export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

function AppLayout() {
  const location = useLocation();
  const hideChrome = location.pathname.startsWith('/admin');
  const showLogoutToast = new URLSearchParams(location.search).get('logout') === '1';
  useEffect(() => {
    if (!showLogoutToast) return;
    const timeout = window.setTimeout(() => window.history.replaceState({}, '', '/'), 2200);
    return () => window.clearTimeout(timeout);
  }, [showLogoutToast]);

  return (
    <div className="flex flex-col min-h-screen">
      {!hideChrome && <Navbar />}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
            <Route path="/nosotros" element={<PageWrapper><About /></PageWrapper>} />
            <Route path="/catalogo" element={<PageWrapper><Catalog /></PageWrapper>} />
            <Route path="/contacto" element={<PageWrapper><Contact /></PageWrapper>} />
            <Route path="/admin" element={<PageWrapper><AdminPortal /></PageWrapper>} />
          </Routes>
        </AnimatePresence>
      </main>
      {!hideChrome && <Footer />}
      {showLogoutToast && (
        <div className="fixed right-5 top-6 z-[90] bg-brand-black text-brand-ivory px-4 py-3 text-sm shadow-xl">
          Sesión cerrada correctamente.
        </div>
      )}
    </div>
  );
}
