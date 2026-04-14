(function () {
  try {
    if (typeof window === "undefined" || window.location.protocol === "file:") return;
    
    // En desarrollo (Vite), desactivamos el redirect automático
    if (typeof import.meta !== "undefined" && typeof import.meta.env !== "undefined") return;
    
    const p = window.location.pathname;
    if (p === "/" || p.endsWith("/")) return;
    const lastSeg = p.split("/").pop() || "";
    if (lastSeg.includes(".")) return;
    
    // Todas las rutas de documentación (sin extensión .html)
    const docRoutes = new Set([
      // Raíz
      "index", "articulos", "referencias-api", "tutoriales", "programacion-cuantica", "learning",
      // Páginas
      "api", "base-algoritmos", "base-circuitos-puertas", "base-incertidumbre", "base-superposicion",
      "casos-uso-cuanticos", "code-examples", "compositor", "curso-circuitos-simulacion",
      "curso-fundamentos-informacion-cuantica", "ejemplo-bell-state", "ejemplo-deutsch-jozsa",
      "ejemplo-grover", "fundamento-teorico", "overview", "qubits", "simuladores", "source",
      "teoria-cuantica", "workflow"
    ]);
    
    if (docRoutes.has(lastSeg)) return;
    
    window.location.replace(p + "/" + window.location.search + window.location.hash);
  } catch {
    /* ignore */
  }
})();

function getMainSections() {
  return Array.from(document.querySelectorAll("main.doc-content section[id]"));
}

function getRightTocLinks() {
  return Array.from(document.querySelectorAll(".right-toc a")).filter((el) => {
    const href = el.getAttribute("href");
    return href && href.startsWith("#") && href.length > 1;
  });
}
const searchBox = document.getElementById("headerSearch");
const searchWrap = document.getElementById("searchWrap");
const searchDropdown = document.getElementById("searchDropdown");
const searchToggle = document.querySelector(".search-toggle");
const searchInput = document.getElementById("searchInput");
const searchResultsList = document.getElementById("searchResultsList");
const searchEmptyBlock = document.getElementById("searchEmptyBlock");
const searchEmptyHint = document.getElementById("searchEmptyHint");
const searchNoResultsMsg = document.getElementById("searchNoResultsMsg");
const langButtons = Array.from(document.querySelectorAll(".lang-btn"));
const langDropdown = document.querySelector("[data-lang-dropdown]");
const langDropdownToggle = document.querySelector(".lang-dropdown-toggle");
const langLabel = document.querySelector("[data-lang-label]");
const themeButtons = Array.from(document.querySelectorAll(".theme-btn"));
const copyButtons = Array.from(document.querySelectorAll(".copy-btn"));
const favicon = document.getElementById("favicon");
const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");

/** Versión de caché del índice (subir si se regenera search-index.json). */
const SEARCH_INDEX_VERSION = "35";

const STORAGE_KEYS = Object.freeze({
  lang: "harmoniq-docs-lang",
  theme: "harmoniq-docs-theme",
  sidebar: "harmoniq-docs-sidebar",
  leftNavScroll: "harmoniq-docs-leftnav-scroll",
});
const DEFAULT_LANG = "es";
const DEFAULT_THEME = "system";
const SIDEBAR_COLLAPSED_CLASS = "sidebar-nav-collapsed";

let searchIndexCache = null;
let searchIndexLoadPromise = null;

let leftNavFlyoutEl = null;
let leftNavFlyoutAnchorBtn = null;

