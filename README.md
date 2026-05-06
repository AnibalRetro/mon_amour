Archivos incluidos en este parche:
- src/components/Navbar.tsx
- src/components/Footer.tsx
- src/index.css
- src/pages/Home.tsx
- src/pages/About.tsx
- src/pages/Catalog.tsx
- src/pages/Contact.tsx
- src/pages/AdminPortal.tsx

Notas:
1. La marca se actualiza a Mon Amour.
2. No se tocaron las transiciones globales del sitio.
3. El popup del catálogo ahora incluye:
   - carrusel funcional
   - calendario mensual de disponibilidad
   - reserva con nombre, teléfono y correo
   - mensaje de confirmación
4. El admin ahora usa login por usuario y contraseña basado en variables:
   - VITE_ADMIN_USER
   - VITE_ADMIN_PASS
   Si no existen, usa:
   - admin
   - monamour2026
5. El panel admin queda dividido en:
   - Reservas
   - Modelos
   - Contacto
6. La gestión de modelos usa URLs para portada y galería. No se implementó upload binario a Firebase Storage en este parche.
7. La colección esperada para reservas es:
   - reservations

Sugerencia para .env.local:
VITE_ADMIN_USER=admin
VITE_ADMIN_PASS=monamour2026