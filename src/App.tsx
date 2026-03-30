/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Home } from '@/pages/Home';
import { About } from '@/pages/About';
import { Catalog } from '@/pages/Catalog';
import { Contact } from '@/pages/Contact';
import { AdminPortal } from '@/pages/AdminPortal';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';

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
      <div className="flex flex-col min-h-screen">
        <Navbar />
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
        <Footer />
      </div>
    </Router>
  );
}

