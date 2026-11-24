# Final de Data Mining

Web de estudio para el examen final de Data Mining (semanas 9–15: recomendación, PageRank, detección de comunidades, node2vec, GNN, y BFR).

## Secciones
1. **Teoría** de cada tema con autoevaluación.
2. **Cómo resolver**: receta, trampas frecuentes y ejemplo resuelto por tipo de ejercicio.
3. **Práctica** con autograder: 31 tipos de ejercicio con datos aleatorios y solución paso a paso.
4. **Simulacro**: examen 2026-1 con respuestas ocultas, o examen generado, con temporizador.
5. **Videos**: dos por tema (teoría y práctico paso a paso), con voz, subtítulos y capítulos. Están en Inicio, Teoría y Cómo resolver.

## Uso
Sitio estático, sin dependencias ni build. Abre `index.html` o publícalo con GitHub Pages (rama `main`, carpeta raíz).
Funciona en navegador de escritorio, iPad y iPhone, y se puede instalar en la pantalla de inicio (PWA, funciona sin conexión).

## Archivos
- `index.html` — estructura y estilos
- `engine.js` — generadores de ejercicios, autograder, dibujo de grafos
- `data.js` — teoría, recetas, quizzes, casos de estudio, examen 2026-1
- `app.js` — navegación y vistas
- `apuntes.pdf` — hoja de apuntes A4 de 2 caras (fuente: `../video_src/apuntes.html`, generar con `apuntes_pdf.py`)
- `videos.js`, `videos/` — 14 videos MP4 con subtítulos (.vtt) y portadas (.jpg); generados con `../video_src/build.py`
- `sw.js`, `manifest.webmanifest`, `icons/` — instalación y modo sin conexión
