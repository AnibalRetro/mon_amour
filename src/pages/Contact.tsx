import { useState } from 'react';
import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { db } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export const Contact = () => {
  const [formType, setFormType] = useState<'commercial' | 'applicant'>('commercial');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      await addDoc(collection(db, 'leads'), {
        ...data,
        type: formType,
        status: 'new',
        created_at: serverTimestamp(),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error("Error submitting lead:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-24 px-6 md:px-12 bg-brand-ivory min-h-screen">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24">
        {/* Left: Info */}
        <div className="space-y-16">
          <div className="space-y-6">
            <span className="text-xs uppercase tracking-[0.4em] text-brand-gold font-medium">Contacto</span>
            <h1 className="text-5xl md:text-7xl leading-tight">Hablemos de <br /> <span className="italic text-brand-gold">Tu Visión</span></h1>
            <p className="text-brand-gray text-lg font-light leading-relaxed max-w-md">
              Ya sea que busques el rostro perfecto para tu próxima campaña o desees unirte a nuestra exclusiva familia de talentos.
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex items-start space-x-6">
              <div className="w-12 h-12 bg-brand-black flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-brand-gold" />
              </div>
              <div>
                <h4 className="text-xs uppercase tracking-widest font-semibold mb-1">Email</h4>
                <p className="text-brand-gray font-light">contact@maisondegrace.com</p>
                <p className="text-brand-gray font-light">bookings@maisondegrace.com</p>
              </div>
            </div>
            <div className="flex items-start space-x-6">
              <div className="w-12 h-12 bg-brand-black flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-brand-gold" />
              </div>
              <div>
                <h4 className="text-xs uppercase tracking-widest font-semibold mb-1">Teléfono</h4>
                <p className="text-brand-gray font-light">+33 1 23 45 67 89</p>
                <p className="text-brand-gray font-light">+33 6 98 76 54 32</p>
              </div>
            </div>
            <div className="flex items-start space-x-6">
              <div className="w-12 h-12 bg-brand-black flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-brand-gold" />
              </div>
              <div>
                <h4 className="text-xs uppercase tracking-widest font-semibold mb-1">Oficina</h4>
                <p className="text-brand-gray font-light">Avenue Montaigne, 75008</p>
                <p className="text-brand-gray font-light">Paris, Francia</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="bg-white p-8 md:p-16 premium-shadow space-y-10">
          <div className="flex border-b border-brand-black/5">
            <button 
              onClick={() => setFormType('commercial')}
              className={cn(
                "flex-1 pb-4 text-[10px] uppercase tracking-[0.2em] font-medium transition-all",
                formType === 'commercial' ? "text-brand-gold border-b-2 border-brand-gold" : "text-brand-gray"
              )}
            >
              Contacto Comercial
            </button>
            <button 
              onClick={() => setFormType('applicant')}
              className={cn(
                "flex-1 pb-4 text-[10px] uppercase tracking-[0.2em] font-medium transition-all",
                formType === 'applicant' ? "text-brand-gold border-b-2 border-brand-gold" : "text-brand-gray"
              )}
            >
              Unirse a la Agencia
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-brand-gray">Nombre Completo</label>
                <input required name="name" type="text" className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold transition-colors font-light" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-brand-gray">Email</label>
                <input required name="email" type="email" className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold transition-colors font-light" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-brand-gray">Teléfono</label>
                <input name="phone" type="tel" className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold transition-colors font-light" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-brand-gray">Ciudad</label>
                <input name="city" type="text" className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold transition-colors font-light" />
              </div>
            </div>

            {formType === 'commercial' ? (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-brand-gray">Empresa</label>
                  <input name="company" type="text" className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold transition-colors font-light" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-brand-gray">Tipo de Servicio</label>
                  <select name="service_type" className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold transition-colors font-light bg-transparent">
                    <option>Campaña Publicitaria</option>
                    <option>Sesión Fotográfica</option>
                    <option>Pasarela / Evento</option>
                    <option>Branding / Imagen</option>
                    <option>Otro</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-brand-gray">Estatura (cm)</label>
                    <input name="height" type="text" className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold transition-colors font-light" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-brand-gray">Edad</label>
                    <input name="age" type="text" className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold transition-colors font-light" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-brand-gray">Enlace a Portafolio / Redes</label>
                  <input name="portfolio_url" type="url" className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold transition-colors font-light" />
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-brand-gray">Mensaje</label>
              <textarea name="message" rows={4} className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold transition-colors font-light resize-none" />
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-brand-ivory border-t-transparent rounded-full animate-spin" />
              ) : success ? (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>Enviado con éxito</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>Enviar Solicitud</span>
                  <Send className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
