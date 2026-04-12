/**
 * Genera subpáginas de fundamentos (bases + cursos) desde plantilla.
 * Ejecutar: node scripts/emit-ft-bases.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const tplPath = path.join(ROOT, "paginas/.bases-template.html");
let tpl = fs.readFileSync(tplPath, "utf8");
tpl = tpl.replace('href="../styles.css?v=72"', 'href="../styles.css?v=73"');

const reDoc =
  /^(?<pre>[\s\S]*?)<main class="doc-content" data-doc-views>[\s\S]*?<\/main>(?<mid>[\s\S]*?)<aside class="right-toc">[\s\S]*?<\/aside>(?<post>[\s\S]*)$/;
const m = tpl.match(reDoc);
if (!m) throw new Error("Plantilla: no coincide estructura main/toc");
const { pre, mid, post } = m.groups;

const AUTHOR = `
            <div class="qubits-authors" aria-label="Créditos">
              <p class="qubits-authors-label">Autor</p>
              <div class="qubits-authors-row">
                <div class="qubits-author-card">
                  <img class="qubits-author-photo" src="../images/author-nogueron-mendez-planq.png" width="56" height="56" alt="Retrato de Noguerón Méndez José Antonio" loading="lazy" decoding="async" />
                  <div class="qubits-author-meta">
                    <span class="qubits-author-name">Noguerón Méndez José Antonio</span>
                    <span class="qubits-author-role">Head of Quantum Product</span>
                  </div>
                </div>
              </div>
            </div>`;

const REF_FOOT = `
          <section id="referencias" class="qubits-section">
            <h2>Referencias y lecturas recomendadas</h2>
            <ul class="qubits-prose qubits-prose--academic">
              <li>Nielsen &amp; Chuang, <em>Quantum Computation and Quantum Information</em> (Cambridge University Press).</li>
              <li>Preskill, <em>Ph 219 / CS 219 lecture notes</em> (Caltech). <a href="http://theory.caltech.edu/~preskill/ph229/" rel="noopener noreferrer">theory.caltech.edu/~preskill/ph229</a></li>
              <li>Qiskit Textbook — fundamentos y laboratorios. <a href="https://learning.quantum.ibm.com/" rel="noopener noreferrer">learning.quantum.ibm.com</a></li>
              <li>arXiv <em>quant-ph</em> — prepublicaciones recientes. <a href="https://arxiv.org/list/quant-ph/recent" rel="noopener noreferrer">arxiv.org/list/quant-ph/recent</a></li>
            </ul>
            <p class="qubits-prose qubits-prose--academic"><a href="fundamento-teorico.html">← Volver a Fundamentos teóricos</a></p>
          </section>`;

function tocLinks(items) {
  const lines = items
    .map(
      (x) => `          <a href="${x.href}" class="right-toc-link${x.lead ? " right-toc-link--lead" : ""}">
            <span class="right-toc-marker" aria-hidden="true"></span>
            <span>${x.label}</span>
          </a>`,
    )
    .join("\n");
  return `<aside class="right-toc">
        <div class="right-toc-head">
          <i class="ph ph-article" aria-hidden="true"></i>
          <span class="right-toc-title" data-i18n="right.title">En esta página</span>
        </div>
        <nav class="right-toc-body" data-i18n-aria-label="right.title" aria-label="En esta página">
${lines}
        </nav>
      </aside>`;
}

function wrapMain(inner) {
  return `<main class="doc-content qubits-article">
  <article class="qubits-article-inner">
${inner}
  </article>
</main>`;
}

const pages = [
  {
    file: "base-superposicion.html",
    title: "Superposición cuántica: estados, interferencia y medición | Harmoniq Docs",
    katex: true,
    toc: tocLinks([
      { href: "#page-body", label: "Introducción", lead: true },
      { href: "#estados-complejos", label: "Estados y amplitudes" },
      { href: "#interferencia-medicion", label: "Interferencia y medición" },
      { href: "#referencias", label: "Referencias" },
    ]),
    main: `
          <section id="page-body" class="qubits-hero">
            <p class="qubits-kicker qubits-kicker--row">
              <span class="qubits-kicker-segment">Fundamentos teóricos</span>
              <span class="qubits-kicker-rule" aria-hidden="true"></span>
              <span class="qubits-kicker-segment">Mecánica cuántica</span>
            </p>
            ${AUTHOR}
            <h1 class="qubits-hero-title">Superposición: combinación coherente de estados</h1>
            <div class="qubits-prose qubits-prose--academic qubits-lead">
              <p>
                La <strong>superposición</strong> es la posibilidad de describir un sistema (preparado de forma coherente) mediante una
                <em>combinación lineal</em> de estados de referencia, de modo que las <strong>amplitudes complejas</strong> interfieren al
                evolucionar o al proyectar sobre bases distintas. No es un “estar en dos sitios a la vez” en sentido clásico: es una
                propiedad del formalismo que predice estadísticas de medición y patrones de interferencia verificables.
              </p>
            </div>
          </section>
          <section id="estados-complejos" class="qubits-section">
            <h2>Estados, normalización y regla de Born</h2>
            <div class="qubits-prose qubits-prose--academic">
              <p>
                En un espacio de Hilbert de dimensión dos (un cúbit), un estado puro se escribe
                \\( |\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle \\) con
                \\( |\\alpha|^2 + |\\beta|^2 = 1 \\). Las probabilidades de medir en la base computacional siguen la
                <strong>regla de Born</strong>: \\(P(0)=|\\alpha|^2\\), \\(P(1)=|\\beta|^2\\).
              </p>
              <p>
                La fase relativa entre \\(\\alpha\\) y \\(\\beta\\) es física para observables que no conmutan con el proyecto sobre la
                base computacional —de ahí la aparición de <strong>interferencia</strong> en experimentos de qubits, átomos o fotones.
              </p>
            </div>
          </section>
          <section id="interferencia-medicion" class="qubits-section">
            <h2>Interferencia, complementariedad y colapso efectivo</h2>
            <div class="qubits-prose qubits-prose--academic">
              <p>
                Los dispositivos de interferometría y los algoritmos cuánticos explotan rutas alternativas cuyas amplitudes se suman
                antes de cuadrar. La <strong>medición fuerte</strong> en una base seleccionada destruye coherencias en esa base y produce
                resultados clásicos aleatorios acordes con Born; en ingeniería de qubits, la decoherencia actúa como un canal continuo
                que atenúa interferencias antes de que el operador lea el registro.
              </p>
              <p>
                Para profundizar en el formalismo del cúbit y la esfera de Bloch, continúe en
                <a href="qubits.html">El cúbit: superposición, medición y el formalismo del espacio de Hilbert</a>.
              </p>
            </div>
          </section>
          ${REF_FOOT}`,
  },
  {
    file: "base-incertidumbre.html",
    title: "Principio de incertidumbre e incompartibilidad de observables | Harmoniq Docs",
    katex: true,
    toc: tocLinks([
      { href: "#page-body", label: "Introducción", lead: true },
      { href: "#relaciones", label: "Relaciones de incertidumbre" },
      { href: "#implicaciones", label: "Implicaciones prácticas" },
      { href: "#referencias", label: "Referencias" },
    ]),
    main: `
          <section id="page-body" class="qubits-hero">
            <p class="qubits-kicker qubits-kicker--row">
              <span class="qubits-kicker-segment">Fundamentos teóricos</span>
              <span class="qubits-kicker-rule" aria-hidden="true"></span>
              <span class="qubits-kicker-segment">Mecánica cuántica</span>
            </p>
            ${AUTHOR}
            <h1 class="qubits-hero-title">Incertidumbre: límites conjuntos de precisión</h1>
            <div class="qubits-prose qubits-prose--academic qubits-lead">
              <p>
                El <strong>principio de incertidumbre</strong> cuántico no es un límite instrumental meramente tecnológico: cuantifica
                cómo la <em>no conmutatividad</em> de observables impone cotas inferiores a la varianza conjunta de mediciones compatibles
                con el formalismo de Hilbert.
              </p>
            </div>
          </section>
          <section id="relaciones" class="qubits-section">
            <h2>Conmutadores y relación de Robertson</h2>
            <div class="qubits-prose qubits-prose--academic">
              <p>
                Para operadores autoadjuntos \\(A\\) y \\(B\\) y un estado \\(|\\psi\\rangle\\), la
                <strong>relación de Robertson</strong> da la cota
                \\(\\Delta A\\,\\Delta B \\ge \\tfrac{1}{2}|\\langle\\psi|[A,B]|\\psi\\rangle|\\).
                Para \\(x\\) y \\(p\\) con \\([x,p]=i\\hbar\\), se recupera la forma usual
                \\(\\Delta x\\,\\Delta p \\ge \\hbar/2\\).
              </p>
            </div>
          </section>
          <section id="implicaciones" class="qubits-section">
            <h2>Implicaciones en información cuántica</h2>
            <div class="qubits-prose qubits-prose--academic">
              <p>
                Las bases mutuamente insesgadas (p. ej. computacional vs. Hadamard) ilustran el compromiso entre información accesible
                sobre observables incompatibles: una medición perfecta en una base borra información coherente relativa a la otra. Este
                fenómeno aparece en protocolos criptográficos, en estimación de fase ruidosa y en la lectura de estados en procesadores
                NISQ.
              </p>
            </div>
          </section>
          ${REF_FOOT}`,
  },
  {
    file: "base-algoritmos.html",
    title: "Introducción a algoritmos cuánticos | Harmoniq Docs",
    katex: true,
    toc: tocLinks([
      { href: "#page-body", label: "Introducción", lead: true },
      { href: "#modelo-consultas", label: "Modelo de consultas" },
      { href: "#familias", label: "Familias representativas" },
      { href: "#referencias", label: "Referencias" },
    ]),
    main: `
          <section id="page-body" class="qubits-hero">
            <p class="qubits-kicker qubits-kicker--row">
              <span class="qubits-kicker-segment">Fundamentos teóricos</span>
              <span class="qubits-kicker-rule" aria-hidden="true"></span>
              <span class="qubits-kicker-segment">Informática cuántica</span>
            </p>
            ${AUTHOR}
            <h1 class="qubits-hero-title">Algoritmos cuánticos: primitivas y complejidad</h1>
            <div class="qubits-prose qubits-prose--academic qubits-lead">
              <p>
                Un <strong>algoritmo cuántico</strong> es, en el paradigma de circuitos, una secuencia de unitarios locales y de dos
                cúbits seguida de mediciones cuyas salidas clásicas se post-procesan. La pregunta central es si, para una familia de
                problemas, ese patrón ofrece ventaja <em>muestral</em>, de <em>consultas</em> o de <em>profundidad</em> frente a métodos
                clásicos documentados.
              </p>
            </div>
          </section>
          <section id="modelo-consultas" class="qubits-section">
            <h2>Oráculos, consultas y clases de complejidad</h2>
            <div class="qubits-prose qubits-prose--academic">
              <p>
                Muchos resultados históricos (Deutsch–Jozsa, Simon, Shor, Grover) se formulan en el <strong>modelo de oráculo</strong>:
                el algoritmo accede a una función \\(f\\) mediante consultas coherentes. La clase <strong>BQP</strong> captura problemas
                decidibles con error acotado por una máquina cuántica en tiempo polinómico; el estatus frente a P o NP permanece abierto
                en general, pero existen <em>separaciones relativas</em> con oráculos específicos.
              </p>
            </div>
          </section>
          <section id="familias" class="qubits-section">
            <h2>Ejemplos canónicos (lectura orientativa)</h2>
            <div class="qubits-prose qubits-prose--academic">
              <ul>
                <li><strong>Grover</strong> — aceleración cuadrática en búsqueda no estructurada bajo supuestos de oráculo.</li>
                <li><strong>Shor / QPE</strong> — periodicidad y estimación de fase; impacto conceptual en criptografía y química.</li>
                <li><strong>Variacionales (VQE/QAOA)</strong> — bucles híbridos clásico-cuánticos en dispositivos ruidosos.</li>
              </ul>
              <p>
                La traducción a <a href="base-circuitos-puertas.html">circuitos y puertas</a> es el puente natural hacia Harmoniq y
                runtimes reales.
              </p>
            </div>
          </section>
          ${REF_FOOT}`,
  },
  {
    file: "base-circuitos-puertas.html",
    title: "Circuitos cuánticos y puertas elementales | Harmoniq Docs",
    katex: true,
    toc: tocLinks([
      { href: "#page-body", label: "Introducción", lead: true },
      { href: "#puertas-universalidad", label: "Puertas y universalidad" },
      { href: "#desde-diagrama-runtime", label: "Del diagrama al runtime" },
      { href: "#referencias", label: "Referencias" },
    ]),
    main: `
          <section id="page-body" class="qubits-hero">
            <p class="qubits-kicker qubits-kicker--row">
              <span class="qubits-kicker-segment">Fundamentos teóricos</span>
              <span class="qubits-kicker-rule" aria-hidden="true"></span>
              <span class="qubits-kicker-segment">Informática cuántica</span>
            </p>
            ${AUTHOR}
            <h1 class="qubits-hero-title">Circuitos, puertas y ejecución</h1>
            <div class="qubits-prose qubits-prose--academic qubits-lead">
              <p>
                Un <strong>circuito cuántico</strong> organiza la evolución de \\(n\\) cúbits como una red de operaciones discretas:
                rotaciones de un cúbit, entrelazadores de dos cúbits y mediciones. El compilador traduce esas primitivas lógicas al
                conjunto <em>nativo</em> y conectividad del backend.
              </p>
            </div>
          </section>
          <section id="puertas-universalidad" class="qubits-section">
            <h2>Conjuntos generadores y notación</h2>
            <div class="qubits-prose qubits-prose--academic">
              <p>
                Conjuntos como \\(\\{H, T, \\mathrm{CNOT}\\}\\) (con una familia continua aproximada mediante Solovay–Kitaev) generan
                densamente las unitarias sobre \\(n\\) cúbits. En la práctica, los transpiladores descomponen puertas arbitrarias en
                pulsos o interacciones efectivas específicas de la plataforma (superconductores, iones, fotónica, etc.).
              </p>
            </div>
          </section>
          <section id="desde-diagrama-runtime" class="qubits-section">
            <h2>Del diagrama al runtime Harmoniq</h2>
            <div class="qubits-prose qubits-prose--academic">
              <p>
                El flujo de producto conecta diseño en el <a href="compositor.html">Compositor</a>, compilación, envío de
                <em>jobs</em> y análisis de histogramas. La guía de <a href="simuladores.html">simuladores</a> detalla paradigmas numéricos
                que validan el circuito antes de hardware.
              </p>
            </div>
          </section>
          ${REF_FOOT}`,
  },
  {
    file: "curso-fundamentos-informacion-cuantica.html",
    title: "Curso — Fundamentos de información cuántica | Harmoniq Docs",
    katex: false,
    toc: tocLinks([
      { href: "#page-body", label: "Introducción", lead: true },
      { href: "#modulos", label: "Módulos" },
      { href: "#practicas", label: "Prácticas sugeridas" },
      { href: "#referencias", label: "Referencias" },
    ]),
    main: `
          <section id="page-body" class="qubits-hero">
            <p class="qubits-kicker qubits-kicker--row">
              <span class="qubits-kicker-segment">Fundamentos teóricos</span>
              <span class="qubits-kicker-rule" aria-hidden="true"></span>
              <span class="qubits-kicker-segment">Curso</span>
            </p>
            ${AUTHOR}
            <h1 class="qubits-hero-title">Fundamentos de información cuántica</h1>
            <div class="qubits-prose qubits-prose--academic qubits-lead">
              <p>
                Recorrido introductorio que ordena <strong>estado, medición, interferencia y complejidad</strong> antes de abordar
                aplicaciones específicas. Cada módulo enlaza a una nota de profundidad con referencias verificables.
              </p>
            </div>
          </section>
          <section id="modulos" class="qubits-section">
            <h2>Módulos</h2>
            <ol class="qubits-prose qubits-prose--academic">
              <li><a href="base-superposicion.html">Superposición y regla de Born</a></li>
              <li><a href="base-incertidumbre.html">Incertidumbre e incompartibilidad</a></li>
              <li><a href="qubits.html">Cúbits: formalismo de Hilbert y sistemas abiertos</a></li>
              <li><a href="teoria-cuantica.html">Panorama histórico y fenomenológico de la teoría cuántica</a></li>
            </ol>
          </section>
                            <section id="practicas" class="qubits-section">
            <h2>Prácticas sugeridas</h2>
            <div class="qubits-prose qubits-prose--academic">
              <p>
                Tras leer los módulos 1–2, implemente en Harmoniq un circuito que prepare el estado de equipartición en la base
                computacional (aplicando Hadamard a |0⟩), añada una fase relativa controlada y mida en bases conjugadas; compare
                frecuencias con las predicciones de Born.
              </p>
            </div>
          </section>
          ${REF_FOOT}`,
  },
  {
    file: "curso-circuitos-simulacion.html",
    title: "Curso — Circuitos y simulación | Harmoniq Docs",
    katex: false,
    toc: tocLinks([
      { href: "#page-body", label: "Introducción", lead: true },
      { href: "#modulos", label: "Módulos" },
      { href: "#practicas", label: "Prácticas sugeridas" },
      { href: "#referencias", label: "Referencias" },
    ]),
    main: `
          <section id="page-body" class="qubits-hero">
            <p class="qubits-kicker qubits-kicker--row">
              <span class="qubits-kicker-segment">Fundamentos teóricos</span>
              <span class="qubits-kicker-rule" aria-hidden="true"></span>
              <span class="qubits-kicker-segment">Curso</span>
            </p>
            ${AUTHOR}
            <h1 class="qubits-hero-title">Circuitos y simulación</h1>
            <div class="qubits-prose qubits-prose--academic qubits-lead">
              <p>
                Este curso conecta el <strong>diseño de circuitos</strong> con la <strong>validación numérica</strong> y la ejecución en
                runtime: transpilación, selección de simulador y lectura crítica de histogramas.
              </p>
            </div>
          </section>
          <section id="modulos" class="qubits-section">
            <h2>Módulos</h2>
            <ol class="qubits-prose qubits-prose--academic">
              <li><a href="base-circuitos-puertas.html">Puertas, diagramas y universalidad</a></li>
              <li><a href="base-algoritmos.html">Introducción a algoritmos cuánticos</a></li>
              <li><a href="compositor.html">Compositor: entidades y compilación</a></li>
              <li><a href="simuladores.html">Simuladores Harmoniq: paradigmas y alcance</a></li>
            </ol>
          </section>
          <section id="practicas" class="qubits-section">
            <h2>Prácticas sugeridas</h2>
            <div class="qubits-prose qubits-prose--academic">
              <p>
                Construya un Bell state, transpile a un backend objetivo de baja conectividad y compare profundidad nativa vs. lógica.
                Repita con ruido de depolarización en simulador y documente shots, semilla y métricas.
              </p>
              <p>Para más ejercicios guiados, abra <a href="../tutoriales.html">Tutoriales</a>.</p>
            </div>
          </section>
          ${REF_FOOT}`,
  },
];

for (const p of pages) {
  let head = pre.replace(/<title>[\s\S]*?<\/title>/, `<title>${p.title}</title>`);
  let foot = post;
  if (p.katex) {
    head = head.replace(
      /(<link\s+rel="stylesheet"\s+href="https:\/\/unpkg.com\/@phosphor-icons)/,
      '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" crossorigin="anonymous" />\n    $1',
    );
    foot = post.replace(
      '<script src="../firebase-init.bundle.js?v=2"></script>',
      `<script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js" crossorigin="anonymous"></script>
    <script src="../firebase-init.bundle.js?v=2"></script>`,
    );
  }
  const out = head + wrapMain(p.main) + mid + p.toc + foot;
  fs.writeFileSync(path.join(ROOT, "paginas", p.file), out);
}

console.log("emit-ft-bases: OK", pages.map((p) => p.file).join(", "));