const translations = {
  es: {
    "top.brandDocs": "Docs",
    "top.docs": "Documentación",
    "top.tutorials": "Tutoriales",
    "top.api": "Referencias API",
    "top.articles": "Artículos",
    "top.learning": "Aprendizaje",
    "top.login": "Iniciar sesión",
    "top.platform": "Ir a plataforma",
    "lang.menu": "Selección de idioma",
    "lang.optionEs": "Español",
    "lang.optionEn": "Inglés",
    "search.label": "Buscar",
    "search.open": "Abrir buscador",
    "search.placeholder": "Buscar en la documentación",
    "search.dialogLabel": "Búsqueda en la documentación",
    "search.enterPrompt": "Ingrese una búsqueda",
    "search.noResults": "Sin resultados",
    "search.breadcrumbRoot": "Documentación",
    "left.title": "Documentación",
    "nav.collapse": "Contraer menú lateral",
    "nav.expand": "Expandir menú lateral",
    "left.sec.start": "Primeros pasos",
    "left.intro": "Introducción",
    "left.quickGuide": "Guía rápida",
    "left.sec.theory": "Fundamento teórico",
    "left.quantumMech": "Mecánica cuántica",
    "left.quantumProg": "Programación cuántica",
    "left.sec.products": "Productos",
    "left.products.sim": "Simuladores",
    "left.products.simPage": "Documentación",
    "left.products.composer": "Compositor",
    "left.products.composerPage": "Flujo de desarrollo",
    "left.products.apikeys": "API Keys",
    "left.products.apiPage": "Referencia API",
    "left.products.code": "Código y ejemplos",
    "left.products.codePage": "Ejemplos de código",
    "left.sec.refs": "Otras referencias",
    "left.ref.tutorials": "Tutoriales",
    "left.ref.tutorialsHub": "Centro de tutoriales",
    "left.ref.tutorialsPractical": "Guías prácticas",
    "left.sec.support": "Soporte",
    "left.support.platform": "Usar la plataforma",
    "left.support.help": "Ayuda",
    "left.sec.harmoniq": "Harmoniq",
    "left.start.foundations": "Fundamentos teóricos",
    "left.start.quantumProgramming": "Programación cuántica",
    "left.start.technology": "Nuestra tecnología",
    "left.theory.qubits": "Qubits",
    "left.theory.useCases": "Casos de uso",
    "left.theory.quantumTheory": "Teoría cuántica",
    "left.products.sim.docs": "Documentación",
    "left.products.sim.functioning": "Funcionamiento",
    "left.products.sim.computers": "Computadoras",
    "left.products.sim.foundations": "Fundamentos",
    "left.products.sim.usage": "Modo de uso",
    "left.products.composer.how": "Funcionamiento",
    "left.products.composer.usage": "Modo de uso",
    "left.products.composer.foundations": "Fundamentos",
    "left.harmoniq.group": "Harmoniq",
    "left.harmoniq.history": "Nuestra historia",
    "left.harmoniq.swift": "Swift",
    "left.harmoniq.kotlin": "Kotlin",
    "left.harmoniq.react": "React",
    "left.harmoniq.python": "Python",
    "left.harmoniq.examples": "Ejemplos",
    "help.title": "Ayuda",
    "help.subtitle": "Cuéntanos tu solicitud. Un miembro de nuestro equipo la revisará en la brevedad.",
    "help.name": "Nombre",
    "help.email": "Correo",
    "help.subject": "Asunto",
    "help.message": "Mensaje",
    "help.cancel": "Cancelar",
    "help.send": "Enviar solicitud",
    "help.successTitle": "Solicitud enviada",
    "help.successDesc": "Gracias. Revisaremos tu solicitud en la brevedad y te contactaremos por correo.",
    "rtf.title": "¿Te sirvió esta página?",
    "rtf.yes": "Sí",
    "rtf.no": "No",
    "rtf.desc": "Reporta un bug o solicita contenido en",
    "left.support.learning": "Aprendizaje",
    "left.support.apiRef": "Referencias API",
    "left.overview": "Resumen",
    "left.hubTutorials": "Tutoriales",
    "left.hubLearning": "Aprendizaje",
    "left.theoryMain": "Fundamento teórico",
    "left.workflow": "Flujo de desarrollo",
    "left.theory": "Simuladores",
    "left.code": "Ejemplos de código",
    "left.api": "Referencia API",
    "left.tutorials": "Guías prácticas",
    "left.source": "Fuente",
    "main.title": "Documentación",
    "doc.backPrevious": "Volver a la página anterior",
    "academy.title": "Sección académica: modelado de iones atrapados",
    "academy.p1":
      "Esta sección sintetiza, en formato académico, los principios del artículo de modelado cuántico mediante iones atrapados y su traducción directa al diseño de simuladores en Harmoniq.",
    "academy.p2":
      "El enfoque integra física de trampas iónicas, formalismo de matriz de densidad y estrategias numéricas multiescala para mantener equilibrio entre fidelidad física y costo computacional.",
    "academy.download": "Descargar artículo base (PDF)",
    "academy.card1.title": "1) Hipótesis física y plataforma experimental",
    "academy.card1.desc":
      "Se asume una plataforma de iones confinados electromagnéticamente (trampas de Paul y arquitectura segmentada) donde los estados internos codifican qubits y los modos vibracionales colectivos median interacciones de dos qubits.",
    "academy.card2.title": "2) Formalismo de evolución",
    "academy.card2.desc":
      "La dinámica ideal se modela con evolución unitaria; la dinámica real incorpora apertura del sistema mediante ecuación maestra de Lindblad para capturar relajación, dephasing, calentamiento y ruido ambiental.",
    "academy.card3.title": "3) Métricas de validez",
    "academy.card3.desc":
      "La calidad se evalúa con fidelidad de estado/proceso, error de readout y estabilidad temporal bajo perturbaciones térmicas, permitiendo comparar simulación ideal contra simulación físicamente realista.",
    "academy.card4.title": "4) Decisión computacional por escala",
    "academy.card4.desc":
      "El pipeline selecciona automáticamente paradigma de simulación según qubits, profundidad de circuito y objetivo del experimento: exactitud física, exploración de diseño o barrido estadístico de escenarios.",
    "academy.chart1.title": "Gráfica A: impacto de decoherencia vs tiempo",
    "academy.chart1.x": "Tiempo de ejecución",
    "academy.chart1.y": "Fidelidad",
    "academy.chart2.title": "Gráfica B: costo computacional por simulador",
    "academy.chart2.b1": "Densidad",
    "academy.chart2.b2": "Tensorial",
    "academy.chart2.b3": "Monte Carlo",
    "capabilities.title": "Explora capacidades",
    "capabilities.c1.title": "Construcción de circuitos",
    "capabilities.c1.desc": "Construye circuitos cuánticos utilizando el SDK de Harmoniq.",
    "capabilities.c1.cta": "Ver introducción ->",
    "capabilities.c2.title": "Optimización",
    "capabilities.c2.desc": "Construye circuitos de alta fidelidad con menor profundidad para ejecución.",
    "capabilities.c2.cta": "Explorar detalles del transpiler ->",
    "capabilities.c3.title": "Mitigación de errores",
    "capabilities.c3.desc": "Explora técnicas de supresión y mitigación disponibles en Harmoniq.",
    "capabilities.c3.cta": "Leer resumen ->",
    "capabilities.c4.title": "Ejecución",
    "capabilities.c4.desc": "Usa primitivas runtime para correr circuitos en backends de hardware.",
    "capabilities.c4.cta": "Saber más ->",
    "capabilities.c5.title": "Post-procesamiento",
    "capabilities.c5.desc": "Refina resultados con flujos de post-procesamiento para casos enterprise.",
    "capabilities.c5.cta": "Ver addon ->",
    "capabilities.c6.title": "Funciones Harmoniq",
    "capabilities.c6.desc": "Acelera la creación de workloads con módulos cuánticos preconstruidos.",
    "capabilities.c6.cta": "Explorar ->",
    "overview.p1":
      "Bienvenido a la documentación de Harmoniq, una librería/plataforma para construir aplicaciones de computación cuántica en Android, iOS, React y backend Node. Esta página sigue un formato de documentación técnica clara, enfocado en integración y ejecución de workloads cuánticos.",
    "overview.p2":
      "Empieza con <a href=\"#workflow\">Hello World</a> y luego escala hacia integraciones empresariales con pipelines híbridos clásico-cuánticos.",
    "workflow.title": "Flujo de desarrollo",
    "workflow.p1": "Marco de trabajo para resolver problemas de negocio con software cuantico en etapas:",
    "workflow.li1": "Mapear el problema a circuitos cuanticos y operadores.",
    "workflow.li2": "Optimizar para el hardware o simulador objetivo.",
    "workflow.li3": "Ejecutar en backend cuántico (sandbox o producción).",
    "workflow.li4": "Post-procesar resultados para decisiones de negocio.",
    "theory.title": "Fundamento teórico y simuladores Harmoniq",
    "theory.p1":
      "Esta sección resume el artículo técnico sobre modelado de sistemas cuánticos mediante iones atrapados y conecta esos principios con los simuladores de Harmoniq.",
    "theory.download": "Descargar artículo técnico (PDF)",
    "qubits.endmatter.sectionTitle": "Descargar artículo",
    "qubits.endmatter.dtTitle": "Título",
    "qubits.endmatter.articleTitle":
      "El cúbit: superposición, medición y el formalismo del espacio de Hilbert",
    "qubits.endmatter.dtDate": "Fecha de elaboración",
    "qubits.endmatter.dateValue": "9 de abril de 2026",
    "qubits.endmatter.dtAuthors": "Autores",
    "qubits.endmatter.authorName": "Noguerón Méndez José Antonio",
    "qubits.endmatter.authorAffil": "Head of Quantum Product",
    "qubits.download.button": "Descargar artículo",
    "qubits.download.aria": "Descargar el artículo completo",
    "qubits.download.toc": "Descargar",
    "teoria.endmatter.sectionTitle": "Descargar artículo",
    "teoria.endmatter.dtTitle": "Título",
    "teoria.endmatter.articleTitle":
      "De Planck a la tecnología cuántica: historia, fenómenos y formalismo de la teoría cuántica",
    "teoria.endmatter.dtDate": "Fecha de elaboración",
    "teoria.endmatter.dateValue": "9 de abril de 2026",
    "teoria.endmatter.dtAuthors": "Autores",
    "teoria.endmatter.authorName": "Noguerón Méndez José Antonio",
    "teoria.endmatter.authorAffil": "Head of Quantum Product",
    "teoria.download.button": "Descargar artículo",
    "teoria.download.aria": "Descargar el artículo completo",
    "teoria.download.toc": "Descargar",
    "casos.endmatter.sectionTitle": "Descargar artículo",
    "casos.endmatter.dtTitle": "Título",
    "casos.endmatter.articleTitle":
      "Casos de uso de la computación cuántica: marco formal, aplicaciones y fronteras prácticas",
    "casos.endmatter.dtDate": "Fecha de elaboración",
    "casos.endmatter.dateValue": "9 de abril de 2026",
    "casos.endmatter.dtAuthors": "Autores",
    "casos.endmatter.authorName": "Noguerón Méndez José Antonio",
    "casos.endmatter.authorAffil": "Head of Quantum Product",
    "casos.download.button": "Descargar artículo",
    "casos.download.aria": "Descargar el artículo completo",
    "casos.download.toc": "Descargar",
    "theory.card1.title": "Modelo físico base",
    "theory.card1.desc":
      "Partimos de trampas de Paul/Penning, control láser y régimen Lamb-Dicke para representar qubits iónicos y dinámica motional compartida.",
    "theory.card2.title": "Sistemas abiertos",
    "theory.card2.desc":
      "La evolución incluye decoherencia y ruido con ecuación maestra de Lindblad, incorporando T1/T2, errores de lectura y fidelidades de puerta.",
    "theory.sim1.title": "Simulador 1: Matriz de densidad completa",
    "theory.sim1.desc":
      "Alta fidelidad física para circuitos pequeños (hasta ~12 qubits), ideal para validación fina, benchmarking y análisis detallado de coherencias.",
    "theory.sim2.title": "Simulador 2: Hibrido con redes tensoriales",
    "theory.sim2.desc":
      "Enfoque adaptativo para tamaño intermedio, reduciendo costo computacional cuando la estructura de entrelazamiento permite compresión.",
    "theory.sim3.title": "Simulador 3: Monte Carlo estocástico",
    "theory.sim3.desc":
      "Escala a sistemas grandes por trayectorias muestrales, útil para estimaciones de comportamiento global, ruido agregado y tiempos de ejecución.",
    "theory.flow.title": "Cómo seleccionar el simulador",
    "theory.flow.desc":
      "Flujo recomendado: prototipo físico en densidad -> optimización en tensorial -> corrida masiva/escenario en Monte Carlo, con comparación cruzada de fidelidad.",
    "code.title": "Ejemplos de código con copiar",
    "code.subtitle": "Ejecuta estos snippets de integración y copia cada bloque con un clic.",
    "code.py.title": "Python: Bell state",
    "code.android.title": "Android: cliente Kotlin",
    "code.ios.title": "iOS: Swift async/await",
    "code.react.title": "React: uso del hook",
    "code.copy": "Copiar código",
    "api.title": "Referencia API",
    "api.p1": "Guías para usar los SDKs y servicios clave de Harmoniq:",
    "api.li1":
      "<a href=\"#\">Harmoniq Android SDK</a> - Cliente Kotlin para ejecución de jobs, polling de estado y telemetría.",
    "api.li2":
      "<a href=\"#\">Harmoniq iOS SDK</a> - Cliente Swift con soporte `async/await` y manejo de sesiones seguras.",
    "api.li3":
      "<a href=\"#\">Harmoniq React SDK</a> - Hooks para crear, monitorear y visualizar jobs en UI web.",
    "api.li4":
      "<a href=\"#\">Harmoniq Runtime API</a> - Plataforma para ejecutar y optimizar programas cuánticos en tiempo real.",
    "apiHub.hero.title": "Referencias API",
    "apiHub.hero.lead": "Explora la documentación de referencia para aprender a usar endpoints, parámetros y operaciones.",
    "apiHub.toc.title": "Referencias API",
    "apiHub.toc.primary": "APIs principales",
    "apiHub.toc.addons": "Addons",
    "apiHub.toc.additional": "Referencias adicionales",
    "apiHub.primary.title": "APIs principales",
    "apiHub.primary.lead": "Funcionalidad base para construir y ejecutar flujos.",
    "apiHub.primary.sdk.title": "Harmoniq SDK",
    "apiHub.primary.sdk.desc": "Toolkit open-source para desarrollo y ciencia de información cuántica.",
    "apiHub.primary.sdk.link1": "SDK Python",
    "apiHub.primary.sdk.link2": "SDK C++",
    "apiHub.primary.runtime.title": "Runtime",
    "apiHub.primary.runtime.desc": "Interfaz para ejecutar cómputos cuánticos y administrar jobs en la plataforma.",
    "apiHub.primary.runtime.link1": "Cliente",
    "apiHub.primary.runtime.link2": "API REST",
    "apiHub.primary.functions.title": "Functions",
    "apiHub.primary.functions.desc": "Ejecuta servicios preconstruidos para workflows de investigación con cómputo clásico elástico.",
    "apiHub.primary.system.title": "Sistema cuántico",
    "apiHub.primary.system.desc": "Interfaz para ejecutar workflows en backends conectados y runtimes de simulación.",
    "apiHub.primary.system.link1": "Explorar sistemas",
    "apiHub.addons.title": "Addons",
    "apiHub.addons.lead": "Colección de capacidades modulares que amplían la investigación y la simulación.",
    "apiHub.addons.a.title": "Tensor de compilación aproximada",
    "apiHub.addons.a.desc": "Construcción de circuitos de alta fidelidad con menor profundidad.",
    "apiHub.addons.b.title": "Circuit cutting",
    "apiHub.addons.b.desc": "Reduce la profundidad descomponiendo puertas de entrelazamiento.",
    "apiHub.addons.c.title": "Backpropagación de operadores",
    "apiHub.addons.c.desc": "Reduce profundidad recortando operaciones desde el final.",
    "apiHub.addons.d.title": "Fórmulas multi-producto",
    "apiHub.addons.d.desc": "Reduce el error de Trotter con combinaciones ponderadas de ejecuciones.",
    "apiHub.addons.e.title": "Diagonalización basada en muestreo",
    "apiHub.addons.e.desc": "Mejora estimaciones de autovalores para Hamiltonianos.",
    "apiHub.addons.f.title": "Utilidades de addon",
    "apiHub.addons.f.desc": "Funciones para complementar workflows, medición y evaluación.",
    "apiHub.additional.title": "Referencias adicionales",
    "apiHub.additional.lead": "Más recursos para apoyar tu flujo de trabajo.",
    "apiHub.additional.a.title": "Servicio de transpiler",
    "apiHub.additional.a.desc": "Servicios de compilación, incluyendo pases mejorados con IA.",
    "apiHub.additional.a.link1": "API",
    "apiHub.additional.b.title": "Registro de códigos de error",
    "apiHub.additional.b.desc": "Lista completa de códigos, mensajes y soluciones sugeridas.",
    "apiHub.additional.b.link1": "Explorar códigos",
    "apiHub.common.learnMore": "Saber más",
    "apiHub.common.viewDetails": "Ver detalles",
    "apiHub.common.viewApis": "Ver APIs",
    "tutorials.title": "Tutoriales",
    "tutorials.p1": "Casos aplicados para uso real de computación cuántica:",
    "tutorials.li1":
      "<a href=\"#\">Hello World cuantico</a> - Crea un circuito Bell State y ejecutalo en `hq-sim-local`.",
    "tutorials.li2":
      "<a href=\"#\">Optimizacion combinatoria</a> - Implementa QAOA para rutas y asignacion de recursos.",
    "tutorials.li3":
      "<a href=\"#\">Quantum ML hibrido</a> - Conecta features clasicas y capas cuanticas para clasificacion.",
    "tutorials.viewAll": "View all tutorials",
    "source.title": "Fuente",
    "source.p1":
      "Esta documentación está orientada a guías prácticas de integración y arquitectura. El contenido cubre flujos de producto completos desde onboarding y API Keys hasta monitoreo, observabilidad y escalado.",
    "source.p2":
      "Recomendación de flujo principal: <strong>onboarding - SDK install - circuito inicial - ejecución - análisis - despliegue</strong>.",
    "home.hero.kicker": "PlanQ · Documentación",
    "home.hero.title": "Documentación de PlanQ",
    "home.hero.line1": "Documentación",
    "home.hero.line2": "de PlanQ",
    "home.hero.p1":
      "Bienvenido a la documentación de la plataforma PlanQ. Aquí encontrarás guías para empezar, tutoriales con casos de uso y referencias de API.",
    "home.hero.p2": "",
    "home.explore.title": "Explorar capacidades",
    "home.explore.c1.title": "Construcción de circuitos",
    "home.explore.c1.desc": "Construye circuitos cuánticos usando el SDK.",
    "home.explore.c1.cta": "Ver introducción →",
    "home.explore.c2.title": "Optimización",
    "home.explore.c2.desc": "Reduce profundidad y mejora fidelidad para ejecución.",
    "home.explore.c2.cta": "Explorar detalles →",
    "home.explore.c3.title": "Mitigación de errores",
    "home.explore.c3.desc": "Técnicas de supresión y mitigación para tus experimentos.",
    "home.explore.c3.cta": "Leer resumen →",
    "home.explore.c4.title": "Ejecución",
    "home.explore.c4.desc": "Ejecuta jobs en simuladores y backends conectados.",
    "home.explore.c4.cta": "Saber más →",
    "home.explore.c5.title": "Post‑procesamiento",
    "home.explore.c5.desc": "Refina resultados con flujos y utilidades.",
    "home.explore.c5.cta": "Ver addon →",
    "home.explore.c6.title": "Servicios",
    "home.explore.c6.desc": "Acelera workflows con servicios preconstruidos.",
    "home.explore.c6.cta": "Explorar →",
    "home.getStarted.title": "Empezar",
    "home.getStarted.c1.title": "Guía rápida",
    "home.getStarted.c1.desc": "Construye y ejecuta un circuito en minutos.",
    "home.getStarted.c1.cta": "Comenzar →",
    "home.getStarted.c2.title": "Cursos",
    "home.getStarted.c2.desc": "Módulos y recursos con ejemplos de extremo a extremo.",
    "home.getStarted.c2.cta": "Ver cursos →",
    "home.support.title": "Soporte",
    "home.support.c1.title": "Registro de errores",
    "home.support.c1.desc": "Busca códigos de error y soluciones sugeridas.",
    "home.support.c1.cta": "Ver errores →",
    "home.support.c2.title": "Página de soporte",
    "home.support.c2.desc": "Preguntas frecuentes y cómo reportar bugs o solicitar contenido.",
    "home.support.c2.cta": "Obtener ayuda →",
    "right.title": "En esta página",
    "right.intro": "Introducción",
    "right.explore": "Explorar capacidades",
    "right.getStarted": "Empezar",
    "right.quick": "Guía rápida",
    "right.quick1": "Iniciar con el compositor",
    "right.quick2": "Funciones avanzadas del compositor",
    "right.quick3": "Compartir tus trabajos",
    "right.academicGroup": "Modelado académico",
    "right.products": "Productos",
    "right.products1": "Referencia API",
    "right.products2": "Código y fuente",
    "right.support": "Soporte",
    "right.support1": "Ejemplos de código",
    "right.support2": "Simuladores",
    "right.pageContent": "Contenido",
    "right.sub1": "Plataforma experimental",
    "right.sub2": "Formalismo de evolución",
    "right.sub3": "Metricas de validez",
    "right.sub4": "Decision por escala",
    "right.sub5": "Graficas de referencia",
    "theme.dark": "Modo oscuro",
    "theme.light": "Modo claro",
    "theme.system": "Sistema",
    "learning.hero.title": "Artículos",
    "learning.hero.subtitle":
      "Módulos, cursos sugeridos y recursos. La guía de programación cuántica con Harmoniq está en «Programación cuántica» del menú lateral.",
    "learning.hero.cta": "Ver todos los modulos",
    "learning.featured.badge": "ENSEÑA",
    "learning.courses.a11yTitle": "Cursos sugeridos",
    "learning.course1.label": "Curso:",
    "learning.course1.title": "Fundamentos de informacion cuantica",
    "learning.course1.meta": "Recorrido introductorio con ejemplos en Harmoniq",
    "learning.course1.cta": "Comenzar este curso",
    "learning.course2.label": "Curso:",
    "learning.course2.title": "Circuitos y simulacion",
    "learning.course2.meta": "Del diagrama al runtime en la plataforma",
    "learning.course2.cta": "Ver practicas",
    "learning.modules.title": "Modulos destacados",
    "learning.card1.cat": "Mecanica cuantica",
    "learning.card1.title": "Superposicion",
    "learning.card1.desc": "Explora como un sistema cuantico puede existir en una combinacion de estados hasta la medicion.",
    "learning.card2.cat": "Mecanica cuantica",
    "learning.card2.title": "Incertidumbre",
    "learning.card2.desc": "Relacion de incertidumbre y limites de precision en observables conjugados.",
    "learning.card3.cat": "Informatica cuantica",
    "learning.card3.title": "Algoritmos",
    "learning.card3.desc": "Introduccion a algoritmos cuanticos y su traduccion a circuitos ejecutables.",
    "learning.card4.cat": "Informatica cuantica",
    "learning.card4.title": "Circuitos y puertas",
    "learning.card4.desc": "Construye circuitos con puertas de uno y dos qubits y simulalos con Harmoniq.",
    "learning.resources.title": "Recursos adicionales",
    "learning.res1.title": "Harmoniq en video",
    "learning.res1.desc": "Recorridos visuales del SDK, runtime y ejemplos de integracion.",
    "learning.res1.cta": "Explorar videos",
    "learning.res2.title": "Tutoriales practicos",
    "learning.res2.desc": "Guías paso a paso con código listo para copiar y ejecutar.",
    "learning.res2.cta": "Ver tutoriales",
    "learning.toc.hero": "Introduccion",
    "learning.toc.modules": "Modulos",
    "learning.toc.courses": "Cursos",
    "learning.toc.resources": "Recursos",
  },
  en: {
    "top.brandDocs": "Docs",
    "top.docs": "Documentation",
    "top.tutorials": "Tutorials",
    "top.api": "API references",
    "top.articles": "Articles",
    "top.learning": "Learning",
    "top.login": "Sign in",
    "top.platform": "Go to platform",
    "lang.menu": "Language",
    "lang.optionEs": "Spanish",
    "lang.optionEn": "English",
    "search.label": "Search",
    "search.open": "Open search",
    "search.placeholder": "Search documentation",
    "search.dialogLabel": "Documentation search",
    "search.enterPrompt": "Enter a search query",
    "search.noResults": "No results",
    "search.breadcrumbRoot": "Documentation",
    "left.title": "Documentation",
    "nav.collapse": "Collapse sidebar",
    "nav.expand": "Expand sidebar",
    "left.sec.start": "Getting started",
    "left.intro": "Introduction",
    "left.quickGuide": "Quick guide",
    "left.sec.theory": "Theory",
    "left.quantumMech": "Quantum mechanics",
    "left.quantumProg": "Quantum programming",
    "left.sec.products": "Products",
    "left.products.sim": "Simulators",
    "left.products.simPage": "Documentation",
    "left.products.composer": "Composer",
    "left.products.composerPage": "Development workflow",
    "left.products.apikeys": "API keys",
    "left.products.apiPage": "API reference",
    "left.products.code": "Code and examples",
    "left.products.codePage": "Code examples",
    "left.sec.refs": "Other references",
    "left.ref.tutorials": "Tutorials",
    "left.ref.tutorialsHub": "Tutorials hub",
    "left.ref.tutorialsPractical": "Hands-on guides",
    "left.sec.support": "Support",
    "left.support.platform": "Use the platform",
    "left.support.help": "Help",
    "left.sec.harmoniq": "Harmoniq",
    "left.start.foundations": "Theoretical foundations",
    "left.start.quantumProgramming": "Quantum programming",
    "left.start.technology": "Our technology",
    "left.theory.qubits": "Qubits",
    "left.theory.useCases": "Use cases",
    "left.theory.quantumTheory": "Quantum theory",
    "left.products.sim.docs": "Documentation",
    "left.products.sim.functioning": "How it works",
    "left.products.sim.computers": "Computers",
    "left.products.sim.foundations": "Foundations",
    "left.products.sim.usage": "Usage",
    "left.products.composer.how": "How it works",
    "left.products.composer.usage": "Usage",
    "left.products.composer.foundations": "Foundations",
    "left.harmoniq.group": "Harmoniq",
    "left.harmoniq.history": "Our story",
    "left.harmoniq.swift": "Swift",
    "left.harmoniq.kotlin": "Kotlin",
    "left.harmoniq.react": "React",
    "left.harmoniq.python": "Python",
    "left.harmoniq.examples": "Examples",
    "help.title": "Help",
    "help.subtitle": "Tell us what you need. A team member will review your request shortly.",
    "help.name": "Name",
    "help.email": "Email",
    "help.subject": "Subject",
    "help.message": "Message",
    "help.cancel": "Cancel",
    "help.send": "Send request",
    "help.successTitle": "Request sent",
    "help.successDesc": "Thanks. We’ll review your request shortly and contact you by email.",
    "rtf.title": "Was this page helpful?",
    "rtf.yes": "Yes",
    "rtf.no": "No",
    "rtf.desc": "Report a bug or request content on",
    "left.support.learning": "Learning",
    "left.support.apiRef": "API references",
    "left.overview": "Overview",
    "left.hubTutorials": "Tutorials",
    "left.hubLearning": "Learning",
    "left.theoryMain": "Theoretical foundation",
    "left.workflow": "Development workflow",
    "left.theory": "Simulator theory",
    "left.code": "Code examples",
    "left.api": "API reference",
    "left.tutorials": "Hands-on guides",
    "left.source": "Source",
    "main.title": "Documentation",
    "doc.backPrevious": "Go back to the previous page",
    "academy.title": "Academic section: trapped-ion modeling",
    "academy.p1":
      "This section synthesizes, in academic format, the principles of the trapped-ion quantum modeling article and their direct translation to Harmoniq simulator design.",
    "academy.p2":
      "The approach combines ion-trap physics, density-matrix formalism, and multiscale numerical strategies to balance physical fidelity and computational cost.",
    "academy.download": "Download source article (PDF)",
    "academy.card1.title": "1) Physical hypothesis and experimental platform",
    "academy.card1.desc":
      "We assume an electromagnetically confined-ion platform (Paul traps and segmented architecture) where internal states encode qubits and collective motional modes mediate two-qubit interactions.",
    "academy.card2.title": "2) Evolution formalism",
    "academy.card2.desc":
      "Ideal dynamics are modeled by unitary evolution; realistic dynamics include open-system behavior through the Lindblad master equation to capture relaxation, dephasing, heating, and environmental noise.",
    "academy.card3.title": "3) Validation metrics",
    "academy.card3.desc":
      "Quality is evaluated with state/process fidelity, readout error, and temporal stability under thermal perturbations, enabling comparison between ideal and physically realistic simulation.",
    "academy.card4.title": "4) Computational decision by scale",
    "academy.card4.desc":
      "The pipeline selects a simulation paradigm according to qubit count, circuit depth, and experiment goal: physical accuracy, design exploration, or statistical scenario sweep.",
    "academy.chart1.title": "Chart A: decoherence impact vs time",
    "academy.chart1.x": "Execution time",
    "academy.chart1.y": "Fidelity",
    "academy.chart2.title": "Chart B: computational cost by simulator",
    "academy.chart2.b1": "Density",
    "academy.chart2.b2": "Tensor",
    "academy.chart2.b3": "Monte Carlo",
    "capabilities.title": "Explore capabilities",
    "capabilities.c1.title": "Circuit building",
    "capabilities.c1.desc": "Construct quantum circuits by using the Harmoniq SDK.",
    "capabilities.c1.cta": "View introduction ->",
    "capabilities.c2.title": "Optimization",
    "capabilities.c2.desc": "Build high-fidelity circuits with reduced depth ready for execution.",
    "capabilities.c2.cta": "Explore transpiler details ->",
    "capabilities.c3.title": "Error mitigation",
    "capabilities.c3.desc": "Explore suppression and mitigation techniques available in Harmoniq.",
    "capabilities.c3.cta": "Read overview ->",
    "capabilities.c4.title": "Execution",
    "capabilities.c4.desc": "Use runtime primitives to run quantum circuits on hardware backends.",
    "capabilities.c4.cta": "Learn more ->",
    "capabilities.c5.title": "Post-processing",
    "capabilities.c5.desc": "Refine results with post-processing flows for enterprise use cases.",
    "capabilities.c5.cta": "View addon ->",
    "capabilities.c6.title": "Harmoniq Functions",
    "capabilities.c6.desc": "Accelerate workload creation with pre-built quantum service modules.",
    "capabilities.c6.cta": "Explore ->",
    "overview.p1":
      "Welcome to Harmoniq documentation, a library/platform to build quantum computing applications on Android, iOS, React, and Node backend. This page follows a clear technical documentation format focused on integration and execution of quantum workloads.",
    "overview.p2":
      "Start with <a href=\"#workflow\">Hello World</a> and then scale to enterprise integrations with hybrid classical-quantum pipelines.",
    "workflow.title": "Development workflow",
    "workflow.p1": "A practical framework to solve business problems with quantum software in stages:",
    "workflow.li1": "Map the problem to quantum circuits and operators.",
    "workflow.li2": "Optimize for the target hardware or simulator.",
    "workflow.li3": "Execute on a quantum backend (sandbox or production).",
    "workflow.li4": "Post-process results for business decisions.",
    "theory.title": "Theoretical foundation and Harmoniq simulators",
    "theory.p1":
      "This section summarizes the technical article on trapped-ion quantum system modeling and maps those principles to Harmoniq simulator behavior.",
    "theory.download": "Download technical article (PDF)",
    "qubits.endmatter.sectionTitle": "Download article",
    "qubits.endmatter.dtTitle": "Title",
    "qubits.endmatter.articleTitle":
      "The qubit: superposition, measurement, and Hilbert-space formalism",
    "qubits.endmatter.dtDate": "Date of preparation",
    "qubits.endmatter.dateValue": "April 9, 2026",
    "qubits.endmatter.dtAuthors": "Authors",
    "qubits.endmatter.authorName": "Noguerón Méndez José Antonio",
    "qubits.endmatter.authorAffil": "Head of Quantum Product",
    "qubits.download.button": "Download article",
    "qubits.download.aria": "Download the full article",
    "qubits.download.toc": "Download",
    "teoria.endmatter.sectionTitle": "Download article",
    "teoria.endmatter.dtTitle": "Title",
    "teoria.endmatter.articleTitle":
      "From Planck to quantum technology: history, phenomena, and formalism of quantum theory",
    "teoria.endmatter.dtDate": "Date of preparation",
    "teoria.endmatter.dateValue": "April 9, 2026",
    "teoria.endmatter.dtAuthors": "Authors",
    "teoria.endmatter.authorName": "Noguerón Méndez José Antonio",
    "teoria.endmatter.authorAffil": "Head of Quantum Product",
    "teoria.download.button": "Download article",
    "teoria.download.aria": "Download the full article",
    "teoria.download.toc": "Download",
    "casos.endmatter.sectionTitle": "Download article",
    "casos.endmatter.dtTitle": "Title",
    "casos.endmatter.articleTitle":
      "Quantum computing use cases: formal framing, applications, and practical limits",
    "casos.endmatter.dtDate": "Date prepared",
    "casos.endmatter.dateValue": "April 9, 2026",
    "casos.endmatter.dtAuthors": "Authors",
    "casos.endmatter.authorName": "Noguerón Méndez José Antonio",
    "casos.endmatter.authorAffil": "Head of Quantum Product",
    "casos.download.button": "Download article",
    "casos.download.aria": "Download the full article",
    "casos.download.toc": "Download",
    "theory.card1.title": "Core physical model",
    "theory.card1.desc":
      "We start from Paul/Penning traps, laser control, and Lamb-Dicke regime to represent ionic qubits and shared motional dynamics.",
    "theory.card2.title": "Open-system dynamics",
    "theory.card2.desc":
      "Evolution includes decoherence and noise through Lindblad master equation, with T1/T2, readout errors, and gate fidelities.",
    "theory.sim1.title": "Simulator 1: Full density matrix",
    "theory.sim1.desc":
      "Highest physical fidelity for small circuits (up to ~12 qubits), ideal for fine validation, benchmarking, and coherence analysis.",
    "theory.sim2.title": "Simulator 2: Hybrid tensor networks",
    "theory.sim2.desc":
      "Adaptive approach for intermediate scale, reducing computational cost when entanglement structure can be compressed.",
    "theory.sim3.title": "Simulator 3: Stochastic Monte Carlo",
    "theory.sim3.desc":
      "Scales to larger systems via trajectory sampling, suitable for global behavior estimates, aggregate noise, and runtime studies.",
    "theory.flow.title": "How to choose simulator",
    "theory.flow.desc":
      "Recommended flow: physical prototype in density -> optimization in tensor -> large scenario runs in Monte Carlo, with cross-fidelity checks.",
    "code.title": "Code examples with copy",
    "code.subtitle": "Run these integration snippets and copy each block in one click.",
    "code.py.title": "Python: Bell state",
    "code.android.title": "Android: Kotlin client",
    "code.ios.title": "iOS: Swift async/await",
    "code.react.title": "React: hook usage",
    "code.copy": "Copy code",
    "api.title": "API reference",
    "api.p1": "Guidance to use Harmoniq SDKs and key services:",
    "api.li1":
      "<a href=\"#\">Harmoniq Android SDK</a> - Kotlin client for job execution, status polling, and telemetry.",
    "api.li2":
      "<a href=\"#\">Harmoniq iOS SDK</a> - Swift client with `async/await` support and secure session handling.",
    "api.li3":
      "<a href=\"#\">Harmoniq React SDK</a> - Hooks to create, monitor, and render jobs in web UI.",
    "api.li4":
      "<a href=\"#\">Harmoniq Runtime API</a> - Platform to execute and optimize quantum programs in real time.",
    "apiHub.hero.title": "API references",
    "apiHub.hero.lead": "Explore reference documentation to learn how to use endpoints, parameters, and operations.",
    "apiHub.toc.title": "API references",
    "apiHub.toc.primary": "Primary APIs",
    "apiHub.toc.addons": "Addons",
    "apiHub.toc.additional": "Additional references",
    "apiHub.primary.title": "Primary APIs",
    "apiHub.primary.lead": "Core functionality for building and running workflows.",
    "apiHub.primary.sdk.title": "Harmoniq SDK",
    "apiHub.primary.sdk.desc": "Open-source quantum information science and development toolkit.",
    "apiHub.primary.sdk.link1": "SDK Python",
    "apiHub.primary.sdk.link2": "SDK C++",
    "apiHub.primary.runtime.title": "Runtime",
    "apiHub.primary.runtime.desc": "Interface to execute quantum computations and manage jobs on the platform.",
    "apiHub.primary.runtime.link1": "Client",
    "apiHub.primary.runtime.link2": "REST API",
    "apiHub.primary.functions.title": "Functions",
    "apiHub.primary.functions.desc": "Run pre-built services for research workflows with elastic classical compute.",
    "apiHub.primary.system.title": "Quantum system",
    "apiHub.primary.system.desc": "Interface to execute workflows on connected backends and simulator runtimes.",
    "apiHub.primary.system.link1": "Browse systems",
    "apiHub.addons.title": "Addons",
    "apiHub.addons.lead": "A collection of modular capabilities that extend research and simulation.",
    "apiHub.addons.a.title": "Approximate compilation tensor",
    "apiHub.addons.a.desc": "Support the construction of high-fidelity circuits with reduced depth.",
    "apiHub.addons.b.title": "Circuit cutting",
    "apiHub.addons.b.desc": "Reduce the depth of transpiled circuits by decomposing entangling gates.",
    "apiHub.addons.c.title": "Operator backpropagation",
    "apiHub.addons.c.desc": "Reduce circuit depth by trimming operations from the end.",
    "apiHub.addons.d.title": "Multi-product formulas",
    "apiHub.addons.d.desc": "Reduce the Trotter error via weighted combinations of executions.",
    "apiHub.addons.e.title": "Sample-based diagonalization",
    "apiHub.addons.e.desc": "Yield more accurate eigenvalue estimations for Hamiltonians.",
    "apiHub.addons.f.title": "Addon utilities",
    "apiHub.addons.f.desc": "A collection of functionalities to supplement workflows and evaluation.",
    "apiHub.additional.title": "Additional references",
    "apiHub.additional.lead": "More resources to support your overall workflow.",
    "apiHub.additional.a.title": "Transpiler service",
    "apiHub.additional.a.desc": "Compilation services, including AI-enhanced transpiler passes.",
    "apiHub.additional.a.link1": "API",
    "apiHub.additional.b.title": "Error code registry",
    "apiHub.additional.b.desc": "Full list of error codes, messages, and suggested solutions.",
    "apiHub.additional.b.link1": "Browse error codes",
    "apiHub.common.learnMore": "Learn more",
    "apiHub.common.viewDetails": "View details",
    "apiHub.common.viewApis": "View APIs",
    "tutorials.title": "Tutorials",
    "tutorials.p1": "Applied use cases for real quantum computing projects:",
    "tutorials.li1":
      "<a href=\"#\">Quantum Hello World</a> - Build a Bell State circuit and execute it on `hq-sim-local`.",
    "tutorials.li2":
      "<a href=\"#\">Combinatorial optimization</a> - Implement QAOA for routing and resource allocation.",
    "tutorials.li3":
      "<a href=\"#\">Hybrid Quantum ML</a> - Connect classical features and quantum layers for classification.",
    "tutorials.viewAll": "View all tutorials",
    "source.title": "Source",
    "source.p1":
      "This documentation is focused on practical integration and architecture guides. The content covers full product flows from onboarding and API keys to monitoring, observability, and scaling.",
    "source.p2":
      "Recommended core flow: <strong>onboarding - SDK install - first circuit - execution - analysis - rollout</strong>.",
    "home.hero.kicker": "PlanQ · Documentation",
    "home.hero.title": "PlanQ Documentation",
    "home.hero.line1": "Documentation",
    "home.hero.line2": "by PlanQ",
    "home.hero.p1":
      "Welcome to the PlanQ platform documentation. Here you'll find getting-started guides, use-case tutorials, and API references.",
    "home.hero.p2": "",
    "home.explore.title": "Explore capabilities",
    "home.explore.c1.title": "Circuit building",
    "home.explore.c1.desc": "Construct quantum circuits using the SDK.",
    "home.explore.c1.cta": "View introduction →",
    "home.explore.c2.title": "Optimization",
    "home.explore.c2.desc": "Reduce depth and improve fidelity for execution.",
    "home.explore.c2.cta": "Explore details →",
    "home.explore.c3.title": "Error mitigation",
    "home.explore.c3.desc": "Suppression and mitigation techniques for your experiments.",
    "home.explore.c3.cta": "Read overview →",
    "home.explore.c4.title": "Execution",
    "home.explore.c4.desc": "Run jobs on simulators and connected backends.",
    "home.explore.c4.cta": "Learn more →",
    "home.explore.c5.title": "Post-processing",
    "home.explore.c5.desc": "Refine results with workflows and utilities.",
    "home.explore.c5.cta": "View addon →",
    "home.explore.c6.title": "Services",
    "home.explore.c6.desc": "Accelerate workflows with pre-built services.",
    "home.explore.c6.cta": "Explore →",
    "home.getStarted.title": "Get started",
    "home.getStarted.c1.title": "Quickstart",
    "home.getStarted.c1.desc": "Build and run a circuit in minutes.",
    "home.getStarted.c1.cta": "Start building →",
    "home.getStarted.c2.title": "Courses",
    "home.getStarted.c2.desc": "Modules and resources with end-to-end examples.",
    "home.getStarted.c2.cta": "Browse courses →",
    "home.support.title": "Support",
    "home.support.c1.title": "Error code registry",
    "home.support.c1.desc": "Look up error codes and suggested solutions.",
    "home.support.c1.cta": "Find an error code →",
    "home.support.c2.title": "Support page",
    "home.support.c2.desc": "FAQs and how to report bugs or request content.",
    "home.support.c2.cta": "Get help →",
    "right.title": "On this page",
    "right.intro": "Introduction",
    "right.explore": "Explore capabilities",
    "right.getStarted": "Get started",
    "right.quick": "Quick guide",
    "right.quick1": "Get started with the composer",
    "right.quick2": "Advanced composer features",
    "right.quick3": "Share your work",
    "right.academicGroup": "Academic modeling",
    "right.products": "Products",
    "right.products1": "API reference",
    "right.products2": "Code and source",
    "right.support": "Support",
    "right.support1": "Code examples",
    "right.support2": "Simulators",
    "right.pageContent": "Content",
    "right.sub1": "Experimental platform",
    "right.sub2": "Evolution formalism",
    "right.sub3": "Validation metrics",
    "right.sub4": "Scale decision",
    "right.sub5": "Reference charts",
    "theme.dark": "Dark mode",
    "theme.light": "Light mode",
    "theme.system": "System",
    "learning.hero.title": "Articles",
    "learning.hero.subtitle":
      "Featured modules, suggested courses, and resources. The quantum programming guide lives under «Quantum programming» in the sidebar.",
    "learning.hero.cta": "View all modules",
    "learning.featured.badge": "TEACH",
    "learning.courses.a11yTitle": "Suggested courses",
    "learning.course1.label": "Course:",
    "learning.course1.title": "Basics of quantum information",
    "learning.course1.meta": "Introductory path with Harmoniq examples",
    "learning.course1.cta": "Start this course",
    "learning.course2.label": "Course:",
    "learning.course2.title": "Circuits and simulation",
    "learning.course2.meta": "From diagrams to runtime on the platform",
    "learning.course2.cta": "View hands-on labs",
    "learning.modules.title": "Featured modules",
    "learning.card1.cat": "Quantum mechanics",
    "learning.card1.title": "Superposition",
    "learning.card1.desc": "Explore how a quantum system can exist in a combination of states until measurement.",
    "learning.card2.cat": "Quantum mechanics",
    "learning.card2.title": "Uncertainty",
    "learning.card2.desc": "Uncertainty relations and precision limits for conjugate observables.",
    "learning.card3.cat": "Quantum computing",
    "learning.card3.title": "Algorithms",
    "learning.card3.desc": "Introduction to quantum algorithms and how they map to executable circuits.",
    "learning.card4.cat": "Quantum computing",
    "learning.card4.title": "Circuits and gates",
    "learning.card4.desc": "Build circuits with one- and two-qubit gates and simulate them with Harmoniq.",
    "learning.resources.title": "Additional resources",
    "learning.res1.title": "Harmoniq on video",
    "learning.res1.desc": "Visual walkthroughs of the SDK, runtime, and integration examples.",
    "learning.res1.cta": "Browse videos",
    "learning.res2.title": "Hands-on tutorials",
    "learning.res2.desc": "Step-by-step guides with copy-paste code.",
    "learning.res2.cta": "View tutorials",
    "learning.toc.hero": "Introduction",
    "learning.toc.modules": "Modules",
    "learning.toc.courses": "Courses",
    "learning.toc.resources": "Resources",
  },
};

