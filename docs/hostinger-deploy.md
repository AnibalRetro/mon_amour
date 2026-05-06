# Deploy a producción en Hostinger (Vite + React SPA)

## 1) Variables de entorno
1. Copia `.env.example` a `.env.production`.
2. Completa todas las variables `VITE_*` necesarias (Firebase y admin).

## 2) Build de producción
```bash
npm ci
npm run build
```

El build queda en `dist/`.

## 3) Subir a Hostinger
1. En hPanel abre **File Manager** del dominio productivo.
2. Borra el contenido antiguo de `public_html` (si aplica).
3. Sube todo el contenido de `dist/` dentro de `public_html/`.
4. Sube también el archivo `public/.htaccess` a `public_html/.htaccess`.

## 4) Verificación post deploy
- Abre la home y confirma que carga el hero desde assets local.
- Valida rutas SPA directamente en navegador:
  - `/catalogo`
  - `/contacto`
  - `/nosotros`
  - `/admin`
- Revisa consola del navegador (sin errores 404/500 de assets).

## 5) Rollback rápido
- Mantén un zip del `public_html` anterior.
- Si algo falla, restaura ese zip y limpia caché del navegador/CDN.
