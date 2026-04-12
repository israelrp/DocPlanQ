# DocPlanQ

Sitio de documentación técnica para PlanQ/Harmoniq con navegación SPA ligera, búsqueda unificada y soporte bilingüe.

## Estructura del proyecto

- `index.html`, `articulos.html`, `learning.html`, `programacion-cuantica.html`, `referencias-api.html`, `tutoriales.html`: entradas principales.
- `paginas/`: páginas de contenido y secciones internas.
- `script.js`: lógica global de UI (tema, i18n, navegación, búsqueda, TOC y utilidades).
- `styles.css`: estilos base del sistema de documentación.
- `search-index.json`: índice de búsqueda generado para resultados cross-page.
- `scripts/build-search-index.mjs`: generador del índice de búsqueda.
- `src/firebase-init.js` y `firebase-init.bundle.js`: inicialización de Firebase (fuente + bundle de navegador).

## Scripts

```bash
npm install
npm run build:search
npm run build:firebase
```

## Criterios de calidad aplicados

- Estructura de inicialización unificada para mejorar legibilidad y mantenibilidad.
- Constantes de configuración centralizadas para claves de storage y valores por defecto.
- Comentarios breves en zonas complejas y sin ruido innecesario.
- Limpieza de duplicaciones en el flujo de arranque sin cambiar comportamiento.

## Publicación

Este repositorio está preparado para versionado en GitHub y posterior despliegue por el equipo (por ejemplo en AWS).