function setTopNavCurrent() {
  const path = window.location.pathname.replace(/\\/g, "/");
  const file = path.split("/").pop() || "";
  const navLinks = document.querySelectorAll(".top-nav-link[data-nav]");
  let activeNav = "docs";
  if (file === "referencias-api.html") activeNav = "api";
  else if (file === "tutoriales.html") activeNav = "articles";
  else if (file === "index.html" || file === "") activeNav = "docs";
  else if (file === "articulos.html" || file === "learning.html") activeNav = "articles";
  else activeNav = "docs";

  navLinks.forEach((link) => {
    link.removeAttribute("aria-current");
    if (activeNav && link.dataset.nav === activeNav) {
      link.setAttribute("aria-current", "page");
    }
  });
}

function closeLangDropdown() {
  if (!langDropdown?.classList.contains("is-open")) return;
  langDropdown.classList.remove("is-open");
  langDropdownToggle?.setAttribute("aria-expanded", "false");
}

function pathMatchesCurrent(linkUrl, here) {
  const a = linkUrl.pathname.replace(/\/$/, "") || "/";
  const b = here.pathname.replace(/\/$/, "") || "/";
  return a === b;
}

function getDocsRootUrl() {
  const here = new URL(window.location.href);
  if (/\/paginas\/[^/]+\.html$/i.test(here.pathname)) {
    return new URL("../", here.href);
  }
  return new URL("./", here.href);
}

