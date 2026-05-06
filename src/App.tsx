/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import React, { Suspense, lazy, useEffect } from 'react';

const Home = lazy(() => import('@/pages/Home').then((module) => ({ default: module.Home })));
const About = lazy(() => import('@/pages/About').then((module) => ({ default: module.About })));
const Catalog = lazy(() => import('@/pages/Catalog').then((module) => ({ default: module.Catalog })));
const Contact = lazy(() => import('@/pages/Contact').then((module) => ({ default: module.Contact })));
const AdminPortal = lazy(() => import('@/pages/AdminPortal').then((module) => ({ default: module.AdminPortal })));

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

const PageFallback = () => (
  <div className="flex min-h-[40vh] items-center justify-center text-sm text-brand-charcoal/70">
    Cargando…
  </div>
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
        <Suspense fallback={<PageFallback />}>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
              <Route path="/nosotros" element={<PageWrapper><About /></PageWrapper>} />
              <Route path="/catalogo" element={<PageWrapper><Catalog /></PageWrapper>} />
              <Route path="/contacto" element={<PageWrapper><Contact /></PageWrapper>} />
              <Route path="/admin" element={<PageWrapper><AdminPortal /></PageWrapper>} />
            </Routes>
          </AnimatePresence>
        </Suspense>
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
