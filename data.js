/* ============================================================
   CONTENIDO: temas, teoría, recetas, quizzes, casos, examen
   ============================================================ */
window.DM = (function () {
  'use strict';

  const topics = [
    { id: 'rec', name: 'Sistemas de recomendación', short: 'Recomendación', clases: 'Semanas 9–10' },
    { id: 'pr', name: 'PageRank y análisis de enlaces', short: 'PageRank', clases: 'Semana 11' },
    { id: 'com', name: 'Detección de comunidades', short: 'Comunidades', clases: 'Semanas 12–13' },
    { id: 'rep', name: 'Representaciones y node2vec', short: 'Representaciones', clases: 'Semana 14' },
    { id: 'gnn', name: 'Redes neuronales de grafos', short: 'GNN', clases: 'Semana 15' },
    { id: 'clu', name: 'Clustering a gran escala (BFR)', short: 'BFR', clases: 'Parte 1 del curso' },
    { id: 'dis', name: 'Cómo responder casos de estudio', short: 'Casos', clases: 'Transversal' },
  ];

  /* -------------------- TEORÍA -------------------- */
  const theory = {};

  theory.rec = `
<h2>Sistemas de recomendación</h2>
<p class="lead">Objetivo: predecir la utilidad <b>u(x, s)</b> de un ítem s para un usuario x en pares no vistos. Los datos se guardan en la <b>matriz de utilidad</b> (usuarios × ítems), que es muy <b>dispersa</b>: casi todas las celdas están vacías y el trabajo es llenarlas.</p>

<h3>Tres problemas clave</h3>
<ul>
<li><b>Recolección:</b> calificaciones explícitas (el usuario las da; escasas) o implícitas (compra = interés; ¿no comprar = no le gusta?). En la práctica se combinan.</li>
<li><b>Extrapolación:</b> predecir celdas vacías. Tres enfoques: basado en contenido, colaborativo y factores latentes.</li>
<li><b>Evaluación:</b> ocultar ~20% de calificaciones, predecir y medir RMSE / MAE.</li>
</ul>
<p>La <b>cola larga</b>: una tienda online tiene estantes ilimitados, así que puede vender productos poco populares. Las recomendaciones generan ingresos con esos productos.</p>

<h3>1. Basado en contenido</h3>
<p>Hipótesis: si te gustó un ítem con ciertas características, te gustará otro parecido.</p>
<ol>
<li><b>Perfil de ítem:</b> vector de características (actores, género, año…). Para texto se usa <b>TF-IDF</b>.</li>
<li><b>Perfil de usuario:</b> promedio (ponderado) de los perfiles de los ítems que calificó alto.</li>
<li><b>Predicción:</b> u(x, i) = cos(x, i) = x·i / (‖x‖‖i‖).</li>
</ol>
<div class="fx">TF(i,j) = f<sub>ij</sub> / max<sub>k</sub> f<sub>kj</sub> &nbsp;&nbsp; IDF(i) = log(N / n<sub>i</sub>) &nbsp;&nbsp; TF-IDF = TF × IDF</div>
<p>Palabras raras y frecuentes en un documento obtienen puntuación alta; "el", "y" tienen IDF ≈ 0.</p>
<div class="grid2">
<div class="pro"><b>Ventajas</b><ul><li>No necesita datos de otros usuarios.</li><li>Recomienda ítems nuevos sin calificaciones (sin cold start de ítem).</li><li>Explicable ("porque te gusta Acción").</li></ul></div>
<div class="con"><b>Desventajas</b><ul><li>Difícil extraer características (imágenes, música).</li><li>Sobreespecialización: no descubre intereses nuevos.</li><li>No aprovecha la sabiduría de la multitud.</li><li>Cold start de usuario nuevo (perfil vacío).</li></ul></div>
</div>

<h3>2. Filtrado colaborativo (FC)</h3>
<p>Hipótesis: usuarios con gustos parecidos en el pasado tendrán gustos parecidos en el futuro. No necesita características.</p>
<h4>Medidas de similitud</h4>
<div class="tbl-wrap"><table class="mtx"><thead><tr><th>Medida</th><th>Fórmula</th><th>Problema</th></tr></thead><tbody>
<tr><th>Jaccard</th><td>|r<sub>x</sub> ∩ r<sub>y</sub>| / |r<sub>x</sub> ∪ r<sub>y</sub>|</td><td>Ignora el valor de la calificación.</td></tr>
<tr><th>Coseno</th><td>r<sub>x</sub>·r<sub>y</sub> / (‖r<sub>x</sub>‖‖r<sub>y</sub>‖), vacíos = 0</td><td>Trata el vacío como calificación negativa (0).</td></tr>
<tr><th>Pearson</th><td>Σ<sub>s∈S<sub>xy</sub></sub>(r<sub>xs</sub>−r̄<sub>x</sub>)(r<sub>ys</sub>−r̄<sub>y</sub>) / √(Σ(r<sub>xs</sub>−r̄<sub>x</sub>)² Σ(r<sub>ys</sub>−r̄<sub>y</sub>)²)</td><td>Recomendada: solo ítems comunes y centra por la media (quita sesgo de usuarios generosos/exigentes). Rango −1 a 1.</td></tr>
</tbody></table></div>
<h4>Predicción</h4>
<div class="fx">Promedio simple: r̂<sub>xi</sub> = (1/k) Σ<sub>y∈N</sub> r<sub>yi</sub> &nbsp;&nbsp;|&nbsp;&nbsp; Ponderado: r̂<sub>xi</sub> = Σ<sub>y∈N</sub> s<sub>xy</sub> r<sub>yi</sub> / Σ<sub>y∈N</sub> s<sub>xy</sub></div>
<p><b>Usuario-usuario:</b> N = k usuarios más similares a x que calificaron i. <b>Ítem-ítem:</b> N(i; x) = k ítems más similares a i que x calificó:</p>
<div class="fx">r̂<sub>xi</sub> = Σ<sub>j∈N(i;x)</sub> s<sub>ij</sub> · r<sub>xj</sub> / Σ<sub>j∈N(i;x)</sub> s<sub>ij</sub></div>
<p class="callout"><b>Ítem-ítem funciona mejor en la práctica</b> (Netflix/Amazon): los ítems son más estables que los usuarios, que tienen gustos múltiples e inconsistentes. Además escala mejor (hay menos ítems que usuarios y las similitudes se precalculan).</p>
<h4>Efectos globales (baseline)</h4>
<div class="fx">r̂<sub>xi</sub> = b<sub>xi</sub> + Σ<sub>j</sub> s<sub>ij</sub>(r<sub>xj</sub> − b<sub>xj</sub>) / Σ<sub>j</sub> s<sub>ij</sub> &nbsp;&nbsp; con &nbsp; b<sub>xi</sub> = μ + b<sub>x</sub> + b<sub>i</sub></div>
<p>μ = media global; b<sub>x</sub> = media(usuario) − μ; b<sub>i</sub> = media(ítem) − μ. Ejemplo de clase: μ = 3.7, b<sub>Alicia</sub> = −0.5, b<sub>Star Wars</sub> = +0.5 → 3.7.</p>
<div class="grid2">
<div class="pro"><b>Ventajas del FC</b><ul><li>Sirve para cualquier tipo de ítem.</li><li>Descubre patrones no obvios ("fans de X aman Y").</li><li>Aprovecha la multitud.</li></ul></div>
<div class="con"><b>Desventajas</b><ul><li><b>Cold start</b> (usuario o ítem nuevo).</li><li>Matriz dispersa: pocos ítems en común.</li><li>Sesgo de popularidad.</li><li>Necesita muchos datos.</li></ul></div>
</div>

<h3>3. Evaluación</h3>
<div class="fx">RMSE = √( (1/n) Σ (r̂ − r)² ) &nbsp;&nbsp;|&nbsp;&nbsp; MAE = (1/n) Σ |r̂ − r|</div>
<p>RMSE ≥ MAE siempre; RMSE penaliza más los errores grandes, MAE es más robusto a outliers. Netflix Prize: mejorar 10% el RMSE de Cinematch (0.9514 → 0.8563).</p>

<h3>4. Modelos de factores latentes (Semana 10)</h3>
<p>Limitaciones del FC clásico que los motivan: la similitud es arbitraria (¿Pearson o coseno?), es por pares (ignora interacciones globales) y el promedio ponderado es restrictivo. En vez de fijar la similitud, <b>se aprenden los pesos desde los datos</b>.</p>
<div class="fx">R ≈ Q · P<sup>T</sup> &nbsp;&nbsp; r̂<sub>xi</sub> = q<sub>i</sub> · p<sub>x</sub> = Σ<sub>f</sub> q<sub>if</sub> p<sub>xf</sub></div>
<p>Cada ítem i → q<sub>i</sub> ∈ ℝ<sup>k</sup>, cada usuario x → p<sub>x</sub> ∈ ℝ<sup>k</sup> (k = 20–200). Los factores no están predefinidos: emergen (serio/divertido, orientado a hombres/mujeres…). Compresión: m×n → (m+n)·k parámetros.</p>
<p><b>¿Por qué no SVD directo?</b> SVD necesita la matriz completa; R tiene ~99% vacíos e imputar ceros/promedios introduce sesgo. Solución: optimizar <b>solo sobre calificaciones conocidas</b> con descenso de gradiente.</p>
<div class="fx">min<sub>P,Q</sub> Σ<sub>(x,i)∈R</sub> (r<sub>xi</sub> − q<sub>i</sub>·p<sub>x</sub>)² + λ<sub>1</sub>Σ‖p<sub>x</sub>‖² + λ<sub>2</sub>Σ‖q<sub>i</sub>‖²</div>
<p>La regularización evita el sobreajuste (RMSE de train → 0 pero el de test sube cuando k es grande). λ se elige por validación.</p>
<h4>SGD (descenso de gradiente estocástico)</h4>
<div class="fx">e<sub>xi</sub> = r<sub>xi</sub> − q<sub>i</sub>·p<sub>x</sub><br>q<sub>i</sub> ← q<sub>i</sub> + η(e<sub>xi</sub> p<sub>x</sub> − λ q<sub>i</sub>)<br>p<sub>x</sub> ← p<sub>x</sub> + η(e<sub>xi</sub> q<sub>i</sub> − λ p<sub>x</sub>) &nbsp; (con q<sub>i</sub> antiguo)</div>
<p><b>GD vs SGD:</b> GD usa todos los datos (paso exacto, la pérdida baja monótonamente, caro). SGD usa una muestra (pasos baratos y ruidosos, más iteraciones pero mucho más rápido en total).</p>
<h4>Sesgos + factores latentes</h4>
<div class="fx">r̂<sub>xi</sub> = μ + b<sub>x</sub> + b<sub>i</sub> + q<sub>i</sub>·p<sub>x</sub></div>
<p>Todos los parámetros (incluidos b<sub>x</sub>, b<sub>i</sub>) se aprenden a la vez con SGD y regularización. BellKor combinó tres niveles: efectos globales + factorización (regional) + FC (local), y ensambles de muchos modelos. Lección: los ensambles ganan; y Netflix nunca llevó el ganador a producción (cambió a streaming y a señales de contexto).</p>
`;

  theory.pr = `
<h2>PageRank y análisis de enlaces</h2>
<p class="lead">La Web como grafo dirigido: nodos = páginas, arista i → j = hipervínculo. La búsqueda por palabras clave (TF-IDF + coseno) no distingue una página seria de una que repite "jaguar" 100 veces. Los enlaces aportan una señal de <b>autoridad</b>.</p>

<h3>Ideas clave</h3>
<ol>
<li><b>Un enlace es un voto.</b> Más in-links = más importante.</li>
<li><b>No todos los votos valen igual:</b> un voto desde una página importante vale más.</li>
<li><b>El voto se reparte</b> entre los enlaces salientes: cada uno recibe r<sub>i</sub>/d<sub>i</sub>.</li>
</ol>
<div class="fx">Ecuación de flujo: r<sub>j</sub> = Σ<sub>i→j</sub> r<sub>i</sub> / d<sub>i</sub> &nbsp;&nbsp; con Σ r = 1</div>
<p>Ejemplo "Web de 1839" (y, a, m): r<sub>y</sub> = r<sub>y</sub>/2 + r<sub>a</sub>/2, r<sub>a</sub> = r<sub>y</sub>/2 + r<sub>m</sub>, r<sub>m</sub> = r<sub>a</sub>/2 → <b>r = (2/5, 2/5, 1/5)</b>. Gauss-Jordan funciona con 3 nodos, no con miles de millones.</p>

<h3>Formulación matricial</h3>
<p>Matriz estocástica <b>M</b>: si i → j entonces M<sub>ji</sub> = 1/d<sub>i</sub>, si no 0. M es <b>columna-estocástica</b> (cada columna suma 1). Entonces <b>r = M·r</b>: r es el autovector de M con autovalor 1 (Perron-Frobenius garantiza que es único y no negativo bajo las condiciones adecuadas).</p>
<h4>Power iteration</h4>
<div class="fx">r<sup>(0)</sup> = [1/N, …, 1/N] &nbsp;→&nbsp; r<sup>(t+1)</sup> = M · r<sup>(t)</sup> &nbsp;→&nbsp; parar cuando ‖r<sup>(t+1)</sup> − r<sup>(t)</sup>‖<sub>1</sub> &lt; ε</div>
<p>En la Web basta con ~50 iteraciones. Interpretación: <b>random walk</b>; PageRank = fracción de tiempo que el surfista pasa en cada página a largo plazo (distribución estacionaria).</p>

<h3>Problemas estructurales</h3>
<div class="grid2">
<div class="con"><b>Dead end</b><p>Página sin enlaces salientes. Su columna en M es de ceros, M deja de ser estocástica y la probabilidad <b>se fuga</b>: todo el PageRank tiende a 0.</p></div>
<div class="con"><b>Spider trap</b><p>Conjunto de páginas que solo se enlazan entre sí. El surfista queda atrapado y el trap <b>absorbe toda la importancia</b>; el resto queda en 0.</p></div>
</div>
<h3>Solución: teletransporte</h3>
<div class="fx">r<sub>j</sub> = Σ<sub>i→j</sub> β · r<sub>i</sub>/d<sub>i</sub> + (1 − β)/N &nbsp;&nbsp;&nbsp; β ∈ {0.8, 0.9}</div>
<p>Con probabilidad β sigue un enlace al azar; con 1−β salta a cualquier página. Desde un dead end se teletransporta siempre (o se renormaliza). <b>Google Matrix:</b> A = βM + (1−β)·(1/N)·J; r = A·r.</p>
<p class="callout">A es columna-estocástica (sin fugas), <b>irreducible</b> (se llega a cualquier nodo vía salto) y <b>aperiódica</b> (el salto rompe ciclos) ⇒ power iteration converge a un único vector desde cualquier r<sup>(0)</sup> &gt; 0. β → 1: casi sin saltos (traps dominan); β → 0: PageRank uniforme 1/N.</p>

<h3>Implementación a escala</h3>
<ul>
<li><b>Memoria:</b> M densa con N = 50 mil millones es imposible → representación <b>dispersa</b> (lista de adyacencia: origen, grado, destinos; ~10 enlaces por página).</li>
<li><b>Block-Stripe:</b> el vector r cabe en RAM (≈ 400 GB con 8 bytes por valor), la lista de adyacencia no. Se parte en <i>stripes</i> en disco y se lee una a la vez:
<div class="fx">Para cada stripe: para cada enlace i → j: r_nuevo[j] += β · r[i] / d[i]<br>Al terminar TODOS los stripes: r_nuevo[j] += (1−β)/N; r ← r_nuevo</div>
El acumulador <b>no</b> se reinicia al cambiar de stripe. Costo de I/O ≈ k lecturas por iteración.</li>
<li><b>Distribuido (Spark GraphX / Pregel):</b> Map por arista emite (j, r[i]/d[i]); shuffle agrupa por destino; Reduce calcula r_nuevo[j] = βΣ + (1−β)/N. El driver verifica convergencia (20–50 iteraciones).</li>
<li><b>Sistema híbrido de búsqueda:</b> índice invertido (sharding por términos) recupera K candidatos por TF-IDF; PageRank se precalcula offline y en tiempo de consulta es solo un lookup en RAM para el reranking.</li>
</ul>
<h3>Extensiones</h3>
<ul>
<li><b>Topic-Specific PageRank:</b> el teletransporte solo salta a páginas de un tema (conjunto S): importancia por tema.</li>
<li><b>TrustRank:</b> teletransporte a páginas confiables; combate granjas de enlaces (link spam).</li>
<li><b>HITS:</b> hubs (apuntan a buenas autoridades) y authorities (apuntadas por buenos hubs).</li>
<li><b>SimRank:</b> dos nodos son similares si sus vecinos de entrada son similares (recomendación).</li>
</ul>
`;

  theory.com = `
<h2>Detección de comunidades</h2>
<p class="lead">Una comunidad es un conjunto de nodos <b>densamente conectados entre sí</b> y escasamente conectados con el resto. Aplicaciones: círculos sociales, micro-mercados en publicidad (grafo bipartito consultas–anunciantes), actores y películas, fraude, proteínas.</p>

<h3>Edge betweenness y lazos débiles</h3>
<p>Granovetter (1973): los <b>lazos débiles</b> conectan grupos distintos, y por eso muchos caminos cortos pasan por ellos.</p>
<div class="fx">b(u,v) = Σ<sub>(s,t)</sub> σ(s,t | u,v) / σ(s,t)</div>
<p>σ(s,t) = número de caminos más cortos entre s y t; σ(s,t | u,v) = los que pasan por (u,v). Alta betweenness ⇒ arista puente.</p>

<h3>Algoritmo de Girvan-Newman (jerárquico divisivo)</h3>
<div class="fx">Repetir hasta E = ∅: (1) calcular b(e) ∀e; (2) eliminar e* = argmax b(e); (3) registrar componentes en el dendrograma</div>
<p>Hay que <b>recalcular siempre</b> porque la betweenness cambia tras cada eliminación. Costo O(m²n). El dendrograma permite elegir el número de comunidades después (con Q). Detectó los 2 grupos reales del club de karate de Zachary (34 nodos, 78 aristas).</p>

<h3>Cálculo eficiente: BFS + propagación de crédito</h3>
<ol>
<li><b>BFS desde la raíz r</b>: niveles; σ(r→v) = Σ σ(r→padre). (σ de la raíz = 1.)</li>
<li><b>Propagación ascendente</b>: cada nodo tiene crédito c(v) = 1 + Σ c(hijos). Lo reparte a sus padres en proporción a σ:
<div class="fx">aporte(u,v) = c(v) × σ(r→u) / σ(r→v) &nbsp;&nbsp; (u padre de v)</div></li>
<li>Las aristas entre nodos del <b>mismo nivel</b> no están en ningún camino más corto desde r: aporte 0.</li>
<li>Repetir para toda raíz y <b>dividir entre 2</b> (cada par s–t se cuenta desde s y desde t).</li>
</ol>
<p>1 BFS = O(m+n); todas las raíces = O(mn); GN completo = O(m²n). En grafos grandes se muestrean raíces.</p>

<h3>Modularidad Q</h3>
<p>Compara las aristas internas con las esperadas en un grafo aleatorio con los mismos grados (<b>configuration model</b>): P(i,j) = k<sub>i</sub>k<sub>j</sub>/2m.</p>
<div class="fx">Q = (1/2m) Σ<sub>ij</sub> [A<sub>ij</sub> − k<sub>i</sub>k<sub>j</sub>/2m] · δ(c<sub>i</sub>, c<sub>j</sub>) &nbsp; = &nbsp; Σ<sub>c</sub> [ L<sub>c</sub>/m − (D<sub>c</sub>/2m)² ]</div>
<p>Rango −1 &lt; Q &lt; 1. Q ≈ 0: no mejor que aleatorio; Q &gt; 0.3: comunidades moderadas; Q &gt; 0.7: muy fuertes (raro). En el dendrograma de GN se corta donde Q es máxima. Optimizar Q de forma exacta es NP-duro.</p>

<h3>Clustering espectral</h3>
<ol>
<li><b>Laplaciana</b> L = D − A (D = grados en la diagonal). Cada fila suma 0.</li>
<li>Autovalores/autovectores de L ordenados de menor a mayor. λ<sub>1</sub> = 0 con vector constante (no informa). El segundo, <b>vector de Fiedler</b>, define el corte.</li>
<li><b>k = 2:</b> partir por el signo del vector de Fiedler. <b>k &gt; 2:</b> matriz U = [v<sub>1</sub> … v<sub>k</sub>] (n × k) y K-means sobre sus filas (proyección espectral).</li>
</ol>
<p><b>Eigengap:</b> elegir k donde λ<sub>k+1</sub> − λ<sub>k</sub> es máximo (cada λ ≈ 0 corresponde a un grupo casi desconectado). Costo O(n³). En Karate: Q = 0.404, 33/34 correctos (GN: Q = 0.348).</p>

<h3>Comunidades superpuestas</h3>
<p>Un nodo puede pertenecer a varias comunidades; en el solapamiento la densidad de aristas es <b>mayor</b>. Métodos: <b>AGM</b> (modelo generativo de afiliación; MLE), <b>BigCLAM</b> (relajación continua con matriz F de fuerzas de pertenencia, gradiente ascendente coordinado) y AGM dirigido (matrices F saliente y H entrante).</p>

<h3>Detección a gran escala</h3>
<h4>Label Propagation (LPA)</h4>
<p>Cada nodo empieza con una etiqueta única; en orden aleatorio, adopta la etiqueta más frecuente entre sus vecinos; repetir hasta que nadie cambie. O(m) por iteración, 3–10 iteraciones, sin hiperparámetros, no necesita k, muy paralelizable. Pero: <b>no determinista</b>, empates, puede caer en una comunidad gigante, no optimiza Q (200 corridas: Q de 0.00 a 0.44).</p>
<h4>Louvain (Blondel et al., 2008)</h4>
<div class="grid2">
<div><b>Fase 1 · Movimiento local</b><p>Cada nodo empieza en su comunidad. Para cada nodo, calcular ΔQ de moverlo a cada comunidad vecina y moverlo a la de mayor ΔQ &gt; 0. Repetir hasta que nadie mejore.</p></div>
<div><b>Fase 2 · Agregación</b><p>Cada comunidad → supernodo. Aristas internas → <b>auto-lazo</b> ponderado; aristas entre comunidades → arista entre supernodos con <b>peso acumulado</b>. El grafo reducido entra al siguiente nivel.</p></div>
</div>
<div class="fx">ΔQ = [ (Σ<sub>in</sub> + 2k<sub>i,in</sub>)/2m − ((Σ<sub>tot</sub> + k<sub>i</sub>)/2m)² ] − [ Σ<sub>in</sub>/2m − (Σ<sub>tot</sub>/2m)² − (k<sub>i</sub>/2m)² ] &nbsp; = &nbsp; k<sub>i,in</sub>/m − k<sub>i</sub>·Σ<sub>tot</sub>/(2m²)</div>
<p>Σ<sub>in</sub> = pesos dentro de C, Σ<sub>tot</sub> = suma de grados de C, k<sub>i,in</sub> = pesos de i hacia C, k<sub>i</sub> = grado de i. Se calcula en O(1) manteniendo sumas: por eso Louvain es O(n log n), soporta pesos, da jerarquía y logra Q alta.</p>
<p class="callout"><b>Convención de la figura del examen:</b> el auto-lazo de un supernodo vale 2 × (aristas internas), porque cada arista interna aporta A<sub>ij</sub> + A<sub>ji</sub>. Comprobación rápida: Σ auto-lazos + 2 × Σ pesos entre supernodos = 2m en todos los niveles.</p>
<h4>Leiden</h4>
<p>Louvain puede dar comunidades mal conectadas o incluso desconectadas internamente. Leiden agrega una fase de <b>refinamiento</b> (mover → refinar → agregar) que garantiza comunidades conectadas (Traag et al., 2019).</p>

<h3>Comparación</h3>
<div class="tbl-wrap"><table class="mtx"><thead><tr><th>Método</th><th>Idea</th><th>¿Necesita k?</th><th>Costo</th><th>Determinista</th><th>Úsalo cuando</th></tr></thead><tbody>
<tr><th>Girvan-Newman</th><td>Quitar aristas puente</td><td>Se elige luego con Q</td><td>O(m²n)</td><td>Sí</td><td>Grafo pequeño, quieres jerarquía</td></tr>
<tr><th>Espectral</th><td>Autovectores de L + K-means</td><td>Sí (o eigengap)</td><td>O(n³)</td><td>Casi (K-means)</td><td>Conoces k, estructura global</td></tr>
<tr><th>LPA</th><td>Votación de etiquetas</td><td>No</td><td>O(m)/iter</td><td>No</td><td>Millones de nodos, primer paso rápido</td></tr>
<tr><th>Louvain</th><td>Maximizar Q (mover + agregar)</td><td>No</td><td>O(n log n)</td><td>Según semilla</td><td>Redes grandes con buena Q</td></tr>
</tbody></table></div>
`;

  theory.rep = `
<h2>Representaciones para ML y node2vec</h2>
<p class="lead">Todo modelo de ML trabaja con vectores numéricos. La pregunta del tema: ¿cómo traducir datos categóricos, textuales o relacionales (grafos) a vectores que preserven su significado?</p>

<h3>Codificación categórica</h3>
<ul>
<li><b>Integer encoding:</b> un entero por categoría. Introduce un orden artificial (Netflix &lt; Prime &lt; HBO). Solo tiene sentido si hay orden natural (y aun así las distancias no son iguales).</li>
<li><b>One-hot:</b> vector binario con un 1. Sin orden, pero <b>disperso</b>.</li>
<li><b>Multi-hot:</b> varias categorías a la vez (géneros). Ej.: proveedor (4) + géneros (28) + año + rating = 34 dimensiones.</li>
</ul>
<p><b>Explosión dimensional:</b> vocabulario de 1 000 000 palabras y 500 por documento ⇒ dispersión 1 − 500/10⁶ = 99.95%. Además no hay semántica: "good" está tan lejos de "great" como de "bad".</p>

<h3>Embeddings</h3>
<div class="fx">φ : ℝ<sup>L</sup> → ℝ<sup>d</sup>, &nbsp; d ≪ L &nbsp;&nbsp; (denso, baja dimensión, preserva similitud)</div>
<p><b>SVD como embebedor:</b> A (documentos × términos) = U Σ V<sup>T</sup>; truncar a r conceptos. Embedding de un documento: emb(doc) = [⟨doc, v<sub>1</sub>⟩, …, ⟨doc, v<sub>r</sub>⟩]. Documentos con vocabulario parecido quedan cerca.</p>
<p><b>Limitaciones de SVD:</b> necesita la matriz entera en RAM (O(mn)), es lineal, desperdicia memoria en ceros y la ortonormalidad es una restricción innecesaria. → redes neuronales.</p>

<h3>Grafos: dos paradigmas</h3>
<div class="grid2">
<div><b>Grafo intrínseco</b><p>Las aristas <b>se observan</b> en los datos: enlaces, citas, amistades, co-compras, co-ocurrencia de keywords (TextRank). Ej.: H&amp;M con compras reales.</p></div>
<div><b>Grafo de proximidad (k-NN)</b><p>Las aristas <b>se construyen</b> por similitud entre vectores: cada nodo se une a sus k vecinos más cercanos (euclídea o coseno), peso = similitud. Dependen de k y de la métrica.</p></div>
</div>
<h4>Construir un grafo k-NN</h4>
<ol>
<li>Representar cada objeto como vector (píxeles, PCA, embedding de CNN, Sentence-BERT para texto).</li>
<li>Elegir métrica y k. Para cada nodo, buscar sus k vecinos (a escala: índices aproximados como LSH/HNSW/FAISS, no O(n²)).</li>
<li>Arista i–j si j ∈ kNN(i) <b>o</b> i ∈ kNN(j) (unión) — o versión mutua (ambos), más estricta. Peso = cos(e<sub>i</sub>, e<sub>j</sub>).</li>
<li>k pequeño: grafo disperso y muchas comunidades pequeñas; k grande: se conectan clases distintas. Probar k = 3, 5, 10, 20 y comparar Q.</li>
</ol>
<p><b>¿Qué se hace con el grafo?</b> (1) Técnicas directas sobre el grafo: comunidades (Louvain), PageRank/centralidad, caminos, propagación de etiquetas (semi-supervisado). (2) Aprender embeddings de nodos (node2vec) o usar una GNN para tareas predictivas. Evaluación de comunidades contra etiquetas: ARI, NMI, tabla de contingencia (las etiquetas solo se usan para evaluar).</p>

<h3>Aprender embeddings de nodos</h3>
<ol>
<li><b>Encoder:</b> ENC(v) = z<sub>v</sub>. En métodos superficiales (DeepWalk, node2vec, LINE) es un <i>lookup</i>: un vector entrenable por nodo.</li>
<li><b>Similitud en el grafo:</b> definida por co-ocurrencia en caminatas aleatorias.</li>
<li><b>Optimizar</b> para que similitud(u,v) ≈ z<sub>u</sub><sup>T</sup>z<sub>v</sub>.</li>
</ol>
<p>Caminatas aleatorias: <b>expresivas</b> (capturan vecindario local y de orden superior) y <b>eficientes</b> (solo se entrenan los pares que co-ocurren).</p>
<h4>Word2Vec → node2vec</h4>
<div class="tbl-wrap"><table class="mtx"><thead><tr><th></th><th>Word2Vec</th><th>node2vec</th></tr></thead><tbody>
<tr><th>Unidad</th><td>palabra</td><td>nodo</td></tr><tr><th>Secuencia</th><td>oración</td><td>caminata (sesgada por p, q)</td></tr>
<tr><th>Contexto</th><td>palabras en la ventana</td><td>nodos en la ventana de la caminata</td></tr><tr><th>Resultado</th><td>vector por palabra</td><td>vector por nodo</td></tr></tbody></table></div>
<p><b>Skip-gram:</b> una red con una capa oculta recibe el nodo central (one-hot) y predice el contexto. La fila v de la matriz W es el embedding de v.</p>
<h4>SoftMax y muestreo negativo</h4>
<div class="fx">P(v | z<sub>u</sub>) = exp(z<sub>u</sub><sup>T</sup>z′<sub>v</sub>) / Σ<sub>n∈V</sub> exp(z<sub>u</sub><sup>T</sup>z′<sub>n</sub>) &nbsp;&nbsp; → costo O(|V|²) en total</div>
<div class="fx">L = −log σ(z<sub>u</sub><sup>T</sup>z′<sub>v</sub>) − Σ<sub>j=1..m</sub> log σ(−z<sub>u</sub><sup>T</sup>z′<sub>n<sub>j</sub></sub>)</div>
<p>Se comparan solo el par real y m negativos (m = 5–20, muestreados con más probabilidad para nodos de alto grado). El primer término sube el producto del par real (σ → 1); el segundo baja el de los negativos (σ → 0).</p>
<h4>Caminatas sesgadas (Grover &amp; Leskovec, 2016)</h4>
<p>Tras recorrer t → v, el siguiente x se elige con π(v,x) ∝ α(t,x)·w(v,x):</p>
<div class="tbl-wrap"><table class="mtx"><thead><tr><th>Movimiento</th><th>Condición</th><th>α</th></tr></thead><tbody>
<tr><th>Regresar</th><td>x = t</td><td>1/p</td></tr><tr><th>Quedarse cerca</th><td>x vecino de t</td><td>1</td></tr><tr><th>Alejarse</th><td>x a distancia 2 de t</td><td>1/q</td></tr></tbody></table></div>
<ul>
<li><b>p alto:</b> evita regresar (explora). <b>p bajo:</b> regresa seguido.</li>
<li><b>q alto (&gt;1): tipo BFS</b> — vecindario local, captura <b>roles estructurales</b>.</li>
<li><b>q bajo (&lt;1): tipo DFS</b> — se aleja, captura <b>comunidades</b> (homofilia).</li>
<li>p = q = 1 ⇒ caminata uniforme (DeepWalk). p y q se ajustan con grid search.</li>
</ul>
<p>Pipeline: probabilidades de transición (alias tables) → r caminatas de largo l por nodo → skip-gram con muestreo negativo (SGD) → f: V → ℝ<sup>d</sup>. Resultados: node2vec supera a DeepWalk, LINE y espectral en clasificación multi-etiqueta (+22% en BlogCatalog).</p>
<h4>Limitaciones de node2vec</h4>
<ul><li>O(|V|) parámetros, sin compartir pesos.</li><li><b>Transductivo:</b> no da embedding a un nodo nuevo sin reentrenar.</li><li>Ignora los atributos X de los nodos.</li></ul>
<p>→ Las GNN resuelven las tres.</p>
`;

  theory.gnn = `
<h2>Redes neuronales de grafos (GNN)</h2>
<p class="lead">Queremos un encoder que <b>comparta parámetros</b>, <b>generalice a nodos nuevos</b> (inductivo) y <b>use los atributos X</b>. Grafo G = (V, E, X).</p>

<h3>¿Por qué no CNN/RNN?</h3>
<p>Asumen estructuras regulares (grid, secuencia). Los grafos tienen (1) tamaño y topología arbitrarios, sin localidad tipo grid; (2) <b>sin orden canónico</b> de nodos (invariancia a permutaciones); (3) suelen ser dinámicos y con atributos multimodales. La convolución en grafos generaliza el filtro 3×3 a un vecindario N(v) de tamaño variable y sin orden.</p>

<h3>Una capa GNN = Mensaje + Agregación</h3>
<div class="fx">Mensaje: m<sub>u</sub><sup>(l)</sup> = MSG(h<sub>u</sub><sup>(l−1)</sup>), p. ej. W<sup>(l)</sup>h<sub>u</sub><sup>(l−1)</sup><br>Agregación: h<sub>v</sub><sup>(l)</sup> = AGG({m<sub>u</sub><sup>(l)</sup> : u ∈ N(v)}) — Sum, Mean o Max</div>
<p><b>AGG debe ser simétrica</b> (invariante al orden): si no, el mismo grafo con nodos renumerados daría embeddings distintos.</p>
<p><b>Problema:</b> si solo se agregan vecinos, el nodo "olvida" su propio estado. <b>Solución:</b> incluir h<sub>v</sub><sup>(l−1)</sup> con su propia matriz B<sup>(l)</sup> (concatenar o sumar).</p>
<div class="fx">h<sub>v</sub><sup>(0)</sup> = x<sub>v</sub> &nbsp;&nbsp; h<sub>v</sub><sup>(l)</sup> = σ( W<sup>(l)</sup> · (1/|N(v)|) Σ<sub>u∈N(v)</sub> h<sub>u</sub><sup>(l−1)</sup> + B<sup>(l)</sup> · h<sub>v</sub><sup>(l−1)</sup> ) &nbsp;&nbsp; z<sub>v</sub> = h<sub>v</sub><sup>(L)</sup></div>
<p>Ejemplo de clase: W = [[1,−2],[0,1]], B = [[1,0],[1,1]], ReLU. Nodo 1 (vecinos 2 y 3, h = [0,1] y [1,1]): mensajes [−2,1] y [−1,1] → promedio [−1.5, 1]; propio B·[1,0] = [1,1]; suma [−0.5, 2] → ReLU → <b>[0, 2]</b>.</p>
<p>Apilar L capas ⇒ cada nodo recibe información de su vecindario a <b>L saltos</b> (grafo de cómputo). W y B son los mismos para todos los nodos.</p>

<h3>Tareas</h3>
<div class="tbl-wrap"><table class="mtx"><thead><tr><th>Nivel</th><th>Cómo</th><th>Ejemplo</th></tr></thead><tbody>
<tr><th>Nodo</th><td>Clasificador sobre h<sub>v</sub><sup>L</sup>: ŷ = softmax(W<sub>out</sub> h<sub>v</sub><sup>L</sup>)</td><td>Función de una proteína, tipo de usuario, fraude</td></tr>
<tr><th>Arista</th><td>Decodificador f(h<sub>u</sub>, h<sub>v</sub>): producto punto, Hadamard + MLP, concatenación + MLP (no simétrica); P = σ(s)</td><td>Recomendación, interacciones proteína-proteína</td></tr>
<tr><th>Grafo</th><td><b>Readout</b> simétrico (suma, promedio, máx) de todos los h<sub>v</sub><sup>L</sup></td><td>Toxicidad de una molécula</td></tr></tbody></table></div>

<h3>Entrenamiento</h3>
<ul>
<li><b>Clasificación de nodos:</b> solo los nodos etiquetados aportan a la pérdida (entropía cruzada); el resto participa propagando información (semi-supervisado). ∂ℒ/∂z = ŷ − y.</li>
<li><b>Backpropagation:</b> el gradiente pasa por W<sub>out</sub> y llega a W<sup>(l)</sup>, B<sup>(l)</sup> de la capa L a la 1; por las aristas, el error de un nodo llega a nodos a L saltos. El gradiente de W suma los aportes de todos los nodos de entrenamiento.</li>
<li><b>Predicción de enlaces:</b> BCE con positivos (aristas reales: −log σ(s)) y negativos (pares sin arista: −log(1−σ(s))). <b>Retirar del grafo las aristas a predecir</b> para evitar fuga de información.</li>
<li>Optimizador SGD o Adam; en grafos grandes, mini-batches de nodos con muestreo de vecinos (GraphSAGE).</li>
</ul>

<h3>Variantes</h3>
<div class="tbl-wrap"><table class="mtx"><thead><tr><th>Modelo</th><th>Agregación</th><th>Ventaja</th><th>Limitación</th></tr></thead><tbody>
<tr><th>GCN (Kipf &amp; Welling, 2017)</th><td>Vecinos + propio nodo, normalizado por el grado</td><td>Simple y eficiente</td><td>Transductivo en su forma original; todos los vecinos pesan igual; over-smoothing con muchas capas</td></tr>
<tr><th>GraphSAGE (Hamilton et al., 2017)</th><td>Muestrea un nº fijo de vecinos, agrega (mean/max/LSTM) y concatena con el propio nodo</td><td>Inductivo, escala a grafos enormes (mini-batches)</td><td>El muestreo pierde información</td></tr>
<tr><th>GAT (Veličković et al., 2018)</th><td>Pondera a cada vecino con atención aprendida</td><td>Vecinos de distinta importancia, interpretable</td><td>Más costoso en memoria y cómputo</td></tr></tbody></table></div>

<h3>node2vec vs GNN</h3>
<div class="tbl-wrap"><table class="mtx"><thead><tr><th></th><th>node2vec (superficial)</th><th>GNN</th></tr></thead><tbody>
<tr><th>Encoder</th><td>Tabla: un vector por nodo</td><td>Función compartida (mensaje + agregación)</td></tr>
<tr><th>Parámetros</th><td>Crecen con |V|</td><td>No dependen de |V|</td></tr>
<tr><th>Atributos X</th><td>No los usa</td><td>Entrada: h<sup>0</sup> = X</td></tr>
<tr><th>Nodos nuevos</th><td>Transductivo: reentrenar</td><td>Inductivo: aplicar la misma función</td></tr>
<tr><th>Entrenamiento</th><td>Co-ocurrencia en caminatas (no supervisado)</td><td>Cualquier pérdida (supervisada o no)</td></tr></tbody></table></div>
<p><b>Aplicaciones donde una GNN supera a ML clásico:</b> moléculas (toxicidad, fármacos), detección de fraude en redes de transacciones, recomendación (grafo usuario-ítem, PinSage), tráfico (grafo vial), redes de citas, interacciones proteína-proteína. La relación entre entidades es parte de la señal.</p>
`;

  theory.clu = `
<h2>Clustering a gran escala: BFR</h2>
<p class="lead">Este tema es de la primera parte del curso (MMDS, cap. 7), pero <b>apareció en el examen 2026-1</b> como caso de estudio. BFR (Bradley-Fayyad-Reina) es una variante de k-means para datos que <b>no caben en RAM</b>.</p>

<h3>Supuestos</h3>
<ul><li>Espacio euclidiano.</li><li>Cada cluster sigue una distribución <b>normal</b> alrededor de su centroide, con dimensiones independientes (elipses alineadas con los ejes).</li></ul>

<h3>Los tres conjuntos</h3>
<div class="tbl-wrap"><table class="mtx"><tbody>
<tr><th>DS · Discard Set</th><td>Puntos suficientemente cerca de un centroide: se <b>resumen</b> en el cluster y se descartan de memoria.</td></tr>
<tr><th>CS · Compression Set</th><td>Mini-clusters de puntos cercanos entre sí pero lejos de todo centroide: se resumen, pero no se asignan a un cluster.</td></tr>
<tr><th>RS · Retained Set</th><td>Puntos aislados: se guardan tal cual en memoria.</td></tr></tbody></table></div>

<h3>Resumen de un cluster: 2d + 1 números</h3>
<div class="fx">N (nº de puntos) · SUM<sub>i</sub> (suma por dimensión) · SUMSQ<sub>i</sub> (suma de cuadrados por dimensión)</div>
<div class="fx">centroide c<sub>i</sub> = SUM<sub>i</sub>/N &nbsp;&nbsp; varianza σ<sub>i</sub>² = SUMSQ<sub>i</sub>/N − (SUM<sub>i</sub>/N)²</div>
<p>Son <b>aditivos</b>: añadir un punto o fusionar dos clusters = sumar sus N, SUM y SUMSQ. Esa propiedad es la clave de su eficiencia y de su paralelización.</p>

<h3>Algoritmo (pseudocódigo)</h3>
<div class="fx">1. Inicializar k centroides (muestra en RAM, k-means sobre la muestra)<br>
2. Para cada bloque (chunk) de datos que cabe en RAM:<br>
&nbsp;&nbsp;a. Para cada punto: si Mahalanobis(p, c<sub>j</sub>) &lt; umbral (p. ej. 2–3σ) → añadir al DS del cluster j (actualizar N, SUM, SUMSQ) y descartar p<br>
&nbsp;&nbsp;b. Puntos restantes + RS: clustering en memoria (k-means/jerárquico) → mini-clusters a CS; aislados → RS<br>
&nbsp;&nbsp;c. Fusionar mini-clusters de CS si la varianza combinada es baja<br>
&nbsp;&nbsp;d. Escribir a disco las asignaciones de los puntos descartados (opcional)<br>
3. Última ronda: asignar CS y RS al centroide más cercano (o tratarlos como outliers)</div>
<div class="fx">Mahalanobis: d(p, c) = √ Σ<sub>i</sub> ((p<sub>i</sub> − c<sub>i</sub>)/σ<sub>i</sub>)²</div>
<p>Si los datos son normales, ~68% de los puntos está a d &lt; √d y el umbral se expresa en desviaciones estándar.</p>

<h3>Por qué es eficiente y escalable</h3>
<ul>
<li><b>Una sola pasada</b> sobre los datos (lectura secuencial por bloques): I/O mínimo.</li>
<li><b>Memoria O(k·d)</b> + CS + RS, independiente de n: los puntos del DS se descartan.</li>
<li><b>Estadísticas aditivas:</b> actualizar = sumar, O(d) por punto.</li>
<li><b>En un clúster de N servidores:</b> cada servidor procesa su partición con los mismos centroides iniciales y produce sus resúmenes (N, SUM, SUMSQ por cluster, sus CS y RS). Un reducer suma los resúmenes del mismo cluster (Map → combinar → Reduce, sin mover los puntos crudos por la red), fusiona CS compatibles y resuelve el RS. Comunicación O(N·k·d).</li>
</ul>
<h3>Limitaciones</h3>
<ul><li>Supone clusters normales y alineados con los ejes; falla con formas arbitrarias o correlaciones.</li><li>Depende de los centroides iniciales y de k.</li><li>Alternativa para formas arbitrarias: <b>CURE</b> (puntos representativos que se encogen hacia el centroide).</li></ul>
`;

  theory.dis = `
<h2>Cómo responder casos de estudio</h2>
<p class="lead">Los casos de estudio valen 2 puntos cada uno y piden <b>diseñar y justificar</b>. El profesor busca que conectes el problema con las técnicas del curso y que hables de escalabilidad.</p>

<h3>Estructura recomendada (6 bloques)</h3>
<ol>
<li><b>Reformular el problema</b> como una tarea de data mining: ¿predecir un valor (regresión), una clase (clasificación de nodos), un enlace (link prediction), agrupar (comunidades/clustering) o rankear (PageRank)?</li>
<li><b>Representación de los datos:</b> tabla de vectores, matriz de utilidad, grafo intrínseco (aristas observadas) o grafo de proximidad (k-NN). Define nodos, aristas, pesos y atributos.</li>
<li><b>Pipeline</b> paso a paso: ingesta → limpieza → construcción del grafo/matriz → features/embeddings → modelo → evaluación → despliegue.</li>
<li><b>Algoritmos concretos</b> y <b>por qué</b> esos (y no otros): compara con la alternativa.</li>
<li><b>Evaluación:</b> RMSE/MAE (recomendación), Q (comunidades), ARI/NMI contra etiquetas, F1/AUC (clasificación, enlaces), validación temporal si hay tiempo.</li>
<li><b>Escalabilidad:</b> complejidad, memoria, distribución (Spark/GraphX, MapReduce, block-stripe, mini-batches con muestreo de vecinos, LSH/ANN para k-NN, muestreo de raíces para betweenness).</li>
</ol>

<h3>Mapa problema → técnica</h3>
<div class="tbl-wrap"><table class="mtx"><thead><tr><th>Si el caso pide…</th><th>Técnicas del curso</th></tr></thead><tbody>
<tr><th>Recomendar productos/contenidos</th><td>FC ítem-ítem, factores latentes con sesgos (SGD), contenido (TF-IDF) para cold start, híbridos; GNN/node2vec sobre grafo usuario-ítem</td></tr>
<tr><th>Rankear importancia / influencia</th><td>PageRank (teletransporte), Topic-Specific PageRank, TrustRank, HITS; betweenness para "intermediarios"</td></tr>
<tr><th>Encontrar grupos en una red</th><td>Louvain/Leiden (grande), LPA (muy grande, rápido), espectral (k conocido), Girvan-Newman (pequeño, jerarquía), BigCLAM (superpuestas)</td></tr>
<tr><th>Puentes / puntos críticos</th><td>Edge betweenness (Brandes), Girvan-Newman</td></tr>
<tr><th>Objetos como vectores → relaciones</th><td>Grafo k-NN (proximidad) + Louvain / PageRank / propagación de etiquetas / GNN</td></tr>
<tr><th>Predecir algo de cada nodo</th><td>node2vec + clasificador (transductivo) o GNN (inductivo, usa atributos)</td></tr>
<tr><th>Predecir relaciones futuras</th><td>Link prediction con GNN (producto punto + σ, BCE) o node2vec</td></tr>
<tr><th>Clasificar grafos completos</th><td>GNN + readout</td></tr>
<tr><th>Datos que no caben en RAM</th><td>BFR (clustering), block-stripe (PageRank), Spark/MapReduce, SGD por mini-batches</td></tr>
</tbody></table></div>

<h3>Frases que suman puntos</h3>
<ul>
<li>"La relación entre entidades es parte de la señal; un modelo tabular la ignora."</li>
<li>"Las aristas del grafo k-NN se construyen, no se observan: dependen de k y la métrica, por eso pruebo varios k y comparo Q."</li>
<li>"Louvain es O(n log n) y no necesita k; Girvan-Newman es O(m²n) y no escala."</li>
<li>"node2vec es transductivo; para entidades nuevas uso GraphSAGE (inductivo, muestreo de vecinos)."</li>
<li>"Evito fuga de información: separo train/test temporalmente y retiro del grafo las aristas a predecir."</li>
</ul>
`;

  /* -------------------- RECETAS (cómo resolver) -------------------- */
  const recipes = {
    cf_item_cos: { steps: ['Identifica las películas que SÍ calificó el usuario objetivo (serán los vecinos).', 'Escribe cada ítem como vector sobre los usuarios (vacío = 0).', 'Calcula cos(objetivo, j) = producto punto / (norma · norma) para cada vecino.', 'Predicción = Σ sim·rating del usuario / Σ sim.'], traps: ['No uses al propio ítem objetivo como vecino.', 'Si el enunciado dice "use todas las películas calificadas por X", no apliques Top-K.', 'Revisa la convención de vacíos: aquí cuentan como 0 en el vector completo. Si el profesor pidiera usar solo co-calificados, el resultado cambia; dilo explícitamente en tu hoja.'] },
    cf_user_pearson: { steps: ['Media de cada usuario con todas sus calificaciones.', 'Para cada otro usuario, identifica los ítems en común y aplica Pearson con esas medias.', 'Filtra: similitud > 0 y que haya calificado el ítem buscado. Toma los k mejores.', 'Promedio ponderado (o simple si lo piden) de sus calificaciones del ítem.'], traps: ['Un usuario muy similar que NO calificó el ítem no sirve como vecino.', 'Similitud negativa: se descarta en esta convención.', 'Si todos los centrados son 0, el denominador es 0: similitud 0.'] },
    cf_item_pearson: { steps: ['Ahora las filas son ítems: media de cada ítem.', 'Pearson entre el ítem objetivo y cada otro ítem sobre usuarios en común.', 'Vecinos: k ítems más similares (positivos) que el usuario objetivo calificó.', 'r̂ = Σ s_ij·r_xj / Σ s_ij.'], traps: ['Cuando todos los vecinos tienen la misma calificación del usuario, la predicción es exactamente esa calificación (los pesos se cancelan).'] },
    content_cos: { steps: ['Perfil de usuario = promedio (o promedio ponderado por rating) de los vectores de los ítems que le gustaron.', 'Coseno entre el perfil y el ítem nuevo.'], traps: ['El coseno con valores no negativos queda entre 0 y 1.'] },
    tfidf: { steps: ['TF = frecuencia del término en el doc / frecuencia máxima en ese doc.', 'IDF = log(N / nº de docs que contienen el término).', 'Multiplicar.'], traps: ['Confirma la base del logaritmo (MMDS usa log₂; otras fuentes ln o log₁₀).', 'Un término que aparece en todos los documentos tiene IDF = 0.'] },
    baseline: { steps: ['μ = media de todas las calificaciones conocidas.', 'b_x = media del usuario − μ; b_i = media del ítem − μ.', 'b_xi = μ + b_x + b_i.'], traps: ['No incluyas la celda desconocida en las medias.'] },
    mae_rmse: { steps: ['Errores e = pred − real.', 'MAE = promedio de |e|.', 'RMSE = raíz del promedio de e².'], traps: ['RMSE ≥ MAE; son iguales solo si todos los |e| son iguales.'] },
    latent_pred: { steps: ['Producto punto q_i · p_x.', 'Sumar μ + b_x + b_i.', 'Recomendar el de mayor predicción (recortar a [1,5] si hace falta).'], traps: ['Si el enunciado dice "sesgos = 0 y μ = 0", la predicción es solo el producto punto.'] },
    sgd_step: { steps: ['e = r − q·p.', 'q_nuevo = q + η(e·p − λq).', 'p_nuevo = p + η(e·q_viejo − λp).'], traps: ['Usar q nuevo al actualizar p es un error común.'] },
    pr_power: { steps: ['Grado de salida de cada nodo.', 'Matriz M: columna i tiene 1/d_i en las filas de sus destinos.', 'r(1) = M·r(0): para cada nodo j, suma r_i/d_i de quienes lo apuntan.', 'Repetir con r(1).'], traps: ['M es columna-estocástica: M[j][i] (fila destino, columna origen).', 'Comprueba que r siempre sume 1.'] },
    pr_teleport: { steps: ['M igual que antes.', 'r_nuevo = β·M·r + (1−β)/N para cada nodo.', 'Opcional: Google Matrix A = βM + (1−β)/N.'], traps: ['El término (1−β)/N se suma a TODOS los nodos, también a los sin in-links.'] },
    pr_blockstripe: { steps: ['r en RAM, acumulador en 0.', 'Stripe 1: por cada enlace i → j sumar β·r[i]/d[i] a r_nuevo[j].', 'Stripe 2: seguir acumulando (sin reiniciar).', 'Al final, sumar (1−β)/N a cada posición.'], traps: ['Sumar (1−β)/N en cada stripe es un error: va una sola vez.', 'El grado d[i] es el grado total de i, no el número de enlaces de i dentro del stripe.'] },
    pr_flow: { steps: ['Una ecuación por nodo: r_j = Σ r_i/d_i.', 'Reemplazar una ecuación por r_A + r_B + r_C = 1.', 'Resolver por sustitución.'], traps: ['Las ecuaciones de flujo solas tienen infinitas soluciones (escala libre): la suma = 1 la fija.'] },
    pr_traps: { steps: ['Dead end: nodo con grado de salida 0.', 'Spider trap: conjunto cerrado (nadie sale) que no es todo el grafo.', 'Solución: teletransporte con β.'], traps: ['Un nodo con auto-lazo como única salida también es un spider trap.'] },
    bet_source: { steps: ['BFS desde la raíz: asigna niveles.', 'σ(raíz) = 1; σ(v) = suma de σ de sus padres (vecinos en el nivel anterior).', 'De abajo hacia arriba: crédito(v) = 1 + lo recibido de hijos.', 'Reparte a cada padre u: crédito(v) · σ(u)/σ(v).', 'Aristas dentro de un mismo nivel: 0.'], traps: ['La raíz no reparte crédito.', 'Las hojas tienen crédito 1.', 'Si un nodo tiene 2 padres con σ distintos, el reparto NO es mitad y mitad.'] },
    bet_two: { steps: ['Haz el procedimiento completo (BFS + crédito) desde la primera fuente.', 'Repite desde la segunda.', 'Suma ambos aportes por arista.', 'Para los puentes, piensa en el betweenness completo: aristas que unen dos grupos densos.'], traps: ['Con todas las fuentes se divide entre 2; con solo dos fuentes reporta la suma (y menciona el ÷2 si se completara).', 'Una arista con aporte alto desde una fuente cercana (p. ej. A–C desde A) no es necesariamente puente.'] },
    bet_full: { steps: ['Ejecuta BFS + crédito desde cada nodo.', 'Suma por arista.', 'Divide entre 2.'], traps: ['Alternativa para grafos muy pequeños: listar los caminos más cortos de cada par (como la tabla de la clase).'] },
    modularity: { steps: ['m = nº de aristas, grados de cada nodo.', 'Por comunidad: L_c (aristas internas) y D_c (suma de grados).', 'Q = Σ [L_c/m − (D_c/2m)²].'], traps: ['D_c suma los grados completos (incluye aristas que salen de la comunidad).'] },
    louvain_agg: { steps: ['Por comunidad, cuenta las aristas internas → auto-lazo = 2 × internas (convención de la figura).', 'Por par de comunidades, cuenta las aristas que cruzan → peso de la arista entre supernodos.', 'Nivel 2: auto-lazo del nuevo supernodo = suma de auto-lazos + 2 × pesos entre los supernodos que se fusionan; peso entre grupos = suma de pesos que cruzan.', 'Verifica: Σ auto-lazos + 2·Σ pesos = 2m.'], traps: ['No olvides las aristas internas de nodos que están "lejos" en el dibujo.', 'Si el profesor usara auto-lazo = nº de aristas internas (sin ×2), indícalo; la figura del examen usa ×2 (purple: 7 aristas → 14).'] },
    louvain_dq: { steps: ['m, grado k_i del nodo.', 'Para cada comunidad vecina: k_i,in (aristas de i hacia C) y Σtot (suma de grados de C).', 'ΔQ = k_i,in/m − k_i·Σtot/(2m²).', 'Mover a la de mayor ΔQ > 0.'], traps: ['Σtot no incluye al propio nodo i (está aislado).'] },
    spectral: { steps: ['L = D − A (diagonal = grado, −1 si hay arista).', 'Autovalores ascendentes: λ₁ = 0.', 'k = 2: signo del vector de Fiedler (v₂).', 'k > 2: K-means sobre las filas de [v₁..v_k]; k por eigengap.'], traps: ['El signo del autovector es arbitrario; importa quién comparte signo.'] },
    lpa: { steps: ['Etiqueta inicial = nombre del nodo.', 'En el orden fijado, cada nodo toma la etiqueta más frecuente de sus vecinos (usando las ya actualizadas).', 'Empates según la regla dada.', 'Repetir hasta que nadie cambie.'], traps: ['Síncrono vs asíncrono da resultados distintos; aquí es asíncrono.'] },
    node2vec: { steps: ['Primer paso: al menor vecino (regla de clase).', 'Desde v (venías de t): para cada vecino x calcula α (1/p si x = t, 1 si x vecino de t, 1/q si no).', 'Elige el mayor α (empate: menor etiqueta).', 'Pares skip-gram: para cada posición, contexto = nodos a distancia ≤ ventana.'], traps: ['Con ventana 1 y L nodos hay 2(L−1) pares.', 'x "a distancia 2 de t" significa que no es t ni vecino de t.'] },
    neg_sampling: { steps: ['Productos punto.', 'σ(z) = 1/(1+e^−z).', 'L = −ln σ(par real) − Σ ln σ(−negativo).'], traps: ['El signo menos dentro de σ para los negativos.'] },
    gnn_layer: { steps: ['Mensajes: W·h_u para cada vecino u.', 'Promedio de los mensajes.', 'Propio: B·h_v.', 'Sumar y aplicar ReLU componente a componente.'], traps: ['Multiplicación matriz-vector: fila · vector.', 'ReLU solo corta negativos.'] },
    gnn_softmax: { steps: ['z = W_out · h.', 'softmax: e^z / Σ e^z.', 'Clase = argmax.'], traps: [] },
    link_pred: { steps: ['s = h_u · h_v.', 'P = σ(s).', 'BCE: −ln P si es arista real, −ln(1−P) si no.'], traps: [] },
    knn_graph: { steps: ['Distancias de cada punto a los demás.', 'Para cada punto, sus k más cercanos.', 'Unir aristas (unión: basta que uno elija al otro).', 'Contar aristas sin duplicar.'], traps: ['La relación k-NN no es simétrica: por eso hay grados mayores que k.'] },
    svd_embed: { steps: ['Producto punto del documento con cada vector singular derecho.'], traps: [] },
    bfr: { steps: ['N, SUM y SUMSQ por dimensión.', 'Centroide = SUM/N; σ² = SUMSQ/N − centroide².', 'Mahalanobis normalizando cada dimensión por σ.', 'Comparar con el umbral.'], traps: ['Es varianza poblacional (divide entre N).'] },
    encoding: { steps: ['Sumar dimensiones de cada bloque.', 'Dispersión = 1 − activos/total.'], traps: [] },
  };

  /* -------------------- QUIZZES -------------------- */
  const quizzes = {
    rec: [
      { q: '¿Por qué se recomienda Pearson sobre el coseno en FC?', o: ['Es más rápido de calcular', 'Usa solo ítems comunes y centra por la media de cada usuario', 'Siempre da valores entre 0 y 1', 'No necesita calificaciones'], a: 1, e: 'Pearson elimina el sesgo de usuarios generosos/exigentes y no trata los vacíos como 0.' },
      { q: '¿Qué problema tiene el coseno con vacíos = 0?', o: ['Ignora el valor de la calificación', 'Trata el vacío como una calificación negativa', 'No funciona con matrices dispersas', 'Es asimétrico'], a: 1, e: 'Los ceros "empujan" el ángulo hacia menor similitud.' },
      { q: 'Empíricamente, ¿qué funciona mejor?', o: ['Usuario-usuario', 'Ítem-ítem', 'Jaccard', 'Promedio global'], a: 1, e: 'Los ítems son más estables; los usuarios tienen gustos múltiples.' },
      { q: '¿Cuál NO es una desventaja del filtrado colaborativo?', o: ['Cold start', 'Sesgo de popularidad', 'Necesita extraer características de los ítems', 'Matriz dispersa'], a: 2, e: 'Esa es una desventaja del basado en contenido; el FC no necesita features.' },
      { q: '¿Por qué no se aplica SVD clásico directamente a la matriz de ratings?', o: ['Es demasiado preciso', 'Necesita la matriz completa y R tiene ~99% de vacíos', 'Solo funciona con matrices cuadradas', 'No produce factores'], a: 1, e: 'Imputar vacíos sesga; se optimiza solo sobre ratings conocidos con SGD.' },
      { q: 'Si k (nº de factores) crece mucho sin regularización…', o: ['Baja el RMSE de test', 'Baja el RMSE de train y sube el de test (sobreajuste)', 'No cambia nada', 'El modelo no converge nunca'], a: 1, e: 'Por eso se añade λ(‖p‖² + ‖q‖²).' },
      { q: 'RMSE frente a MAE:', o: ['RMSE ≤ MAE siempre', 'RMSE ≥ MAE y penaliza más los errores grandes', 'Son siempre iguales', 'MAE penaliza más los errores grandes'], a: 1, e: 'Elevar al cuadrado amplifica los errores grandes.' },
    ],
    pr: [
      { q: 'En la matriz M de PageRank, M[j][i] = 1/dᵢ significa…', o: ['j apunta a i', 'i apunta a j', 'i y j tienen el mismo grado', 'j es un dead end'], a: 1, e: 'Columna = origen, fila = destino. M es columna-estocástica.' },
      { q: '¿Qué le pasa al PageRank con un dead end y sin teletransporte?', o: ['Converge a uniforme', 'La masa se fuga y todo tiende a 0', 'El dead end acumula todo', 'No pasa nada'], a: 1, e: 'Su columna es de ceros; M no es estocástica.' },
      { q: 'Un spider trap provoca que…', o: ['La suma de r sea menor que 1', 'El trap absorba toda la importancia', 'Power iteration sea más rápido', 'M deje de ser cuadrada'], a: 1, e: 'M sigue siendo estocástica pero el surfista no sale.' },
      { q: 'Si β → 0, el PageRank tiende a…', o: ['El autovector de M', 'La distribución uniforme 1/N', 'Concentrarse en el nodo con más in-links', 'Cero'], a: 1, e: 'El surfista casi siempre salta al azar.' },
      { q: 'En Block-Stripe, ¿qué se mantiene en RAM?', o: ['La lista de adyacencia completa', 'El vector r y el acumulador r_nuevo; un stripe a la vez', 'Solo un stripe', 'La matriz M densa'], a: 1, e: 'La lista de adyacencia se lee de disco por stripes.' },
      { q: '¿Puede una página sin in-links tener PageRank positivo?', o: ['No, nunca', 'Sí, (1−β)/N gracias al teletransporte', 'Solo si es un dead end', 'Solo con β = 1'], a: 1, e: 'Todo nodo recibe el término de salto aleatorio.' },
      { q: '¿Qué extensión combate las granjas de enlaces (link spam)?', o: ['HITS', 'TrustRank', 'SimRank', 'Power iteration'], a: 1, e: 'Teletransporta solo a páginas confiables.' },
    ],
    com: [
      { q: 'Las aristas con alto edge betweenness suelen ser…', o: ['Aristas internas de una comunidad', 'Puentes entre comunidades (lazos débiles)', 'Auto-lazos', 'Aristas de nodos hoja'], a: 1, e: 'Muchos caminos cortos pasan por ellas.' },
      { q: 'En Girvan-Newman, tras eliminar una arista…', o: ['Se elimina la siguiente de la lista inicial', 'Se recalcula el betweenness', 'Se calcula Q y se termina', 'Se agregan supernodos'], a: 1, e: 'El betweenness cambia tras cada eliminación.' },
      { q: 'En la propagación de crédito, una arista entre dos nodos del mismo nivel BFS recibe…', o: ['1', '0.5', '0', 'El crédito del nodo menor'], a: 2, e: 'No está en ningún camino más corto desde la raíz.' },
      { q: 'Modularidad Q ≈ 0 indica…', o: ['Comunidades perfectas', 'Partición no mejor que aleatoria', 'Grafo desconectado', 'Error de cálculo'], a: 1, e: 'Las aristas internas coinciden con las esperadas por azar.' },
      { q: 'El vector de Fiedler es…', o: ['El autovector de λ₁ = 0', 'El segundo autovector de L (2º menor autovalor)', 'El autovector de mayor autovalor', 'El vector de grados'], a: 1, e: 'Su signo da el corte para k = 2.' },
      { q: '¿Qué algoritmo es O(m) por iteración pero no determinista?', o: ['Louvain', 'Label Propagation', 'Espectral', 'Girvan-Newman'], a: 1, e: 'El orden aleatorio y los empates cambian el resultado.' },
      { q: 'En la fase 2 de Louvain, las aristas internas de una comunidad se convierten en…', o: ['Se eliminan', 'Un auto-lazo ponderado del supernodo', 'Aristas entre supernodos', 'Nuevas comunidades'], a: 1, e: 'Y las aristas entre comunidades en aristas con peso acumulado.' },
      { q: '¿Qué problema de Louvain corrige Leiden?', o: ['Necesitar k', 'Comunidades mal conectadas o desconectadas', 'Lentitud O(m²n)', 'No soportar pesos'], a: 1, e: 'Con una fase de refinamiento.' },
    ],
    rep: [
      { q: 'Integer encoding para una variable nominal (color) es problemático porque…', o: ['Ocupa mucha memoria', 'Introduce un orden artificial', 'No es numérico', 'Es disperso'], a: 1, e: 'rojo < azul no tiene sentido.' },
      { q: 'Un grafo k-NN es un grafo…', o: ['Intrínseco', 'De proximidad: aristas construidas por similitud', 'Bipartito siempre', 'Dirigido acíclico'], a: 1, e: 'Las aristas dependen de k y de la métrica.' },
      { q: 'En node2vec, q < 1 produce caminatas…', o: ['Tipo BFS (locales)', 'Tipo DFS (se alejan)', 'Uniformes', 'Que siempre regresan'], a: 1, e: 'α = 1/q > 1 premia alejarse; captura comunidades.' },
      { q: 'Con p = q = 1, node2vec equivale a…', o: ['LINE', 'DeepWalk', 'SVD', 'GCN'], a: 1, e: 'Caminata aleatoria uniforme.' },
      { q: '¿Por qué se usa muestreo negativo?', o: ['Para tener más datos', 'Para evitar el SoftMax sobre todos los nodos (costo O(|V|))', 'Para regularizar', 'Para que el grafo sea no dirigido'], a: 1, e: 'Solo se comparan el par real y m negativos.' },
      { q: 'node2vec es transductivo, lo que significa que…', o: ['Usa atributos', 'No puede dar embedding a un nodo nuevo sin reentrenar', 'Comparte parámetros', 'Funciona solo con grafos dirigidos'], a: 1, e: 'Es una tabla de lookup por nodo.' },
    ],
    gnn: [
      { q: 'La función AGG de una GNN debe ser…', o: ['Diferenciable y creciente', 'Simétrica (invariante al orden de los vecinos)', 'Lineal', 'Inyectiva'], a: 1, e: 'Los nodos no tienen orden canónico.' },
      { q: '¿Por qué se añade B·h_v en la capa?', o: ['Para normalizar', 'Para que el nodo no olvide su propio estado', 'Para reducir parámetros', 'Para hacerla no lineal'], a: 1, e: 'Si solo se agregan vecinos, h_v no depende de su estado anterior.' },
      { q: 'Con L capas apiladas, un nodo recibe información de…', o: ['Sus vecinos directos', 'Su vecindario a L saltos', 'Todo el grafo siempre', 'Solo de sí mismo'], a: 1, e: 'Grafo de cómputo de profundidad L.' },
      { q: 'Para clasificar un grafo completo (molécula) se usa…', o: ['El embedding de un nodo al azar', 'Un readout simétrico (suma/promedio/máx) de los embeddings', 'PageRank', 'node2vec'], a: 1, e: 'Readout como AGG: no depende del orden.' },
      { q: '¿Qué arquitectura muestrea un número fijo de vecinos y es inductiva?', o: ['GCN', 'GraphSAGE', 'GAT', 'DeepWalk'], a: 1, e: 'Permite mini-batches en grafos enormes.' },
      { q: 'En link prediction, ¿por qué retirar del grafo las aristas a predecir?', o: ['Para acelerar', 'Para evitar fuga de información', 'Porque son negativas', 'Por memoria'], a: 1, e: 'Si no, el modelo ya las ve al propagar mensajes.' },
    ],
    clu: [
      { q: '¿Qué guarda BFR por cada cluster del DS?', o: ['Todos sus puntos', 'N, SUM y SUMSQ (2d + 1 números)', 'Solo el centroide', 'La matriz de covarianza completa'], a: 1, e: 'Estadísticas suficientes y aditivas.' },
      { q: 'El Retained Set (RS) contiene…', o: ['Puntos asignados a un cluster', 'Mini-clusters comprimidos', 'Puntos aislados que se mantienen en memoria', 'Los centroides'], a: 2, e: 'DS = descartados (resumidos), CS = mini-clusters, RS = aislados.' },
      { q: 'BFR supone que los clusters…', o: ['Tienen forma arbitraria', 'Son normales alrededor del centroide con ejes independientes', 'Son del mismo tamaño', 'Están en espacios no euclidianos'], a: 1, e: 'Por eso usa Mahalanobis con σ por dimensión.' },
      { q: '¿Por qué BFR paraleliza bien en N servidores?', o: ['Porque comparte todos los puntos', 'Porque N, SUM, SUMSQ se combinan sumando', 'Porque no necesita centroides', 'Porque es jerárquico'], a: 1, e: 'Cada servidor resume su partición y un reducer suma.' },
    ],
  };

  /* -------------------- CASOS DE ESTUDIO -------------------- */
  const cases = [
    {
      id: 'bfr', topic: 'clu', exam: true, title: 'BFR en un clúster de N servidores',
      prompt: 'Se dispone de un gran volumen de datos que no caben en RAM y un clúster de <i>N</i> servidores: (a) explique cómo funciona el algoritmo BFR (seudocódigo estructurado) y (b) responda por qué resulta eficiente y escalable en este escenario.',
      answer: `<p><b>(a) Funcionamiento.</b> BFR es k-means para datos masivos en espacio euclidiano; supone clusters normales con dimensiones independientes. Mantiene tres conjuntos: <b>DS</b> (puntos resumidos en un cluster), <b>CS</b> (mini-clusters lejos de los centroides) y <b>RS</b> (puntos aislados). Cada cluster/mini-cluster se resume con <b>N, SUM, SUMSQ</b> (2d + 1 números): centroide = SUM/N, σ² = SUMSQ/N − (SUM/N)².</p>
<div class="fx">BFR(datos, k, umbral):<br>
&nbsp;1. Tomar una muestra, k-means → k centroides iniciales; difundirlos a los N servidores<br>
&nbsp;2. En cada servidor s (en paralelo), para cada chunk de su partición que cabe en RAM:<br>
&nbsp;&nbsp;&nbsp;a. para cada punto p: j = argmin Mahalanobis(p, c<sub>j</sub>)<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;si d &lt; umbral: N<sub>j</sub>++, SUM<sub>j</sub> += p, SUMSQ<sub>j</sub> += p²; descartar p (DS)<br>
&nbsp;&nbsp;&nbsp;b. clustering en memoria de los restantes + RS → mini-clusters a CS, aislados a RS<br>
&nbsp;&nbsp;&nbsp;c. fusionar CS cuya varianza combinada sea baja<br>
&nbsp;3. Reduce: por cada cluster j, sumar (N, SUM, SUMSQ) de los N servidores; unir CS y RS<br>
&nbsp;4. Ronda final: fusionar CS con clusters cercanos; asignar RS al más cercano u outliers<br>
&nbsp;5. (Opcional) segunda pasada para escribir la asignación de cada punto</div>
<p><b>(b) Eficiencia y escalabilidad.</b> (1) <b>Una sola pasada</b> secuencial por los datos: el I/O de disco es mínimo. (2) La memoria por servidor es O(k·d) + |CS| + |RS|, <b>independiente del tamaño del dataset</b>, porque los puntos del DS se descartan. (3) Las estadísticas son <b>aditivas</b>: actualizar un cluster es O(d) y combinar resultados de servidores es sumar vectores. (4) En el clúster solo viajan por la red los resúmenes (O(N·k·d)), no los puntos: encaja con MapReduce/Spark (map = resumir partición, reduce = sumar). (5) Escala linealmente añadiendo servidores. Limitación a mencionar: supone clusters gaussianos alineados a los ejes y depende de los centroides iniciales (si no, CURE).</p>`,
      rubric: [['Describe DS, CS y RS correctamente', 0.4], ['Explica el resumen N, SUM, SUMSQ y cómo da centroide y varianza', 0.4], ['Pseudocódigo estructurado con asignación por Mahalanobis/umbral y manejo de CS/RS', 0.5], ['Paralelización: cada servidor resume su partición y se combinan sumando', 0.3], ['Justifica eficiencia: una pasada, memoria independiente de n, estadísticas aditivas, poca comunicación', 0.4]],
    },
    {
      id: 'knn', topic: 'rep', exam: true, title: 'De vectores a un grafo k-NN',
      prompt: 'Un conjunto de objetos está representado por vectores característicos que funcionan bien en técnicas clásicas de ML. Se desea transformarlos en un Grafo KNN para ampliar las técnicas de <i>Data Mining</i>: (a) explique cómo se construye este grafo a partir de los vectores, (b) describa dos algoritmos o técnicas aplicables sobre esta representación, y (c) proponga un caso real y justifique la ventaja del grafo frente a los vectores originales.',
      answer: `<p><b>(a) Construcción.</b> 1) Normalizar/estandarizar los vectores (o reducir con PCA o usar embeddings de una CNN/Sentence-BERT). 2) Elegir métrica (euclídea o coseno) y k. 3) Para cada objeto i, encontrar sus k vecinos más cercanos (a escala, con búsqueda aproximada: LSH, HNSW/FAISS, evitando O(n²)). 4) Crear arista i–j si j ∈ kNN(i) o i ∈ kNN(j) (unión; o versión mutua, más estricta). 5) Peso w(i,j) = similitud coseno (o e^(−d²/σ²)). Es un <b>grafo de proximidad</b>: las aristas se construyen, no se observan, y dependen de k (k pequeño → grafo disperso y muchas comunidades; k grande → mezcla clases), así que se prueban varios k (3, 5, 10, 20).</p>
<p><b>(b) Técnicas.</b> (1) <b>Detección de comunidades con Louvain</b> (o Leiden): maximiza la modularidad Q, no necesita k, O(n log n); descubre grupos de objetos similares, incluso de forma no convexa, a diferencia de K-means. (2) <b>PageRank / centralidad</b>: identifica objetos representativos (prototipos) o anómalos (baja centralidad). Otras válidas: propagación de etiquetas semi-supervisada, clustering espectral, node2vec + clasificador, GNN para clasificación de nodos con pocos etiquetados.</p>
<p><b>(c) Caso real.</b> Catálogo de moda (H&amp;M / Fashion-MNIST): cada prenda es un embedding de CNN. Con el grafo k-NN + Louvain se descubren familias de prendas y relaciones no evidentes en las etiquetas (p. ej., zapatillas y sandalias juntas por forma), se recomiendan "prendas parecidas" navegando vecinos, y con pocas etiquetas se propagan categorías a todo el catálogo. <b>Ventaja:</b> el grafo hace explícitas las relaciones locales entre objetos (vecindarios, estructura de variedad no lineal), habilita algoritmos que no existen sobre una tabla (comunidades, PageRank, caminos, propagación, GNN) y permite combinar similitud de contenido con relaciones observadas (co-compras). Se evalúa con Q, y con ARI/NMI contra las etiquetas reales.</p>`,
      rubric: [['Construcción: vectores → métrica → k vecinos → aristas (unión/mutua) → pesos', 0.5], ['Menciona el efecto de k y/o búsqueda aproximada para escalar', 0.2], ['Dos técnicas aplicables bien descritas (p. ej. Louvain y PageRank/propagación/GNN)', 0.6], ['Caso real concreto', 0.3], ['Ventaja justificada: relaciones explícitas, estructura no lineal, algoritmos de grafos', 0.4]],
    },
    {
      id: 'traffic', topic: 'gnn', exam: true, title: 'Accidentes en intersecciones viales',
      prompt: 'Una municipalidad desea predecir qué intersecciones viales tienen mayor probabilidad de registrar accidentes de tránsito. Se dispone del historial de accidentes y se ha observado que estos tienden a concentrarse en intersecciones cercanas. Diseñe y justifique una solución utilizando las técnicas vistas en el curso, indicando el pipeline, los algoritmos seleccionados y cómo escalaría la solución para una ciudad con millones de intersecciones.',
      answer: `<p><b>Idea:</b> los accidentes tienen dependencia espacial ("se concentran en intersecciones cercanas"), así que la relación entre intersecciones es parte de la señal → modelar la ciudad como <b>grafo</b> y resolverlo como <b>clasificación/regresión de nodos</b>.</p>
<p><b>Pipeline.</b></p>
<ol>
<li><b>Grafo intrínseco vial:</b> nodo = intersección; arista = tramo de calle que las une (peso = longitud, tráfico o tiempo). Opcional: añadir aristas k-NN por distancia geográfica para capturar cercanía no conectada por calle.</li>
<li><b>Atributos X por nodo:</b> nº de accidentes históricos por ventana temporal, flujo vehicular, nº de carriles, semáforos, velocidad límite, iluminación, cercanía a colegios/mercados, clima.</li>
<li><b>Etiqueta:</b> accidente en el siguiente periodo (sí/no) o conteo; split <b>temporal</b> (entrenar con pasado, validar con futuro) para evitar fuga.</li>
<li><b>Exploración no supervisada:</b> Louvain/Leiden sobre el grafo ponderado por accidentes para detectar <b>zonas críticas</b> (comunidades con alta tasa); PageRank/centralidad para identificar intersecciones por donde pasa mucho flujo; betweenness para puntos críticos de la red.</li>
<li><b>Modelo predictivo:</b> <b>GNN (GraphSAGE o GCN)</b>: cada capa agrega la información de intersecciones vecinas (L capas = L saltos), capturando el contagio espacial que observó la municipalidad, y usa los atributos X. Es inductiva: sirve para intersecciones nuevas. Alternativa base: node2vec (q &lt; 1 para capturar zonas) + atributos → XGBoost/regresión logística.</li>
<li><b>Evaluación:</b> AUC/PR-AUC, recall@k (top-k intersecciones a intervenir), comparación con baseline tabular sin grafo.</li>
<li><b>Uso:</b> ranking de riesgo para priorizar semáforos, fiscalización, rediseño.</li>
</ol>
<p><b>Escalabilidad (millones de intersecciones).</b> El grafo vial es muy disperso (grado ≈ 3–4), se guarda como lista de adyacencia. GraphSAGE entrena con <b>mini-batches y muestreo de un número fijo de vecinos</b>, así el costo no depende del tamaño total; particionar el grafo por distritos (Spark GraphX / PyTorch Geometric distribuido). Louvain es O(n log n); PageRank con Spark (map por arista, reduce por nodo). Inferencia por lotes nocturna; solo se recalculan los nodos cuyos atributos cambian.</p>`,
      rubric: [['Representa la ciudad como grafo (nodos = intersecciones, aristas = calles/proximidad) y lo justifica por la dependencia espacial', 0.5], ['Pipeline completo: datos, atributos, etiqueta, split temporal, evaluación', 0.4], ['Algoritmos adecuados y justificados (GNN/node2vec + clasificador; comunidades o centralidad para zonas críticas)', 0.6], ['Escalabilidad: grafo disperso, muestreo de vecinos/mini-batches, particionado/Spark', 0.5]],
    },
    {
      id: 'coldstart', topic: 'rec', title: 'Plataforma de streaming nueva (cold start)',
      prompt: 'Una plataforma de streaming recién lanzada tiene pocos usuarios y miles de títulos con sinopsis, género y reparto. Diseñe un sistema de recomendación que funcione desde el primer día y mejore a medida que crece. Justifique la elección de técnicas y cómo evaluaría el sistema.',
      answer: `<p><b>Problema:</b> cold start de usuarios y matriz de utilidad casi vacía; el FC no tiene datos al inicio.</p>
<ol><li><b>Día 1 – basado en contenido:</b> perfil de ítem = TF-IDF de la sinopsis + multi-hot de género/reparto (o embeddings de texto). Perfil de usuario = promedio de los ítems que elige en el onboarding o ve completos. Predicción por coseno. No necesita otros usuarios y recomienda títulos nuevos.</li>
<li><b>Datos implícitos:</b> ver completo = interés alto, abandonar = bajo; combinar con calificaciones explícitas.</li>
<li><b>Con más datos – FC ítem-ítem</b> (más estable que usuario-usuario, se precalculan similitudes) con baseline μ + b<sub>x</sub> + b<sub>i</sub>.</li>
<li><b>A escala – factores latentes con sesgos</b> r̂ = μ + b<sub>x</sub> + b<sub>i</sub> + q<sub>i</sub>·p<sub>x</sub>, entrenados con SGD y regularización solo sobre ratings conocidos.</li>
<li><b>Híbrido/ensamble:</b> ponderar contenido y colaborativo según cuántos datos tenga cada usuario (como BellKor: global + regional + local).</li></ol>
<p><b>Evaluación:</b> ocultar 20% de ratings → RMSE/MAE; para ranking, precision@k; A/B testing en producción. <b>Escala:</b> similitudes ítem-ítem precalculadas offline; SGD distribuido; servir top-k desde caché.</p>`,
      rubric: [['Identifica el cold start y por qué el FC falla al inicio', 0.4], ['Contenido con TF-IDF/perfiles y coseno para el inicio', 0.5], ['Transición a FC ítem-ítem y/o factores latentes con sesgos', 0.6], ['Evaluación (RMSE/MAE, train/test) y escalabilidad', 0.5]],
    },
    {
      id: 'netflix', topic: 'rec', title: 'Factores latentes a escala Netflix',
      prompt: 'Una empresa tiene 500 mil usuarios, 20 mil películas y 100 millones de calificaciones (menos del 1% de la matriz). Explique por qué un modelo de factores latentes es preferible al FC clásico, cómo se entrena y qué haría para evitar el sobreajuste. ¿Cómo escalaría el entrenamiento?',
      answer: `<p><b>Por qué factores latentes:</b> el FC clásico usa una similitud heurística (Pearson/coseno), es por pares (ignora transitividad) y el promedio ponderado es restrictivo. Los factores latentes <b>aprenden</b> representaciones q<sub>i</sub>, p<sub>x</sub> ∈ ℝ<sup>k</sup> que capturan dimensiones ocultas (género, tono) y comprimen m×n en (m+n)·k parámetros (10¹⁰ → ~5·10⁷ con k = 100).</p>
<p><b>Entrenamiento:</b> no se usa SVD clásico (requiere matriz completa; imputar sesga). Se minimiza Σ<sub>(x,i)∈R</sub>(r<sub>xi</sub> − μ − b<sub>x</sub> − b<sub>i</sub> − q<sub>i</sub>·p<sub>x</sub>)² + λ(‖q‖² + ‖p‖² + b<sub>x</sub>² + b<sub>i</sub>²) solo sobre ratings conocidos, con <b>SGD</b>: e = r − r̂; q ← q + η(e·p − λq); p ← p + η(e·q − λp).</p>
<p><b>Sobreajuste:</b> regularización λ elegida por validación (grid search), elegir k por validación (RMSE de test sube con k alto), early stopping cuando el RMSE de validación deja de mejorar.</p>
<p><b>Escala:</b> SGD es barato por paso; paralelizar por bloques (particionar la matriz en bloques que no comparten filas ni columnas) o usar ALS distribuido en Spark; los vectores caben en memoria. Mejora adicional: ensambles con FC y efectos temporales.</p>`,
      rubric: [['Limitaciones del FC clásico que motivan factores latentes', 0.4], ['Modelo r̂ = q·p (+ sesgos) y por qué no SVD directo', 0.5], ['SGD con reglas de actualización', 0.4], ['Regularización / validación de k y λ', 0.4], ['Escalabilidad del entrenamiento', 0.3]],
    },
    {
      id: 'search', topic: 'pr', title: 'Buscador web con spam de enlaces',
      prompt: 'Se construye un buscador para 50 mil millones de páginas. Algunos sitios crean granjas de enlaces para inflar su importancia y existen páginas sin enlaces salientes. Diseñe el componente de ranking: cómo se calcula, qué problemas estructurales resuelve y cómo se implementa con recursos limitados.',
      answer: `<p><b>Ranking híbrido:</b> índice invertido (TF-IDF/coseno) recupera K candidatos relevantes; se reordenan con <b>PageRank</b> precalculado (autoridad estructural). PageRank: r = βMr + (1−β)/N, con M columna-estocástica (M<sub>ji</sub> = 1/d<sub>i</sub>), por power iteration hasta ‖Δr‖<sub>1</sub> &lt; ε (~50 iteraciones).</p>
<p><b>Problemas:</b> <b>dead ends</b> (páginas sin salida → fuga de masa) y <b>spider traps</b> (conjuntos cerrados que absorben todo). El <b>teletransporte</b> (β ≈ 0.85) los resuelve: A es estocástica, irreducible y aperiódica ⇒ convergencia única. Contra <b>granjas de enlaces</b>: <b>TrustRank</b> (teletransporte solo a un conjunto de páginas confiables) y medir spam mass; Topic-Specific PageRank para relevancia temática.</p>
<p><b>Implementación:</b> M densa es imposible → lista de adyacencia dispersa (~10 enlaces/página). El vector r (~400 GB) en RAM o particionado; la lista de adyacencia en disco con <b>Block-Stripe</b>: leer stripe por stripe acumulando β·r[i]/d[i] en r_nuevo y sumar (1−β)/N al final. O distribuido en <b>Spark GraphX</b>: map por arista emite (j, r[i]/d[i]), reduce por destino. Se recalcula periódicamente (offline); en consulta es un lookup O(1).</p>`,
      rubric: [['Fórmula de PageRank con teletransporte y power iteration', 0.5], ['Explica dead ends y spider traps y cómo los resuelve el teletransporte', 0.5], ['Propone TrustRank/Topic-specific contra spam', 0.4], ['Implementación escalable: dispersa + block-stripe o Spark; offline + lookup', 0.6]],
    },
    {
      id: 'fraud', topic: 'com', title: 'Fraude en una red de transferencias',
      prompt: 'Un banco quiere detectar anillos de fraude (grupos de cuentas que se transfieren dinero entre sí para lavar fondos) y cuentas "mula" que conectan esos grupos con el resto. Hay 30 millones de cuentas. Proponga una solución basada en grafos.',
      answer: `<p><b>Grafo intrínseco:</b> nodo = cuenta; arista = transferencias (peso = monto o frecuencia; dirigido si se quiere). Atributos: antigüedad, volumen, país, dispositivo.</p>
<ol><li><b>Anillos:</b> comunidades densas → <b>Louvain/Leiden</b> (O(n log n), soporta pesos, no necesita k); Leiden garantiza comunidades conectadas. Se marcan comunidades con densidad interna anómala, ciclos de dinero o alta proporción de cuentas nuevas. Para 30M nodos se puede usar LPA como primer paso rápido.</li>
<li><b>Mulas/puentes:</b> nodos y aristas de alto <b>betweenness</b> entre comunidades (Brandes con muestreo de raíces, porque el exacto es O(mn)).</li>
<li><b>Modelo supervisado:</b> con casos de fraude etiquetados, <b>GNN (GraphSAGE/GAT)</b> para clasificación de nodos: agrega señales de los vecinos (si tus contrapartes son fraudulentas, aumenta tu riesgo) y es inductiva para cuentas nuevas. Alternativa: node2vec + clasificador.</li>
<li><b>Evaluación:</b> PR-AUC (clases desbalanceadas), precisión en el top-k revisado por analistas; split temporal.</li></ol>
<p><b>Escala:</b> grafo disperso en Spark GraphX; Louvain distribuido; GraphSAGE con mini-batches y muestreo de vecinos; actualización incremental diaria.</p>`,
      rubric: [['Modela cuentas y transferencias como grafo con pesos/atributos', 0.4], ['Comunidades (Louvain/Leiden/LPA) para anillos, justificado', 0.5], ['Betweenness para mulas/puentes', 0.4], ['GNN o embeddings para clasificación supervisada', 0.4], ['Escalabilidad y evaluación', 0.3]],
    },
    {
      id: 'social', topic: 'com', title: 'Comunidades en una red social de mil millones',
      prompt: 'Una red social con 1 000 millones de usuarios quiere segmentar a sus usuarios en comunidades para publicidad. El equipo propone Girvan-Newman porque "es el más conocido". Evalúe la propuesta y proponga una alternativa justificada. ¿Cómo sabría si las comunidades son buenas?',
      answer: `<p><b>Evaluación:</b> Girvan-Newman recalcula el edge betweenness tras cada eliminación: O(m²n). Con n = 10⁹ es inviable (también espectral O(n³) y la optimización exacta de Q, NP-dura).</p>
<p><b>Alternativa:</b> <b>Louvain</b> (o <b>Leiden</b>): fase 1 mueve nodos a la comunidad vecina con mayor ΔQ = k<sub>i,in</sub>/m − k<sub>i</sub>Σ<sub>tot</sub>/(2m²), calculable en O(1); fase 2 agrega comunidades en supernodos (auto-lazos y pesos acumulados) y repite. O(n log n), no necesita k, da jerarquía (segmentos y sub-segmentos), soporta pesos (intensidad de interacción). Leiden evita comunidades desconectadas. LPA (O(m) por iteración) como alternativa muy rápida pero inestable. Si un usuario pertenece a varios grupos (familia, trabajo): BigCLAM (superpuestas).</p>
<p><b>Calidad:</b> modularidad Q (&gt; 0.3 razonable), estabilidad entre semillas, coherencia de intereses dentro de cada comunidad, y métricas de negocio (CTR por segmento, A/B test). <b>Escala:</b> implementación distribuida (Spark/GraphX), particionado del grafo.</p>`,
      rubric: [['Explica por qué GN no escala (O(m²n), recálculo)', 0.5], ['Propone Louvain/Leiden/LPA y describe su funcionamiento', 0.7], ['Menciona comunidades superpuestas o jerarquía cuando aplica', 0.3], ['Evaluación con Q y/o métricas externas; distribución', 0.5]],
    },
    {
      id: 'copurchase', topic: 'rep', title: 'Recomendación con grafo de co-compras',
      prompt: 'Un e-commerce tiene un grafo donde los productos se conectan si se compran juntos. Quieren recomendar productos similares y también clasificar automáticamente productos nuevos que llegan cada día sin historial. Compare node2vec y una GNN para este problema.',
      answer: `<p><b>node2vec:</b> caminatas sesgadas sobre el grafo de co-compras (q &lt; 1 tipo DFS para capturar comunidades de productos; q &gt; 1 tipo BFS para roles), skip-gram con muestreo negativo → embedding por producto. Productos con embeddings cercanos (coseno) = "se compran en contextos parecidos" → recomendación de similares. <b>Limitación:</b> es <b>transductivo</b> (un producto nuevo sin aristas no tiene embedding hasta reentrenar), tiene O(|V|) parámetros e <b>ignora atributos</b> (título, imagen, precio).</p>
<p><b>GNN (GraphSAGE):</b> h<sup>0</sup> = atributos del producto (embedding de imagen y texto); cada capa agrega mensajes de los vecinos con W y B compartidos. <b>Inductiva:</b> un producto nuevo obtiene embedding con sus atributos (y sus primeras aristas) sin reentrenar. Se entrena con link prediction (pares co-comprados vs negativos, BCE, retirando las aristas a predecir) o clasificación de nodos con las categorías conocidas.</p>
<p><b>Recomendación:</b> GNN para el catálogo dinámico; node2vec como baseline rápido para el catálogo estable. Escala: muestreo de vecinos y mini-batches (como PinSage en Pinterest).</p>`,
      rubric: [['Explica node2vec (caminatas p,q + skip-gram) aplicado al caso', 0.5], ['Limitaciones de node2vec: transductivo, ignora atributos, O(|V|)', 0.5], ['GNN: mensaje+agregación con atributos, inductiva', 0.5], ['Entrenamiento y recomendación final justificada', 0.5]],
    },
    {
      id: 'molecule', topic: 'gnn', title: 'Toxicidad de moléculas',
      prompt: 'Un laboratorio tiene 50 000 moléculas con etiqueta tóxica / no tóxica y quiere predecir la toxicidad de moléculas nuevas. ¿Por qué un modelo tabular o una CNN no es adecuado y cómo diseñaría la solución?',
      answer: `<p>Cada molécula es un <b>grafo</b> (átomos = nodos con atributos: tipo, carga; enlaces = aristas con tipo). Tiene tamaño variable, sin orden canónico de átomos, y la estructura (anillos, grupos funcionales) determina la toxicidad. Una tabla de descriptores pierde la topología; una CNN asume un grid fijo y depende del orden.</p>
<p><b>Solución:</b> GNN para <b>clasificación de grafos</b>: h<sup>0</sup> = atributos del átomo; L capas de mensaje + agregación (suma/media, simétrica) con el propio nodo (B·h<sub>v</sub>); <b>readout</b> simétrico (suma o promedio de todos los h<sub>v</sub><sup>L</sup>) → vector de la molécula → MLP + sigmoide. Pérdida: entropía cruzada binaria; Adam; validación por scaffold split. GAT si ciertos enlaces importan más. Es inductiva: aplica a moléculas nunca vistas.</p>`,
      rubric: [['Representa la molécula como grafo y explica por qué tabla/CNN fallan', 0.6], ['Capa GNN (mensaje + agregación simétrica + propio nodo)', 0.6], ['Readout para clasificación de grafo', 0.5], ['Entrenamiento y evaluación', 0.3]],
    },
    {
      id: 'citation', topic: 'gnn', title: 'Clasificar artículos científicos',
      prompt: 'Una biblioteca digital tiene 2 millones de artículos con su texto y sus citas, pero solo el 5% tiene área temática asignada. Proponga cómo asignar el área al resto.',
      answer: `<p>Grafo intrínseco de citas (nodo = artículo, arista = cita) con atributos = embedding del texto (TF-IDF o Sentence-BERT). Es <b>clasificación de nodos semi-supervisada</b>: los artículos citan a otros de su área (homofilia).</p>
<ol><li><b>Baseline rápido:</b> Label Propagation desde los etiquetados, o Louvain para descubrir áreas y asignar la etiqueta mayoritaria de cada comunidad.</li>
<li><b>Modelo principal:</b> GCN/GraphSAGE: h<sup>0</sup> = texto; 2–3 capas agregan información de citas; ŷ = softmax(W<sub>out</sub>h<sup>L</sup>). La pérdida usa solo el 5% etiquetado, pero todos los nodos propagan información. Inductivo para artículos nuevos.</li>
<li><b>Evaluación:</b> accuracy/macro-F1 en un subconjunto etiquetado reservado.</li></ol>
<p><b>Escala:</b> GraphSAGE con muestreo de vecinos y mini-batches; grafo disperso.</p>`,
      rubric: [['Grafo de citas con atributos de texto; tarea semi-supervisada', 0.5], ['Baseline (propagación/comunidades)', 0.4], ['GNN con pérdida solo en etiquetados', 0.7], ['Evaluación y escala', 0.4]],
    },
    {
      id: 'rag', topic: 'rep', title: 'Organizar una colección de documentos (RAG)',
      prompt: 'Una empresa tiene 1 millón de documentos internos y quiere (a) descubrir los temas principales y (b) recuperar los fragmentos más relevantes para un asistente de preguntas. Diseñe una solución con grafos.',
      answer: `<p><b>Construcción:</b> dividir documentos en chunks (párrafos); embeber cada chunk (Sentence-BERT) → <b>grafo k-NN</b> con peso = coseno (búsqueda aproximada para escalar). Alternativa/complemento: grafo intrínseco de co-ocurrencia de keywords TF-IDF (TextRank).</p>
<p><b>(a) Temas:</b> Louvain/Leiden sobre el grafo k-NN: cada comunidad densa = un tema; aristas puente = chunks que mezclan temas. Etiquetar cada tema con sus keywords TF-IDF más altas. Evaluar con Q y revisión manual.</p>
<p><b>(b) Recuperación:</b> buscar los vecinos más cercanos de la consulta; reordenar con <b>PageRank personalizado</b> (teletransporte a los chunks recuperados) o centralidad dentro de la comunidad para priorizar fragmentos representativos; expandir con vecinos del grafo para dar contexto.</p>
<p><b>Escala:</b> índices ANN, construcción del grafo por lotes, Louvain O(n log n), recálculo incremental.</p>`,
      rubric: [['Chunks + embeddings + grafo k-NN (o co-ocurrencia)', 0.6], ['Comunidades para temas', 0.5], ['Recuperación con vecinos y PageRank/centralidad', 0.5], ['Escalabilidad', 0.4]],
    },
    {
      id: 'influencer', topic: 'pr', title: 'Influencers en una red de seguidores',
      prompt: 'Una marca quiere identificar a los 100 usuarios más influyentes sobre "deporte" en una red tipo Twitter (grafo dirigido de seguidores, 800 millones de nodos). ¿Qué técnica usaría y por qué no basta con contar seguidores?',
      answer: `<p>Contar seguidores (in-degree) ignora <b>quién</b> te sigue: cuentas falsas inflan el número. <b>PageRank</b> sobre el grafo dirigido (arista seguidor → seguido) pondera cada "voto" por la importancia del que vota y lo reparte entre sus out-links.</p>
<p>Para el tema: <b>Topic-Specific PageRank</b>: el teletransporte salta solo a un conjunto S de cuentas de deporte (clasificadas por contenido/TF-IDF de sus publicaciones), así se mide influencia dentro del tema. Contra bots: TrustRank (teletransporte a cuentas verificadas). Complementos: HITS (hubs/autoridades), betweenness para usuarios puente entre comunidades.</p>
<p><b>Escala:</b> grafo disperso; power iteration distribuida en Spark GraphX (map por arista, reduce por nodo) o block-stripe; ~50 iteraciones; β ≈ 0.85.</p>`,
      rubric: [['Por qué in-degree no basta y PageRank sí', 0.6], ['Topic-Specific PageRank para el tema', 0.6], ['Manejo de bots/spam (TrustRank) o métricas complementarias', 0.4], ['Implementación escalable', 0.4]],
    },
    {
      id: 'compare', topic: 'com', title: 'Elegir algoritmo de comunidades',
      prompt: 'Para cada escenario elija un algoritmo de detección de comunidades y justifique: (i) red de 200 investigadores donde se quiere ver la jerarquía de grupos; (ii) red de proteínas de 20 000 nodos donde se sabe que hay 12 complejos; (iii) grafo de 500 millones de usuarios donde se necesita un resultado en minutos.',
      answer: `<p><b>(i) Girvan-Newman:</b> el grafo es pequeño (O(m²n) es aceptable), produce un <b>dendrograma jerárquico</b> y se elige el corte con máxima modularidad Q.</p>
<p><b>(ii) Clustering espectral</b> con k = 12: L = D − A, los 12 primeros autovectores forman U (n × 12) y K-means sobre sus filas; el eigengap puede confirmar k. 20 000 nodos es manejable con solvers dispersos. (Louvain también es válido si no se quiere fijar k.)</p>
<p><b>(iii) Label Propagation</b> (O(m) por iteración, 3–10 iteraciones, paralelizable) o <b>Louvain</b> distribuido (O(n log n), mejor Q). LPA es más rápido pero no determinista; se puede correr varias veces y quedarse con la de mayor Q.</p>`,
      rubric: [['(i) GN + dendrograma + Q', 0.6], ['(ii) Espectral con k conocido (U + K-means / eigengap)', 0.7], ['(iii) LPA o Louvain por escala, con trade-offs', 0.7]],
    },
    {
      id: 'prmemory', topic: 'pr', title: 'PageRank que no cabe en memoria',
      prompt: 'Un equipo intenta calcular PageRank para 10 mil millones de páginas cargando la matriz M en un servidor con 256 GB de RAM y falla. Explique por qué y proponga cómo calcularlo, estimando memoria y costo de I/O.',
      answer: `<p>M densa tendría N² = 10²⁰ entradas: imposible. Además M es extremadamente dispersa (~10 enlaces por página).</p>
<ol><li><b>Representación dispersa:</b> lista de adyacencia (origen, grado, destinos): ~10¹¹ enlaces · 4–8 bytes ≈ 0.4–0.8 TB, en disco.</li>
<li><b>Vectores:</b> r con N = 10¹⁰ valores de 8 bytes = 80 GB; r y r_nuevo = 160 GB: caben en 256 GB.</li>
<li><b>Block-Stripe:</b> la lista de adyacencia se divide en k stripes; por cada stripe se acumula r_nuevo[j] += β·r[i]/d[i]; al terminar todos, r_nuevo += (1−β)/N; intercambiar. El acumulador no se reinicia entre stripes. I/O ≈ una lectura completa del grafo por iteración (k lecturas de stripe) → T iteraciones ≈ T·k lecturas (T = 20–50).</li>
<li>Si los vectores no cabieran: particionarlos (block-stripe en bloques de r) o Spark GraphX distribuido (map por arista, shuffle, reduce por destino).</li></ol>`,
      rubric: [['Explica por qué M densa no cabe (N²) y que es dispersa', 0.5], ['Estima memoria de r (8 bytes × N) y de la lista de adyacencia', 0.5], ['Describe block-stripe correctamente (acumulador, término constante al final)', 0.6], ['Costo de I/O y alternativa distribuida', 0.4]],
    },
  ];

  /* -------------------- EXAMEN 2026-1 -------------------- */
  const examGraph = { nodes: [{ id: 'A', x: 8, y: 12 }, { id: 'C', x: 38, y: 12 }, { id: 'E', x: 72, y: 12 }, { id: 'B', x: 8, y: 52 }, { id: 'D', x: 38, y: 52 }, { id: 'F', x: 72, y: 52 }, { id: 'G', x: 96, y: 32 }], edges: 'AB AC BC BD CD CE CF EF EG FG'.split(' ').map(p => ({ u: p[0], v: p[1] })), directed: false };
  const LP = { 0: [47, 30, 0], 1: [37, 18, 0], 2: [12, 26, 0], 3: [68, 22, 1], 4: [19, 42, 0], 5: [40, 42, 0], 6: [86, 46, 1], 7: [76, 33, 1], 8: [30, 60, 2], 9: [10, 67, 2], 10: [46, 64, 2], 11: [64, 51, 3], 12: [18, 84, 2], 13: [63, 63, 3], 14: [44, 86, 2], 15: [10, 52, 2] };
  const louvainGraph = { nodes: Object.entries(LP).map(([id, [x, y, c]]) => ({ id, x, y, comm: c })), edges: '0-2 0-3 0-4 0-5 1-2 1-4 1-7 2-4 2-5 2-6 3-7 4-10 5-7 5-11 6-7 6-11 8-9 8-10 8-11 8-14 8-15 9-12 9-14 10-12 10-13 10-14 11-13'.split(' ').map(s => { const [u, v] = s.split('-'); return { u, v }; }), directed: false };

  const exam2026 = {
    title: 'Examen Final 2026-1 · Parte práctica',
    minutes: 120,
    questions: [
      { kind: 'case', ref: 'bfr', pts: 2, extra: 'bfrfig' },
      { kind: 'case', ref: 'knn', pts: 2 },
      { kind: 'case', ref: 'traffic', pts: 2 },
      {
        kind: 'prac', pts: 2, title: 'FC basado en ítems (coseno)',
        statement: () => `<p>La siguiente tabla muestra las calificaciones (de 1 a 5) que tres usuarios han otorgado a diferentes películas.</p>${ENG.table(['Película', 'Alice', 'Bob', 'Carol'], [['Avatar', 5, 3, 4], ['Titanic', 4, 5, '–'], ['Matrix', 2, '–', 2], ['Piratas', 1, 2, '<b>¿?</b>']])}<p>Se desea predecir la calificación que Carol asignaría a la película Piratas utilizando Filtrado Colaborativo Basado en Ítems. Realice la predicción paso a paso. Por simplicidad utilice la similitud del coseno.</p><p class="muted"><i>Nota: Ignore problemas como normalización, sesgos (bias) y selección de vecinos (Top-K). Utilice todas las películas calificadas por Carol.</i></p>`,
        fields: [{ id: 'sa', label: 'sim(Piratas, Avatar)', answer: 0.6957 }, { id: 'sm', label: 'sim(Piratas, Matrix)', answer: 0.3162 }, { id: 'p', label: 'r̂(Carol, Piratas)', answer: 3.375, tol: 0.03 }],
        solution: () => ENG.step(1, 'Vecinos', '<p>Carol calificó <b>Avatar (4)</b> y <b>Matrix (2)</b>: esos son los ítems vecinos de Piratas.</p>')
          + ENG.step(2, 'Vectores de ítem (usuarios Alice, Bob, Carol; vacío = 0)', '<p class="mono">Piratas = [1, 2, 0] · Avatar = [5, 3, 4] · Matrix = [2, 0, 2]</p>')
          + ENG.step(3, 'Coseno', ENG.fx('cos(P, A) = (1·5 + 2·3 + 0·4) / (√5 · √50) = 11 / 15.811 = <b>0.6957</b>') + ENG.fx('cos(P, M) = (1·2 + 2·0 + 0·2) / (√5 · √8) = 2 / 6.325 = <b>0.3162</b>'))
          + ENG.step(4, 'Predicción', ENG.fx('r̂ = (0.6957·4 + 0.3162·2) / (0.6957 + 0.3162) = 3.4154 / 1.0119 = <b>3.375 ≈ 3.38</b>') + '<p class="muted small">Variante: si se calcula el coseno solo sobre usuarios que calificaron ambos ítems, sim(P,A) = 11/(√5·√34) = 0.8437, sim(P,M) = 1 y r̂ = 2.92. Escribe en el examen qué convención usas; la estándar del curso (vacío = 0) da 3.38.</p>'),
      },
      {
        kind: 'prac', pts: 3, title: 'Edge betweenness (Brandes desde A y G)',
        statement: () => `<p>Considere el siguiente grafo. Aplique el algoritmo de Propagación de Crédito (Brandes con BFS) para calcular el <i>edge betweenness</i> de las aristas. Por simplicidad, ejecute el algoritmo únicamente desde los vértices fuente A y G. Muestre el árbol BFS, la propagación de crédito, el aporte de cada fuente y el <i>edge betweenness</i> acumulado de cada arista. Finalmente, indique cuáles serían las aristas puente de la red.</p>${ENG.drawGraph(examGraph, { h: 230 })}`,
        build: () => {
          const a = ENG.brandes(examGraph, 'A'), g = ENG.brandes(examGraph, 'G');
          const keys = examGraph.edges.map(e => ENG.edgeKey(e.u, e.v)).sort();
          const fields = [], rows = [];
          keys.forEach(k => { fields.push({ id: 'a' + k, label: k + ' desde A', answer: a.eb[k], tol: 0.01 }, { id: 'g' + k, label: k + ' desde G', answer: g.eb[k], tol: 0.01 }, { id: 't' + k, label: k + ' suma', answer: a.eb[k] + g.eb[k], tol: 0.01 }); rows.push({ label: k, ids: ['a' + k, 'g' + k, 't' + k] }); });
          fields.push({ id: 'br', label: 'Aristas puente', type: 'text', mode: 'edges', answer: 'C-E, C-F' });
          return { fields, table: { cols: ['Arista', 'desde A', 'desde G', 'Acumulado'], rows } };
        },
        solution: () => {
          const a = ENG.brandes(examGraph, 'A'), g = ENG.brandes(examGraph, 'G');
          const keys = examGraph.edges.map(e => ENG.edgeKey(e.u, e.v)).sort();
          return ENG.step(1, 'BFS desde A', '<p>Nivel 0: A (σ=1) · Nivel 1: B, C (σ=1) · Nivel 2: D (σ=2, padres B y C), E (σ=1), F (σ=1) · Nivel 3: G (σ=2, padres E y F)</p>')
            + ENG.step(2, 'Crédito desde A', '<p class="mono small">G=1 → E–G = 1·1/2 = 0.5, F–G = 0.5<br>E = 1+0.5 = 1.5 → C–E = 1.5 · F = 1.5 → C–F = 1.5<br>D = 1 → B–D = 1·1/2 = 0.5, C–D = 0.5<br>C = 1 + 1.5 + 1.5 + 0.5 = 4.5 → A–C = 4.5 · B = 1 + 0.5 = 1.5 → A–B = 1.5<br>B–C y E–F unen nodos del mismo nivel → 0</p>')
            + ENG.step(3, 'BFS desde G', '<p>Nivel 0: G · Nivel 1: E, F (σ=1) · Nivel 2: C (σ=2, padres E y F) · Nivel 3: A, B, D (σ=2 cada uno, padre C)</p>')
            + ENG.step(4, 'Crédito desde G', '<p class="mono small">A, B, D = 1 → A–C = 1, B–C = 1, C–D = 1<br>C = 1 + 3 = 4 → C–E = 4·1/2 = 2, C–F = 2<br>E = 1 + 2 = 3 → E–G = 3 · F = 3 → F–G = 3<br>A–B, B–D (mismo nivel) y E–F (mismo nivel) → 0</p>')
            + ENG.step(5, 'Acumulado', ENG.table(['Arista', 'desde A', 'desde G', 'Acumulado'], keys.map(k => [k, ENG.fmt(a.eb[k]), ENG.fmt(g.eb[k]), '<b>' + ENG.fmt(a.eb[k] + g.eb[k]) + '</b>'])))
            + ENG.step(6, 'Aristas puente', '<p><b>C–E y C–F</b>: unen el bloque {A, B, C, D} con el triángulo {E, F, G}. Con todas las fuentes, su betweenness completo es 6 (el máximo del grafo); A–C sale alta aquí solo porque A es una de las fuentes. Ojo: E–G y F–G también suman 3.5 con estas dos fuentes, pero con todas las fuentes valen 3.</p>');
        },
      },
      {
        kind: 'prac', pts: 3, title: 'Louvain: fase de agregación',
        statement: () => `<p>Asumir que la fase de movimiento local del Algoritmo Louvain ya ha finalizado y la asignación de cada nodo a su comunidad es la mostrada en la figura siguiente. Aplique la fase de agregación para generar el grafo del siguiente nivel jerárquico. Continúe el procedimiento hasta obtener el grafo del segundo nivel, mostrando los supernodos creados y los pesos de las aristas resultantes.</p>${ENG.drawGraph(louvainGraph, { h: 330, w: 460, r: 12 })}<p class="muted small">Colores: <b>azul</b> {0,1,2,4,5} · <b>naranja</b> {3,6,7} · <b>verde</b> {8,9,10,12,14,15} · <b>rosa</b> {11,13}. Para el nivel 2, en la fase local se unen azul+naranja y verde+rosa.</p>`,
        fields: [{ id: 'lp', label: 'auto-lazo azul', answer: 14, tol: 0 }, { id: 'lo', label: 'auto-lazo naranja', answer: 4, tol: 0 }, { id: 'lg', label: 'auto-lazo verde', answer: 16, tol: 0 }, { id: 'lb', label: 'auto-lazo rosa', answer: 2, tol: 0 }, { id: 'po', label: 'peso azul–naranja', answer: 4, tol: 0 }, { id: 'pg', label: 'peso azul–verde', answer: 1, tol: 0 }, { id: 'pb', label: 'peso azul–rosa', answer: 1, tol: 0 }, { id: 'og', label: 'peso naranja–verde', answer: 0, tol: 0 }, { id: 'ob', label: 'peso naranja–rosa', answer: 1, tol: 0 }, { id: 'gb', label: 'peso verde–rosa', answer: 3, tol: 0 }, { id: 'l2a', label: 'nivel 2: auto-lazo (azul+naranja)', answer: 26, tol: 0 }, { id: 'l2b', label: 'nivel 2: auto-lazo (verde+rosa)', answer: 24, tol: 0 }, { id: 'l2w', label: 'nivel 2: peso entre ambos', answer: 3, tol: 0 }],
        solution: () => ENG.step(1, 'Aristas internas → auto-lazos (×2)', ENG.table(['Comunidad', 'Aristas internas', 'Auto-lazo'], [['Azul {0,1,2,4,5}', '0-2, 0-4, 0-5, 1-2, 1-4, 2-4, 2-5 (7)', '<b>14</b>'], ['Naranja {3,6,7}', '3-7, 6-7 (2)', '<b>4</b>'], ['Verde {8,9,10,12,14,15}', '8-9, 8-10, 8-14, 8-15, 9-12, 9-14, 10-12, 10-14 (8)', '<b>16</b>'], ['Rosa {11,13}', '11-13 (1)', '<b>2</b>']]))
          + ENG.step(2, 'Aristas entre comunidades → pesos', ENG.table(['Par', 'Aristas', 'Peso'], [['Azul–Naranja', '0-3, 1-7, 2-6, 5-7', '<b>4</b>'], ['Azul–Verde', '4-10', '<b>1</b>'], ['Azul–Rosa', '5-11', '<b>1</b>'], ['Naranja–Rosa', '6-11', '<b>1</b>'], ['Verde–Rosa', '8-11, 10-11, 10-13', '<b>3</b>'], ['Naranja–Verde', '—', '0']]) + ENG.drawGraph({ nodes: [{ id: 'Az', x: 20, y: 20, comm: 0 }, { id: 'Na', x: 80, y: 20, comm: 1 }, { id: 'Ve', x: 20, y: 80, comm: 2 }, { id: 'Ro', x: 80, y: 80, comm: 3 }], edges: [{ u: 'Az', v: 'Na', label: 4 }, { u: 'Az', v: 'Ve', label: 1 }, { u: 'Az', v: 'Ro', label: 1 }, { u: 'Na', v: 'Ro', label: 1 }, { u: 'Ve', v: 'Ro', label: 3 }], loops: { Az: 14, Na: 4, Ve: 16, Ro: 2 } }, { h: 260, w: 380, r: 16 }))
          + ENG.step(3, 'Segundo nivel', ENG.fx('Auto-lazo(Az+Na) = 14 + 4 + 2·4 = <b>26</b> · Auto-lazo(Ve+Ro) = 16 + 2 + 2·3 = <b>24</b> · Peso = 1 (Az–Ve) + 1 (Az–Ro) + 1 (Na–Ro) + 0 = <b>3</b>') + '<p class="muted small">Comprobación: 2m = 56 = 14+4+16+2+2·(4+1+1+1+3) = 26+24+2·3. Coincide con la figura de Blondel et al. / Barabási.</p>'),
      },
    ],
  };

  return { topics, theory, recipes, quizzes, cases, exam2026, examGraph, louvainGraph };
})();