/** Ruta del HTML actual respecto a la raíz de la documentación (p. ej. index.html, paginas/api.html). */
function currentDocPageKey() {
  const p = window.location.pathname.replace(/\\/g, "/");
  const m = p.match(/(?:paginas\/[^/]+\.html|[^/]+\.html)$/i);
  return m ? m[0] : p.split("/").filter(Boolean).pop() || "index.html";
}

function shortPageTitle(full) {
  if (!full) return "";
  const i = full.indexOf("|");
  return (i >= 0 ? full.slice(0, i) : full).trim();
}

function getPageIcon(page) {
  if (!page) return "ph-book-open";
  const p = page.replace(/^\.\.\//, "").replace(/^\//, "");
  const iconMap = {
    "index.html":                                          "ph-house",
    "articulos.html":                                      "ph-graduation-cap",
    "tutoriales.html":                                     "ph-video",
    "programacion-cuantica.html":                          "ph-code-block",
    "referencias-api.html":                                "ph-brackets-curly",
    "paginas/fundamento-teorico.html":                     "ph-notebook",
    "paginas/workflow.html":                               "ph-blueprint",
    "paginas/qubits.html":                                 "ph-sphere",
    "paginas/casos-uso-cuanticos.html":                    "ph-puzzle-piece",
    "paginas/teoria-cuantica.html":                        "ph-wave-sine",
    "paginas/simuladores.html":                            "ph-cpu",
    "paginas/compositor.html":                             "ph-flow-arrow",
    "paginas/source.html":                                 "ph-scroll",
    "paginas/code-examples.html":                          "ph-code",
    "paginas/api.html":                                    "ph-brackets-curly",
    "paginas/overview.html":                               "ph-compass",
    "paginas/tutoriales.html":                             "ph-video",
    "paginas/curso-fundamentos-informacion-cuantica.html": "ph-graduation-cap",
    "paginas/curso-circuitos-simulacion.html":             "ph-circuit-board",
    "paginas/ejemplo-bell-state.html":                     "ph-atom",
    "paginas/ejemplo-deutsch-jozsa.html":                  "ph-function",
    "paginas/ejemplo-grover.html":                         "ph-magnifying-glass-plus",
    "paginas/base-superposicion.html":                     "ph-wave-sine",
    "paginas/base-algoritmos.html":                        "ph-graph",
    "paginas/base-circuitos-puertas.html":                 "ph-circuit-board",
    "paginas/base-incertidumbre.html":                     "ph-chart-line",
  };
  return iconMap[p] || "ph-book-open";
}

function hrefForSearchEntry(page, sectionId) {
  const root = getDocsRootUrl();
  const u = new URL(page, root.href);
  if (sectionId) {
    u.hash = encodeURIComponent(sectionId);
  }
  return u.href;
}

async function loadSearchIndex() {
  if (searchIndexCache) return searchIndexCache;
  if (!searchIndexLoadPromise) {
    const root = getDocsRootUrl();
    const url = new URL(`search-index.json${SEARCH_INDEX_VERSION ? `?v=${SEARCH_INDEX_VERSION}` : ""}`, root.href);
    searchIndexLoadPromise = fetch(url.href)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((data) => {
        searchIndexCache =
          data && Array.isArray(data.entries)
            ? { entries: data.entries, pages: data.pages && typeof data.pages === "object" ? data.pages : {} }
            : { entries: [], pages: {} };
        return searchIndexCache;
      });
  }
  return searchIndexLoadPromise;
}

/** Solo un ítem activo en «Primeros pasos»: el que coincide con la URL actual (sin #). */
function enforcePrimerosPasosExclusiveNavActive() {
  const panel = document.querySelector(".left-nav-panel");
  if (!panel) return;
  const firstSec = panel.querySelector(":scope > .nav-section");
  if (!firstSec) return;
  const here = new URL(window.location.href);
  const items = Array.from(firstSec.querySelectorAll("a.nav-item[href]")).filter((a) => {
    const h = a.getAttribute("href") || "";
    return !h.startsWith("http") && !h.startsWith("//") && !h.includes("#");
  });
  let keep = null;
  for (const link of items) {
    const href = link.getAttribute("href") || "";
    let u;
    try {
      u = new URL(href, here.href);
    } catch {
      continue;
    }
    if (pathMatchesCurrent(u, here)) {
      keep = link;
      break;
    }
  }
  items.forEach((link) => {
    if (link !== keep) link.classList.remove("toc-active");
  });
}

function applyLeftNavActive(currentId) {
  const here = new URL(window.location.href);
  const leftLinks = Array.from(document.querySelectorAll(".left-nav a.nav-item, .left-nav a.nav-sublink"));

  leftLinks.forEach((link) => link.classList.remove("toc-active"));

  const withHash = leftLinks.filter((link) => {
    const h = link.getAttribute("href") || "";
    return h.includes("#") && !h.startsWith("http");
  });
  const noHash = leftLinks.filter((link) => {
    const h = link.getAttribute("href") || "";
    return !h.includes("#") && !h.startsWith("http");
  });

  withHash.forEach((link) => {
    const href = link.getAttribute("href") || "";
    const hash = href.split("#")[1];
    if (!hash) return;
    const pathPart = href.split("#")[0];
    let baseUrl;
    try {
      baseUrl = pathPart ? new URL(pathPart, here.href) : here;
    } catch {
      return;
    }
    if (!pathMatchesCurrent(baseUrl, here)) return;
    if (hash === currentId) link.classList.add("toc-active");
  });

  const hasHashMatch = withHash.some((link) => link.classList.contains("toc-active"));
  if (!hasHashMatch) {
    noHash.forEach((link) => {
      const href = link.getAttribute("href") || "";
      if (!href) return;
      let linkUrl;
      try {
        linkUrl = new URL(link.href);
      } catch {
        return;
      }
      if (pathMatchesCurrent(linkUrl, here)) link.classList.add("toc-active");
    });
  }

  enforcePrimerosPasosExclusiveNavActive();
  syncLeftNavGroupsOpen();
}

/** Páginas con `main[data-doc-views]`: una sola sección visible según el hash (#id). */
function syncDocViewMode() {
  const main = document.querySelector("main.doc-content[data-doc-views]");
  if (!main) return;

  const secs = Array.from(main.querySelectorAll(":scope > section[id]"));
  if (secs.length < 2) return;

  const ids = new Set(secs.map((s) => s.id));
  let raw = window.location.hash.replace(/^#/, "");
  try {
    raw = decodeURIComponent(raw);
  } catch {
    /* keep raw */
  }

  let id = raw;
  if (!id || !ids.has(id)) {
    id = ids.has("page-body") ? "page-body" : secs[0].id;
    if (typeof history.replaceState === "function" && window.location.hash !== `#${id}`) {
      const url = new URL(window.location.href);
      url.hash = id;
      history.replaceState(null, "", url.href);
    }
  }

  secs.forEach((s) => {
    s.classList.toggle("doc-view-hidden", s.id !== id);
  });
  main.classList.add("doc-views-on");
  window.scrollTo(0, 0);
}

function setActiveLink() {
  const mainViews = document.querySelector("main.doc-content.doc-views-on");
  let currentId = "";

  if (mainViews) {
    let h = window.location.hash.replace(/^#/, "");
    try {
      h = decodeURIComponent(h);
    } catch {
      /* keep h */
    }
    const allowed = new Set(
      Array.from(mainViews.querySelectorAll(":scope > section[id]")).map((s) => s.id),
    );
    if (allowed.has(h)) {
      currentId = h;
    } else {
      currentId = allowed.has("page-body") ? "page-body" : Array.from(allowed)[0] || "";
    }
  } else {
    const position = window.scrollY + 120;
    const mainSecs = getMainSections();
    const visibleSections = mainSecs.filter((section) => !section.classList.contains("hidden-by-search"));
    currentId = visibleSections[0]?.id || mainSecs[0]?.id || "";

    for (const section of visibleSections) {
      if (section.offsetTop <= position) {
        currentId = section.id;
      }
    }
  }

  getRightTocLinks().forEach((link) => {
    const isActive = link.getAttribute("href") === `#${currentId}`;
    link.classList.toggle("toc-active", isActive);
  });

  const mobileTocLinks = Array.from(document.querySelectorAll(".mobile-toc-panel a")).filter((el) => {
    const href = el.getAttribute("href");
    return href && href.startsWith("#") && href.length > 1;
  });
  mobileTocLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${currentId}`;
    link.classList.toggle("toc-active", isActive);
  });

  syncTocAccordionOpen();
  applyLeftNavActive(currentId);
}

function initMobileToc() {
  const isMobile = window.matchMedia("(max-width: 840px)").matches;
  const existing = document.querySelector(".mobile-toc");

  if (!isMobile) {
    if (existing) existing.remove();
    return;
  }

  if (existing) existing.remove();
  const toc = document.querySelector(".right-toc .right-toc-body");
  if (!toc) return;
  const content = document.querySelector("main.doc-content");
  if (!content) return;

  const firstH1 = content.querySelector("h1");
  const insertAfter = firstH1 ? firstH1 : content.firstElementChild;
  if (!insertAfter) return;

  const links = Array.from(toc.querySelectorAll("a")).filter((a) => {
    const href = a.getAttribute("href") || "";
    return href.startsWith("#") && href.length > 1;
  });
  if (links.length === 0) return;

  const wrapper = document.createElement("div");
  wrapper.className = "mobile-toc";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "mobile-toc-btn";
  button.setAttribute("aria-expanded", "false");

  button.innerHTML = `
    <span class="mobile-toc-btn-left">
      <i class="ph ph-list" aria-hidden="true"></i>
      <span class="mobile-toc-btn-title" data-i18n="right.title">En esta página</span>
    </span>
    <i class="ph ph-caret-down mobile-toc-btn-caret" aria-hidden="true"></i>
  `;

  const panel = document.createElement("div");
  panel.className = "mobile-toc-panel";
  panel.hidden = true;
  const list = document.createElement("div");
  list.className = "mobile-toc-links";

  links.forEach((a) => {
    const clone = a.cloneNode(true);
    clone.classList.remove("right-toc-link", "right-toc-link--lead", "right-toc-sublink");
    clone.classList.add("mobile-toc-link");
    list.appendChild(clone);
  });

  panel.appendChild(list);
  wrapper.appendChild(button);
  wrapper.appendChild(panel);

  insertAfter.insertAdjacentElement("afterend", wrapper);

  button.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", open ? "false" : "true");
    panel.hidden = open;
  });

  wrapper.addEventListener("click", (e) => {
    const a = e.target && e.target.closest ? e.target.closest("a") : null;
    if (!a) return;
    button.setAttribute("aria-expanded", "false");
    panel.hidden = true;
  });

  try {
    const lang = getStoredLang();
    applyLanguage(lang);
  } catch {}
}

function ensureHelpModal() {
  if (document.getElementById("helpModal")) return;

  const modal = document.createElement("div");
  modal.className = "help-modal";
  modal.id = "helpModal";
  modal.setAttribute("aria-hidden", "true");

  modal.innerHTML = `
    <div class="help-modal-backdrop" data-help-close></div>
    <div class="help-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="helpModalTitle">
      <div class="help-modal-header">
        <div>
          <h2 class="help-modal-title" id="helpModalTitle">
            <i class="ph ph-question" aria-hidden="true"></i>
            <span data-i18n="help.title">Ayuda</span>
          </h2>
          <p class="help-modal-subtitle" data-i18n="help.subtitle">
            Cuéntanos tu solicitud. Un miembro de nuestro equipo la revisará en la brevedad.
          </p>
        </div>
        <button type="button" class="help-modal-close" aria-label="Cerrar" data-help-close>
          <i class="ph ph-x" aria-hidden="true"></i>
        </button>
      </div>
      <div class="help-modal-body">
        <form class="help-form" id="helpForm">
          <div class="help-field">
            <label class="help-label" for="helpName" data-i18n="help.name">Nombre</label>
            <input class="help-input" id="helpName" name="name" type="text" autocomplete="name" required />
          </div>
          <div class="help-field">
            <label class="help-label" for="helpEmail" data-i18n="help.email">Correo</label>
            <input class="help-input" id="helpEmail" name="email" type="email" autocomplete="email" required />
          </div>
          <div class="help-field full">
            <label class="help-label" for="helpSubject" data-i18n="help.subject">Asunto</label>
            <input class="help-input" id="helpSubject" name="subject" type="text" required />
          </div>
          <div class="help-field full">
            <label class="help-label" for="helpMessage" data-i18n="help.message">Mensaje</label>
            <textarea class="help-textarea" id="helpMessage" name="message" required></textarea>
          </div>
          <div class="help-actions">
            <button type="button" class="help-btn help-btn--ghost" data-help-close data-i18n="help.cancel">Cancelar</button>
            <button type="submit" class="help-btn help-btn--primary" data-i18n="help.send">Enviar solicitud</button>
          </div>
        </form>

        <div class="help-success" id="helpSuccess" aria-live="polite">
          <div class="help-success-card">
            <p class="help-success-title" data-i18n="help.successTitle">Solicitud enviada</p>
            <p class="help-success-desc" data-i18n="help.successDesc">
              Gracias. Revisaremos tu solicitud en la brevedad y te contactaremos por correo.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  function open() {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    const nameInput = modal.querySelector("#helpName");
    if (nameInput) nameInput.focus();
  }

  function close() {
    modal.classList.remove("is-open");
    window.setTimeout(() => {
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }, 400);
    const form = modal.querySelector("#helpForm");
    const success = modal.querySelector("#helpSuccess");
    if (form) form.hidden = false;
    if (success) success.classList.remove("is-visible");
  }

  document.addEventListener("click", (e) => {
    const trigger = e.target && e.target.closest ? e.target.closest("[data-help-trigger]") : null;
    if (trigger) {
      ensureHelpModal();
      open();
      return;
    }
    const closeBtn = e.target && e.target.closest ? e.target.closest("[data-help-close]") : null;
    if (closeBtn && modal.classList.contains("is-open")) {
      close();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) close();
  });

  const form = modal.querySelector("#helpForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const success = modal.querySelector("#helpSuccess");
      form.hidden = true;
      if (success) success.classList.add("is-visible");
      window.setTimeout(() => close(), 1600);
    });
  }

  // apply i18n for injected nodes
  try {
    const lang = getStoredLang();
    applyLanguage(lang);
  } catch {}
}

function syncTocAccordionOpen() {
  document.querySelectorAll("[data-toc-accordion]").forEach((acc) => {
    const activeInside = acc.querySelector("a.toc-active");
    const btn = acc.querySelector(".toc-accordion-btn");
    if (activeInside) {
      acc.classList.add("is-open");
      if (btn) btn.setAttribute("aria-expanded", "true");
    }
  });
}

function syncLeftNavGroupsOpen() {
  document.querySelectorAll(".left-nav [data-nav-group]").forEach((g) => {
    const activeInside = g.querySelector("a.toc-active");
    const btn = g.querySelector(".nav-group-toggle");
    if (activeInside) {
      g.classList.add("is-open");
      if (btn) btn.setAttribute("aria-expanded", "true");
    } else {
      g.classList.remove("is-open");
      if (btn) btn.setAttribute("aria-expanded", "false");
    }
  });
}

function isLeftNavCollapsedFlyoutMode() {
  if (!document.body.classList.contains(SIDEBAR_COLLAPSED_CLASS)) return false;
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(min-width: 841px)").matches;
}

function closeLeftNavFlyout() {
  if (leftNavFlyoutEl) {
    leftNavFlyoutEl.classList.remove("is-open");
    leftNavFlyoutEl.setAttribute("hidden", "");
  }
  if (leftNavFlyoutAnchorBtn) {
    leftNavFlyoutAnchorBtn.setAttribute("aria-expanded", "false");
    leftNavFlyoutAnchorBtn = null;
  }
}

function positionLeftNavFlyout(anchorBtn) {
  if (!leftNavFlyoutEl || !anchorBtn) return;
  const margin = 8;
  const r = anchorBtn.getBoundingClientRect();
  const fw = leftNavFlyoutEl.offsetWidth || 240;
  const fh = leftNavFlyoutEl.offsetHeight || 120;
  let left = r.right + margin;
  if (left + fw > window.innerWidth - margin) {
    left = r.left - fw - margin;
  }
  if (left < margin) left = margin;
  let top = r.top;
  if (top + fh > window.innerHeight - margin) {
    top = Math.max(margin, window.innerHeight - fh - margin);
  }
  leftNavFlyoutEl.style.left = `${Math.round(left)}px`;
  leftNavFlyoutEl.style.top = `${Math.round(top)}px`;
}

function openLeftNavFlyout(anchorBtn, group) {
  const panel = group.querySelector(".nav-group-panel");
  if (!panel) return;
  const labelEl = anchorBtn.querySelector(".nav-group-toggle-label");
  if (!labelEl) return;

  if (leftNavFlyoutAnchorBtn === anchorBtn && leftNavFlyoutEl?.classList.contains("is-open")) {
    closeLeftNavFlyout();
    return;
  }

  closeLeftNavFlyout();

  if (!leftNavFlyoutEl) {
    leftNavFlyoutEl = document.createElement("div");
    leftNavFlyoutEl.className = "left-nav-flyout";
    leftNavFlyoutEl.setAttribute("role", "menu");
    leftNavFlyoutEl.setAttribute("hidden", "");
    leftNavFlyoutEl.addEventListener("click", (e) => {
      if (e.target.closest("a.left-nav-flyout-link")) {
        window.setTimeout(() => closeLeftNavFlyout(), 0);
      }
    });
    document.body.appendChild(leftNavFlyoutEl);
  }

  const badge = document.createElement("div");
  badge.className = "left-nav-flyout-badge";
  const badgeInner = document.createElement("span");
  const i18nKey = labelEl.getAttribute("data-i18n");
  if (i18nKey) badgeInner.setAttribute("data-i18n", i18nKey);
  badgeInner.textContent = labelEl.textContent || "";
  badge.appendChild(badgeInner);

  const linksWrap = document.createElement("div");
  linksWrap.className = "left-nav-flyout-links";
  panel.querySelectorAll("a.nav-sublink").forEach((a) => {
    const c = a.cloneNode(true);
    c.classList.remove("nav-sublink");
    c.classList.add("left-nav-flyout-link");
    c.setAttribute("role", "menuitem");
    linksWrap.appendChild(c);
  });

  leftNavFlyoutEl.replaceChildren(badge, linksWrap);

  try {
    const lang = getStoredLang();
    const dictionary = translations[lang] || translations.es;
    leftNavFlyoutEl.querySelectorAll("[data-i18n]").forEach((node) => {
      const key = node.getAttribute("data-i18n");
      if (dictionary[key]) node.innerHTML = dictionary[key];
    });
  } catch {
    /* ignore */
  }

  leftNavFlyoutEl.removeAttribute("hidden");
  leftNavFlyoutEl.classList.add("is-open");
  leftNavFlyoutAnchorBtn = anchorBtn;
  anchorBtn.setAttribute("aria-expanded", "true");

  document.querySelectorAll(".left-nav [data-nav-group] .nav-group-toggle").forEach((b) => {
    if (b !== anchorBtn) b.setAttribute("aria-expanded", "false");
  });

  window.requestAnimationFrame(() => {
    positionLeftNavFlyout(anchorBtn);
  });
}

function initLeftNavFlyoutGlobalListeners() {
  if (initLeftNavFlyoutGlobalListeners.bound) return;
  initLeftNavFlyoutGlobalListeners.bound = true;

  document.addEventListener(
    "mousedown",
    (e) => {
      if (!leftNavFlyoutEl?.classList.contains("is-open")) return;
      if (leftNavFlyoutEl.contains(e.target)) return;
      if (e.target.closest?.(".left-nav .nav-group-toggle")) return;
      closeLeftNavFlyout();
    },
    true,
  );

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!leftNavFlyoutEl?.classList.contains("is-open")) return;
    closeLeftNavFlyout();
  });

  window.addEventListener(
    "resize",
    () => {
      if (!isLeftNavCollapsedFlyoutMode()) {
        closeLeftNavFlyout();
        return;
      }
      if (leftNavFlyoutEl?.classList.contains("is-open") && leftNavFlyoutAnchorBtn) {
        positionLeftNavFlyout(leftNavFlyoutAnchorBtn);
      }
    },
    { passive: true },
  );

  window.addEventListener(
    "scroll",
    () => {
      if (leftNavFlyoutEl?.classList.contains("is-open") && leftNavFlyoutAnchorBtn) {
        positionLeftNavFlyout(leftNavFlyoutAnchorBtn);
      }
    },
    { passive: true, capture: true },
  );
}

