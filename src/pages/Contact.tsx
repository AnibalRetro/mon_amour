
import { useEffect, useMemo, useState } from 'react';
import React from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { db } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';

const modelOptions = [
  'Amélie Laurent',
  'Isabella Rossi',
  'Elena Vance',
  'Sofia Méndez',
  'Consulta general',
];

export const Contact = () => {
  const queryParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const requestedType = queryParams.get('type');
  const requestedModel = queryParams.get('model');

  const [formType, setFormType] = useState<'commercial' | 'applicant'>(
    requestedType === 'applicant' ? 'applicant' : 'commercial',
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [selectedModel, setSelectedModel] = useState(requestedModel || '');

  useEffect(() => {
    if (requestedType === 'applicant') {
      setFormType('applicant');
    }
  }, [requestedType]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      await addDoc(collection(db, 'leads'), {
        ...data,
        model_interest: selectedModel,
        type: formType,
        stage: 'new',
        status: 'new',
        origin_form: formType === 'commercial' ? 'contacto_comercial' : 'postulacion_agencia',
        archived: false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      setSuccess(formType === 'commercial' ? 'Tu mensaje fue enviado correctamente. Nuestro equipo te contactará a la brevedad.' : 'Tu postulación fue enviada correctamente. Mon Amour revisará tu información muy pronto.');
      setTimeout(() => setSuccess(''), 5000);
      (e.target as HTMLFormElement).reset();
      setSelectedModel(requestedModel || '');
    } catch (error) {
      console.error('Error submitting lead:', error);
      setSuccess('No fue posible enviar la información. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-24 px-6 md:px-12 bg-brand-ivory min-h-screen">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24">
        <div className="space-y-16">
          <div className="space-y-6">
            <span className="text-xs uppercase tracking-[0.4em] text-brand-gold font-medium">Contacto Mon Amour</span>
            <h1 className="text-5xl md:text-7xl leading-tight">Hablemos de <br /> <span className="italic text-brand-gold">Tu Próximo Proyecto</span></h1>
            <p className="text-brand-gray text-lg font-light leading-relaxed max-w-md">
              Ya sea que busques talento para una producción, una activación, una campaña o desees unirte a nuestra agencia, aquí podrás dejar tus datos y dar seguimiento profesional a tu solicitud.
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex items-start space-x-6">
              <div className="w-12 h-12 bg-brand-black flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-brand-gold" />
              </div>
              <div>
                <h4 className="text-xs uppercase tracking-widest font-semibold mb-1">Email</h4>
                <p className="text-brand-gray font-light">contacto@monamour.com</p>
                <p className="text-brand-gray font-light">bookings@monamour.com</p>
              </div>
            </div>
            <div className="flex items-start space-x-6">
              <div className="w-12 h-12 bg-brand-black flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-brand-gold" />
              </div>
              <div>
                <h4 className="text-xs uppercase tracking-widest font-semibold mb-1">Teléfono</h4>
                <p className="text-brand-gray font-light">+52 55 0000 0000</p>
                <p className="text-brand-gray font-light">+52 55 0000 1111</p>
              </div>
            </div>
            <div className="flex items-start space-x-6">
              <div className="w-12 h-12 bg-brand-black flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-brand-gold" />
              </div>
              <div>
                <h4 className="text-xs uppercase tracking-widest font-semibold mb-1">Oficina</h4>
                <p className="text-brand-gray font-light">Ciudad de México</p>
                <p className="text-brand-gray font-light">Atención con cita previa</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 md:p-16 premium-shadow space-y-10">
          <div className="flex border-b border-brand-black/5">
            <button
              onClick={() => setFormType('commercial')}
              className={cn(
                'flex-1 pb-4 text-[10px] uppercase tracking-[0.2em] font-medium transition-all',
                formType === 'commercial' ? 'text-brand-gold border-b-2 border-brand-gold' : 'text-brand-gray',
              )}
            >
              Contacto Comercial
            </button>
            <button
              onClick={() => setFormType('applicant')}
              className={cn(
                'flex-1 pb-4 text-[10px] uppercase tracking-[0.2em] font-medium transition-all',
                formType === 'applicant' ? 'text-brand-gold border-b-2 border-brand-gold' : 'text-brand-gray',
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
                <input required name="phone" type="tel" className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold transition-colors font-light" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-brand-gray">Ciudad</label>
                <input name="city" type="text" className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold transition-colors font-light" />
              </div>
            </div>

            {formType === 'commercial' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-brand-gray">Empresa</label>
                    <input name="company" type="text" className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold transition-colors font-light" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-brand-gray">Modelo de interés</label>
                    <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} name="model_interest" className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold transition-colors font-light bg-transparent">
                      <option value="">Seleccionar</option>
                      {modelOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-brand-gray">Fecha tentativa</label>
                    <input name="tentative_date" type="date" className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold transition-colors font-light bg-transparent" />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-brand-gray">Nombre artístico</label>
                    <input name="stage_name" type="text" className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold transition-colors font-light" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-brand-gray">Edad</label>
                    <input name="age" type="text" className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold transition-colors font-light" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-brand-gray">Estatura (cm)</label>
                    <input name="height" type="text" className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold transition-colors font-light" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-brand-gray">Idiomas</label>
                    <input name="languages" type="text" className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold transition-colors font-light" />
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

            <Button type="submit" disabled={loading} className="w-full py-4 group">
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

            {success && <p className="text-sm text-brand-gray font-light">{success}</p>}
          </form>
        </div>
      </div>
    </div>
  );
};
