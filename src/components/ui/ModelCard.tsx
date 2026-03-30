import { motion } from 'framer-motion';
import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  image: string;
  title: string;
  subtitle?: string;
  category?: string;
  onClick?: () => void;
  className?: string;
}

export const ModelCard = ({ image, title, subtitle, category, onClick, className }: CardProps) => {
  return (
    <motion.div
      whileHover={{ y: -10 }}
      onClick={onClick}
      className={cn("group cursor-pointer overflow-hidden relative", className)}
    >
      <div className="aspect-[3/4] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="mt-4 space-y-1">
        <div className="flex justify-between items-end">
          <h3 className="text-xl font-serif tracking-tight">{title}</h3>
          {category && (
            <span className="text-[10px] uppercase tracking-widest text-brand-gray">
              {category}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-brand-gray font-light tracking-wide italic">
            {subtitle}
          </p>
        )}
      </div>
      <div className="absolute inset-0 bg-brand-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
        <span className="text-brand-ivory text-xs uppercase tracking-[0.3em] font-medium border-b border-brand-ivory pb-1">
          Ver Perfil
        </span>
      </div>
    </motion.div>
  );
};