function initTocAccordions() {
  document.querySelectorAll(".toc-accordion-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const acc = btn.closest("[data-toc-accordion]");
      if (!acc) return;
      const open = acc.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });
}

function initLeftNavGroups() {
  document.querySelectorAll(".left-nav [data-nav-group] .nav-group-toggle").forEach((btn) => {
    btn.setAttribute("aria-haspopup", "true");
    btn.addEventListener("click", () => {
      const g = btn.closest("[data-nav-group]");
      if (!g) return;

      if (isLeftNavCollapsedFlyoutMode()) {
        openLeftNavFlyout(btn, g);
        return;
      }

      const open = g.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  initLeftNavFlyoutGlobalListeners();
}

function applyLanguage(language) {
  const dictionary = translations[language] || translations.es;
  document.documentElement.lang = language;

  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    if (dictionary[key]) node.innerHTML = dictionary[key];
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    const key = node.getAttribute("data-i18n-placeholder");
    if (dictionary[key]) node.setAttribute("placeholder", dictionary[key]);
  });

  document.querySelectorAll("[data-i18n-aria-label]").forEach((node) => {
    const key = node.getAttribute("data-i18n-aria-label");
    if (dictionary[key]) node.setAttribute("aria-label", dictionary[key]);
  });

  langButtons.forEach((button) => {
    const isSelected = button.dataset.lang === language;
    button.classList.toggle("is-active", isSelected);
    button.setAttribute("aria-selected", isSelected ? "true" : "false");
  });

  if (langLabel) langLabel.textContent = language === "en" ? "EN" : "ES";

  writeStorage(STORAGE_KEYS.lang, language);

  if (searchInput) {
    void filterDocumentation(searchInput.value || "");
  }

  syncLeftNavToggleLabels();
}

function applyTheme(mode) {
  const resolvedTheme = mode === "system" ? (systemThemeQuery.matches ? "dark" : "light") : mode;
  const isLight = resolvedTheme === "light";
  document.body.classList.toggle("light-mode", isLight);
  document.documentElement.classList.toggle("light-mode", isLight);

  themeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.theme === mode);
  });

  if (favicon) {
    const name = isLight ? "favicon-light.svg" : "favicon-dark.svg";
    const prev = favicon.getAttribute("href") || "./favicon-dark.svg";
    const base = prev.replace(/favicon-(?:dark|light)\.svg\s*$/i, "");
    favicon.setAttribute("href", `${base}${name}`);
  }

  writeStorage(STORAGE_KEYS.theme, mode);
}

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value || fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage write failures (private/restricted contexts).
  }
}

function getStoredLang() {
  return readStorage(STORAGE_KEYS.lang, document.documentElement.lang || DEFAULT_LANG);
}

function getStoredTheme() {
  return readStorage(STORAGE_KEYS.theme, DEFAULT_THEME);
}

function getCurrentLang() {
  return getStoredLang();
}

function getSectionTitle(section) {
  const h2 = section.querySelector("h2");
  if (h2) return (h2.textContent || "").trim();
  const h1 = section.querySelector("h1");
  if (h1) return (h1.textContent || "").trim();
  return section.id || "";
}

function highlightTermInHtml(raw, term) {
  const trimmed = term.trim();
  if (!trimmed) return escapeHtml(raw);
  try {
    const re = new RegExp(`(${escapeRegex(trimmed)})`, "gi");
    return escapeHtml(raw).replace(re, '<mark class="search-highlight">$1</mark>');
  } catch {
    return escapeHtml(raw);
  }
}

function renderSearchResultsList(term, matches, pagesMap = {}) {
  if (!searchResultsList || !searchEmptyBlock || !searchEmptyHint || !searchNoResultsMsg) return;

  const normalizedTerm = normalizeText(term.trim());
  const lang = getCurrentLang();
  const dict = translations[lang] || translations.es;

  if (!normalizedTerm) {
    searchEmptyBlock.hidden = false;
    searchEmptyHint.hidden = false;
    searchNoResultsMsg.hidden = true;
    searchEmptyBlock.classList.remove("is-no-results");
    searchResultsList.hidden = true;
    searchResultsList.innerHTML = "";
    return;
  }

  if (matches.length === 0) {
    searchEmptyBlock.hidden = false;
    searchEmptyHint.hidden = true;
    searchNoResultsMsg.hidden = false;
    searchEmptyBlock.classList.add("is-no-results");
    searchResultsList.hidden = true;
    searchResultsList.innerHTML = "";
    return;
  }

  searchEmptyBlock.hidden = true;
  searchEmptyBlock.classList.remove("is-no-results");
  searchResultsList.hidden = false;

  const root = dict["search.breadcrumbRoot"] || "Documentación";

  searchResultsList.innerHTML = matches
    .map((m) => {
      if (m.type === "local") {
        const section = m.section;
        const title = getSectionTitle(section);
        const bc = `${escapeHtml(root)} → ${escapeHtml(title)}`;
        const titleHtml = highlightTermInHtml(title, term);
        const sid = escapeHtml(section.id);
        const currentPage = window.location.pathname.split("/").pop() || "index.html";
        const icon = getPageIcon(currentPage);
        return `<li class="search-result-item" role="none">
    <a class="search-result-link" href="#${sid}">
      <span class="search-result-bc">${bc}</span>
      <span class="search-result-main">
        <i class="ph ${icon} search-result-icon" aria-hidden="true"></i>
        <span class="search-result-title">${titleHtml}</span>
        <span class="search-result-enter" aria-hidden="true">↵</span>
      </span>
    </a>
  </li>`;
      }

      const pageLabel = shortPageTitle(pagesMap[m.p] || m.p || "");
      const titleHtml = highlightTermInHtml(m.t || m.id, term);
      const bc = `${escapeHtml(root)} → ${escapeHtml(pageLabel)} → ${escapeHtml(m.t || m.id)}`;
      const href = escapeHtml(hrefForSearchEntry(m.p, m.id));
      const icon = getPageIcon(m.p);
      return `<li class="search-result-item" role="none">
    <a class="search-result-link" href="${href}">
      <span class="search-result-bc">${bc}</span>
      <span class="search-result-main">
        <i class="ph ${icon} search-result-icon" aria-hidden="true"></i>
        <span class="search-result-title">${titleHtml}</span>
        <span class="search-result-enter" aria-hidden="true">↵</span>
      </span>
    </a>
  </li>`;
    })
    .join("");
}

function decorateCodeBlocks() {
  const codeBlocks = Array.from(document.querySelectorAll(".code-card code[id]"));
  codeBlocks.forEach((block) => {
    if (block.dataset.decorated === "true") return;

    const raw = (block.textContent || "").replace(/\r\n/g, "\n");
    block.dataset.raw = raw;

    const lines = raw.split("\n");
    block.innerHTML = lines
      .map((line, index) => {
        const lineNumber = String(index + 1);
        const safeLine = line.length ? escapeHtml(line) : " ";
        return `<span class="code-line"><span class="code-ln">${lineNumber}</span><span class="code-lc">${safeLine}</span></span>`;
      })
      .join("");

    block.dataset.decorated = "true";
  });
}

const REMOTE_SEARCH_MAX = 48;

async function filterDocumentation(term) {
  const normalizedTerm = normalizeText(term.trim());
  const localMatches = [];

  getMainSections().forEach((section) => {
    if (!normalizedTerm) {
      section.classList.remove("hidden-by-search");
      return;
    }

    const sectionText = normalizeText(section.textContent || "");
    if (sectionText.includes(normalizedTerm)) {
      localMatches.push({ type: "local", section });
    }
  });

  const here = currentDocPageKey();
  const localKeys = new Set(localMatches.map((m) => `${here}#${m.section.id}`));

  let pagesMap = {};
  let remoteMatches = [];
  if (normalizedTerm) {
    const data = await loadSearchIndex();
    pagesMap = data.pages || {};
    const nt = normalizedTerm;
    remoteMatches = (data.entries || [])
      .filter((e) => {
        if (!e || !e.p || !e.id) return false;
        if (localKeys.has(`${e.p}#${e.id}`)) return false;
        const blob = normalizeText(`${e.txt || ""} ${e.t || ""}`);
        return blob.includes(nt);
      })
      .sort((a, b) => {
        const pa = (a.p || "").localeCompare(b.p || "", undefined, { sensitivity: "base" });
        if (pa !== 0) return pa;
        return (a.t || a.id || "").localeCompare(b.t || b.id || "", undefined, { sensitivity: "base" });
      })
      .slice(0, REMOTE_SEARCH_MAX)
      .map((e) => ({ type: "remote", p: e.p, id: e.id, t: e.t || e.id, txt: e.txt }));
  }

  const matches = [...localMatches, ...remoteMatches];
  renderSearchResultsList(term, matches, pagesMap);
  syncSearchHeaderChrome();
  if (!normalizedTerm) {
    setActiveLink();
  }
}

function syncSearchHeaderChrome() {
  if (!searchWrap || !searchInput) return;
  searchWrap.classList.toggle("search-has-text", searchInput.value.length > 0);
}

function closeSearchPanel() {
  searchWrap?.classList.remove("is-open");
  searchWrap?.classList.remove("search-has-text");
  document.body.classList.remove("search-open");
  searchDropdown?.setAttribute("hidden", "");
  searchToggle?.setAttribute("aria-expanded", "false");
}

function openSearch() {
  if (!searchWrap || !searchDropdown) return;
  searchWrap.classList.add("is-open");
  document.body.classList.add("search-open");
  searchDropdown.removeAttribute("hidden");
  searchToggle?.setAttribute("aria-expanded", "true");
  searchInput?.focus();
  void filterDocumentation(searchInput?.value || "");
}

searchWrap?.addEventListener("mousedown", (e) => {
  e.stopPropagation();
});

searchToggle?.addEventListener("click", (e) => {
  e.stopPropagation();
  const isOpen = searchWrap?.classList.contains("is-open");
  if (isOpen) {
    searchInput?.focus();
  } else {
    queueMicrotask(() => openSearch());
  }
});

searchInput?.addEventListener("input", (event) => {
  void filterDocumentation(event.target.value);
  if (!searchWrap?.classList.contains("is-open")) openSearch();
});

searchInput?.addEventListener("focus", () => {
  if (!searchWrap?.classList.contains("is-open")) openSearch();
});

searchInput?.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    searchInput.value = "";
    void filterDocumentation("");
    closeSearchPanel();
  }
});

searchResultsList?.addEventListener("click", (e) => {
  const link = e.target.closest("a.search-result-link");
  if (!link) return;
  closeSearchPanel();
});

document.addEventListener("mousedown", (e) => {
  if (!searchWrap?.classList.contains("is-open")) return;
  if (searchWrap.contains(e.target)) return;
  closeSearchPanel();
});

searchBox?.addEventListener("submit", (event) => event.preventDefault());

langButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selected = button.dataset.lang || "es";
    applyLanguage(selected);
    const themeSaved = getStoredTheme();
    applyTheme(themeSaved);
    closeLangDropdown();
  });
});

langDropdown?.addEventListener("mousedown", (e) => {
  e.stopPropagation();
});

langDropdownToggle?.addEventListener("click", (event) => {
  event.stopPropagation();
  const willOpen = !langDropdown?.classList.contains("is-open");
  if (!willOpen) {
    closeLangDropdown();
    return;
  }
  queueMicrotask(() => {
    langDropdown?.classList.add("is-open");
    langDropdownToggle?.setAttribute("aria-expanded", "true");
  });
});

/** Fase captura + clic fuera: en Chrome el orden de eventos no cierra el menú al abrirlo. */
function handleDocumentClickCloseLang(event) {
  if (!langDropdown?.classList.contains("is-open")) return;
  if (langDropdown.contains(event.target)) return;
  closeLangDropdown();
}

document.addEventListener("click", handleDocumentClickCloseLang, true);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeLangDropdown();
});

themeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedMode = button.dataset.theme || "system";
    applyTheme(selectedMode);
  });
});

copyButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const targetId = button.getAttribute("data-copy-target");
    const codeNode = targetId ? document.getElementById(targetId) : null;
    if (!codeNode) return;

    const codeText = codeNode.dataset.raw || codeNode.textContent || "";
    try {
      await navigator.clipboard.writeText(codeText);
      button.classList.add("copied");
      const icon = button.querySelector("i");
      if (icon) icon.className = "ph ph-check";
      setTimeout(() => {
        button.classList.remove("copied");
        if (icon) icon.className = "ph ph-copy";
      }, 1200);
    } catch {
      // No-op fallback for restricted clipboard contexts.
    }
  });
});

systemThemeQuery.addEventListener("change", () => {
  const currentMode = getStoredTheme();
  if (currentMode === "system") applyTheme("system");
});

function syncLeftNavToggleLabels() {
  const btn = document.getElementById("leftNavToggle");
  if (!btn) return;
  const lang = getCurrentLang();
  const dict = translations[lang] || translations.es;
  const collapsed = document.body.classList.contains(SIDEBAR_COLLAPSED_CLASS);
  const label = collapsed ? dict["nav.expand"] : dict["nav.collapse"];
  if (label) {
    btn.setAttribute("aria-label", label);
    btn.setAttribute("title", label);
  }
  btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
}

function syncLeftNavLinkTitles() {
  if (typeof window.matchMedia === "function" && window.matchMedia("(max-width: 840px)").matches) {
    document.querySelectorAll(".left-nav .nav-item").forEach((link) => link.removeAttribute("title"));
    document.querySelectorAll(".left-nav .nav-group-toggle").forEach((btn) => {
      btn.removeAttribute("title");
      btn.removeAttribute("aria-label");
    });
    return;
  }
  const collapsed = document.body.classList.contains(SIDEBAR_COLLAPSED_CLASS);
  document.querySelectorAll(".left-nav .nav-item").forEach((link) => {
    const span = link.querySelector("span");
    const text = (span?.textContent || "").trim();
    if (collapsed && text) {
      link.setAttribute("title", text);
    } else {
      link.removeAttribute("title");
    }
  });

  document.querySelectorAll(".left-nav .nav-group-toggle").forEach((btn) => {
    const label = btn.querySelector(".nav-group-toggle-label");
    const text = (label?.textContent || "").trim();
    if (collapsed && text) {
      btn.setAttribute("title", text);
      btn.setAttribute("aria-label", text);
    } else {
      btn.removeAttribute("title");
      btn.removeAttribute("aria-label");
    }
  });
}

function attachLeftNavScrollPersistence() {
  const panel = document.getElementById("leftNavPanel");
  if (!panel || panel.dataset.scrollPersistBound === "1") return;
  panel.dataset.scrollPersistBound = "1";
  let scrollSaveTimer = 0;
  try {
    const y = sessionStorage.getItem(STORAGE_KEYS.leftNavScroll);
    if (y != null && y !== "") panel.scrollTop = parseInt(y, 10) || 0;
  } catch {
    /* ignore */
  }
  panel.addEventListener(
    "scroll",
    () => {
      window.clearTimeout(scrollSaveTimer);
      scrollSaveTimer = window.setTimeout(() => {
        try {
          sessionStorage.setItem(STORAGE_KEYS.leftNavScroll, String(panel.scrollTop));
        } catch {
          /* ignore */
        }
      }, 150);
    },
    { passive: true },
  );
}

function initLeftNavToggle() {
  const btn = document.getElementById("leftNavToggle");
  if (!btn) return;
  function applySidebarState() {
    const collapsed = readStorage(STORAGE_KEYS.sidebar, "expanded") === "collapsed";
    document.body.classList.toggle(SIDEBAR_COLLAPSED_CLASS, collapsed);
    if (!collapsed) closeLeftNavFlyout();
    syncLeftNavToggleLabels();
    syncLeftNavLinkTitles();
  }

  applySidebarState();
  attachLeftNavScrollPersistence();

  btn.addEventListener("click", () => {
    const willCollapse = !document.body.classList.contains(SIDEBAR_COLLAPSED_CLASS);
    document.body.classList.toggle(SIDEBAR_COLLAPSED_CLASS, willCollapse);
    writeStorage(STORAGE_KEYS.sidebar, willCollapse ? "collapsed" : "expanded");
    closeLeftNavFlyout();
    syncLeftNavToggleLabels();
    syncLeftNavLinkTitles();
  });

  window.addEventListener(
    "resize",
    () => {
      syncLeftNavLinkTitles();
    },
    { passive: true },
  );
}

function renderKatexInDocRoot() {
  var root = document.querySelector(".qubits-article-inner") || document.querySelector("main.doc-content");
  if (!root) return;
  var hasMath = /\\\(|\\\[|\$\$/.test(root.textContent);
  if (!hasMath) return;

  function doRender() {
    if (typeof renderMathInElement !== "function") return;
    try {
      renderMathInElement(root, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true },
        ],
        throwOnError: false,
        strict: "ignore",
      });
    } catch { /* ignore */ }
  }

  if (typeof renderMathInElement === "function") {
    doRender();
    return;
  }

  var katexCss = document.querySelector('link[href*="katex"]');
  if (!katexCss) {
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css";
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  }

  var s1 = document.createElement("script");
  s1.src = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js";
  s1.crossOrigin = "anonymous";
  s1.onload = function () {
    var s2 = document.createElement("script");
    s2.src = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js";
    s2.crossOrigin = "anonymous";
    s2.onload = doRender;
    document.head.appendChild(s2);
  };
  document.head.appendChild(s1);
}

function isInternalDocNavigationUrl(url) {
  if (url.origin !== window.location.origin) return false;
  const p = url.pathname;
  if (p.endsWith(".html")) return true;
  if (p === "/" || p.endsWith("/")) return true;
  return false;
}

function spaClickShouldIgnore(anchor, event) {
  if (event.defaultPrevented) return true;
  if (event.button !== 0) return true;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return true;
  if (!anchor || anchor.closest("[data-no-spa]")) return true;
  if (anchor.hasAttribute("download")) return true;
  if (anchor.getAttribute("target") === "_blank") return true;
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) return true;
  return false;
}

function runAfterDocShellSwap() {
  const lang = getStoredLang();
  applyLanguage(lang);
  decorateCodeBlocks();
  initTocAccordions();
  setTopNavCurrent();
  syncDocViewMode();
  setActiveLink();
  document.querySelector(".mobile-toc")?.remove();
  initMobileToc();
  initRightTocFooter();
  renderKatexInDocRoot();
  initPageEnterAnimations();

  if (searchInput && searchInput.value && searchInput.value.trim()) {
    void filterDocumentation(searchInput.value);
  }

  const raw = (window.location.hash || "").replace(/^#/, "");
  if (raw) {
    try {
      const id = decodeURIComponent(raw);
      window.requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ block: "start", behavior: "auto" });
      });
    } catch {
      window.scrollTo(0, 0);
    }
  } else {
    window.scrollTo(0, 0);
  }
}

let docSpaNavInFlight = false;

/** Ruta que refleja el `main` actual (para popstate: URL puede no coincidir con el DOM). */
const spaDisplayedPath = {
  pathname: typeof window !== "undefined" ? window.location.pathname : "",
  search: typeof window !== "undefined" ? window.location.search : "",
};

async function navigateDocPage(url, options) {
  const skipHistory = options && options.skipHistory === true;
  let target;
  try {
    target = url instanceof URL ? url : new URL(url, window.location.href);
  } catch {
    window.location.href = String(url);
    return;
  }

  if (!isInternalDocNavigationUrl(target)) {
    window.location.href = target.href;
    return;
  }

  const locMatchesTarget =
    target.pathname === window.location.pathname && target.search === window.location.search;
  const domMatchesTarget =
    target.pathname === spaDisplayedPath.pathname && target.search === spaDisplayedPath.search;

  if (skipHistory && locMatchesTarget && domMatchesTarget) {
    syncDocViewMode();
    setActiveLink();
    const raw = (target.hash || "").replace(/^#/, "");
    if (raw) {
      try {
        const id = decodeURIComponent(raw);
        window.requestAnimationFrame(() => {
          document.getElementById(id)?.scrollIntoView({ block: "start", behavior: "auto" });
        });
      } catch {
        window.scrollTo(0, 0);
      }
    } else {
      window.scrollTo(0, 0);
    }
    return;
  }

  if (!skipHistory && locMatchesTarget) {
    return;
  }

  if (docSpaNavInFlight) return;
  docSpaNavInFlight = true;

  document.body.classList.remove("page-ready");
  document.documentElement.classList.add("page-prep");

  try {
    const res = await fetch(target.href, { credentials: "same-origin", redirect: "follow" });
    if (!res.ok) throw new Error(String(res.status));
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html")) throw new Error("not-html");
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const newMain = doc.querySelector("main.doc-content");
    const newToc = doc.querySelector("aside.right-toc");
    const layout = document.querySelector(".docs-layout");
    if (!newMain || !layout) {
      window.location.href = target.href;
      return;
    }

    const oldMain = document.querySelector("main.doc-content");
    if (!oldMain) {
      window.location.href = target.href;
      return;
    }
    oldMain.replaceWith(newMain);

    if (newToc) {
      const oldToc = document.querySelector("aside.right-toc");
      if (oldToc) oldToc.replaceWith(newToc);
    }

    const tEl = doc.querySelector("title");
    if (tEl && tEl.textContent) document.title = tEl.textContent.trim();

    if (!skipHistory) {
      window.history.pushState({ harmoniqSpa: 1 }, "", target.pathname + target.search + target.hash);
    }

    const newLeftPanel = doc.querySelector("#leftNavPanel");
    const oldLeftPanel = document.querySelector("#leftNavPanel");
    if (newLeftPanel && oldLeftPanel) {
      closeLeftNavFlyout();
      try {
        sessionStorage.setItem(STORAGE_KEYS.leftNavScroll, String(oldLeftPanel.scrollTop));
      } catch {
        /* ignore */
      }
      oldLeftPanel.replaceWith(document.importNode(newLeftPanel, true));
      attachLeftNavScrollPersistence();
      initLeftNavGroups();
      syncLeftNavLinkTitles();
    }

    runAfterDocShellSwap();
    spaDisplayedPath.pathname = window.location.pathname;
    spaDisplayedPath.search = window.location.search;
  } catch {
    window.location.href = target.href;
  } finally {
    docSpaNavInFlight = false;
  }
}

function initDocSpaNavigation() {
  if (!document.querySelector(".docs-layout")) return;

  document.addEventListener(
    "click",
    (e) => {
      const a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (!a) return;
      if (spaClickShouldIgnore(a, e)) return;
      let u;
      try {
        u = new URL(a.href);
      } catch {
        return;
      }
      if (!isInternalDocNavigationUrl(u)) return;
      if (u.pathname === window.location.pathname && u.search === window.location.search) {
        return;
      }
      e.preventDefault();
      void navigateDocPage(u);
    },
    true,
  );

  window.addEventListener("popstate", () => {
    void navigateDocPage(new URL(window.location.href), { skipHistory: true });
  });
}

window.addEventListener("pagehide", () => {
  const panel = document.getElementById("leftNavPanel");
  if (!panel) return;
  try {
    sessionStorage.setItem(STORAGE_KEYS.leftNavScroll, String(panel.scrollTop));
  } catch {
    /* ignore */
  }
});

function initPageEnterAnimations() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.body.classList.add("page-ready");
    document.documentElement.classList.remove("page-prep");
    return;
  }

  const targets = [];
  const main = document.querySelector("main.doc-content");

  if (main) {
    // Animate first-level blocks; plus section blocks
    const blocks = Array.from(main.children);
    blocks.forEach((b) => targets.push(b));
  }

  targets.forEach((el, idx) => {
    el.classList.add("enter-anim");
    el.style.setProperty("--enter-delay", `${Math.min(idx, 10) * 40}ms`);
  });

  // Trigger transition after paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.classList.add("page-ready");
      document.documentElement.classList.remove("page-prep");
    });
  });
}

function initRightTocFooter() {
  const toc = document.querySelector(".right-toc");
  if (!toc) return;
  if (toc.querySelector(".right-toc-footer")) return;

  const footer = document.createElement("div");
  footer.className = "right-toc-footer";
  footer.innerHTML = `
    <p class="rtf-title" data-i18n="rtf.title">¿Te sirvió esta página?</p>
    <div class="rtf-actions" role="group" aria-label="Feedback">
      <button type="button" class="rtf-btn" data-rtf="yes">
        <span data-i18n="rtf.yes">Sí</span>
        <i class="ph ph-thumbs-up" aria-hidden="true"></i>
      </button>
      <button type="button" class="rtf-btn" data-rtf="no">
        <span data-i18n="rtf.no">No</span>
        <i class="ph ph-thumbs-down" aria-hidden="true"></i>
      </button>
    </div>
    <p class="rtf-desc">
      <span data-i18n="rtf.desc">Reporta un bug o solicita contenido en</span>
      <a class="rtf-link" href="https://github.com" target="_blank" rel="noopener noreferrer">
        GitHub <span aria-hidden="true">↗</span>
      </a>
    </p>
  `;

  toc.appendChild(footer);

  footer.addEventListener("click", (e) => {
    const btn = e.target && e.target.closest ? e.target.closest(".rtf-btn") : null;
    if (!btn) return;
    footer.querySelectorAll(".rtf-btn").forEach((b) => b.classList.remove("is-selected"));
    btn.classList.add("is-selected");

    const choice = btn.getAttribute("data-rtf");
    if (choice !== "yes" && choice !== "no") return;

    const save = typeof HarmoniqFirebase !== "undefined" && HarmoniqFirebase.savePageFeedback;
    if (!save) return;
    if (footer.dataset.rtfSending === "1") return;

    const rtfStorageKey =
      "harmoniq-docs-rtf:" + (window.location.pathname || "") + (window.location.hash || "");
    try {
      if (sessionStorage.getItem(rtfStorageKey)) return;
    } catch {
      /* private mode */
    }

    footer.dataset.rtfSending = "1";
    btn.setAttribute("aria-busy", "true");
    Promise.resolve(HarmoniqFirebase.savePageFeedback(choice))
      .then(() => {
        try {
          sessionStorage.setItem(rtfStorageKey, choice);
        } catch {
          /* ignore */
        }
      })
      .catch((err) => {
        console.warn("[Harmoniq docs] No se pudo guardar el feedback en Firestore:", err);
      })
      .finally(() => {
        btn.removeAttribute("aria-busy");
        delete footer.dataset.rtfSending;
      });
  });

  try {
    const lang = getStoredLang();
    applyLanguage(lang);
  } catch {}
}

function initDocumentationApp() {
  applyLanguage(getStoredLang());
  applyTheme(getStoredTheme());
  decorateCodeBlocks();
  setTopNavCurrent();
  ensureHelpModal();
  initTocAccordions();
  syncDocViewMode();
  setActiveLink();
  syncLeftNavGroupsOpen();
  initLeftNavGroups();
  initLeftNavToggle();
  initDocSpaNavigation();
  initMobileToc();
  initMobileNav();
  initPageEnterAnimations();
  initRightTocFooter();

  window.addEventListener("hashchange", () => {
    syncDocViewMode();
    setActiveLink();
  });
  window.addEventListener("scroll", setActiveLink);
  window.addEventListener("resize", () => {
    initMobileToc();
    handleMobileNavResize();
  });
}

/* Mobile nav drawer for small screens. */
function initMobileNav() {
  const BREAKPOINT = 840;
  const nav = document.querySelector(".left-nav");
  const header = document.querySelector(".top-header-left");
  if (!nav || !header) return;

  // Backdrop
  const backdrop = document.createElement("div");
  backdrop.className = "mobile-nav-backdrop";
  backdrop.setAttribute("aria-hidden", "true");
  document.body.appendChild(backdrop);

  // Drawer trigger
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "mobile-nav-btn";
  btn.setAttribute("aria-label", "Abrir menú de navegación");
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-controls", "leftNavPanel");
  btn.innerHTML = '<i class="ph ph-list" aria-hidden="true"></i>';
  // Insert before brand to keep header hierarchy.
  header.insertBefore(btn, header.firstChild);

  // Helpers
  function isMobile() {
    return window.innerWidth <= BREAKPOINT;
  }

  function getHeaderHeight() {
    const h = document.querySelector(".top-header");
    return h ? h.getBoundingClientRect().height : 96;
  }

  function openDrawer() {
    const hh = getHeaderHeight();
    nav.style.top = hh + "px";
    nav.style.height = "calc(100vh - " + hh + "px)";
    backdrop.style.top = hh + "px";
    nav.classList.add("mobile-open");
    backdrop.classList.add("is-active");
    btn.setAttribute("aria-expanded", "true");
    btn.innerHTML = '<i class="ph ph-x" aria-hidden="true"></i>';
    document.body.style.overflow = "hidden";
  }

  function closeDrawer() {
    nav.classList.remove("mobile-open");
    backdrop.classList.remove("is-active");
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = '<i class="ph ph-list" aria-hidden="true"></i>';
    document.body.style.overflow = "";
  }

  function isOpen() {
    return nav.classList.contains("mobile-open");
  }

  // Events
  btn.addEventListener("click", () => {
    if (!isMobile()) return;
    isOpen() ? closeDrawer() : openDrawer();
  });

  backdrop.addEventListener("click", closeDrawer);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) closeDrawer();
  });

  // Close after navigation in mobile mode.
  nav.addEventListener("click", (e) => {
    if (!isMobile()) return;
    const link = e.target.closest("a.nav-item, a.nav-sublink");
    if (link) {
      // Let hash navigation settle before closing.
      setTimeout(closeDrawer, 120);
    }
  });

  // Cleanup when returning to desktop.
  window.handleMobileNavResize = function () {
    if (!isMobile() && isOpen()) {
      closeDrawer();
    }
  };
}

initDocumentationApp();

// Ensure the resize hook exists before first paint.
if (typeof window.handleMobileNavResize === "undefined") {
  window.handleMobileNavResize = function () {};
}
