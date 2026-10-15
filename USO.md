# Calculadora de cargas móviles

Aplicación web sin dependencias de ejecución. Requiere un navegador moderno; para servirla localmente, Python 3. Node.js 18 o posterior permite ejecutar las pruebas.

Desde `/workspace/Puentes`:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

Pruebas numéricas:

```sh
node --test tests/beam.test.mjs
```

Introduce L, Δx y ΔL en metros y P en kN. La primera carga comienza en x = 0; las demás tienen x inicial negativo. Selecciona posiciones o separaciones positivas entre cargas consecutivas. Todo el tren se desplaza hacia la derecha hasta que la última carga alcanza L; se incluye después el estado descargado. Las cargas fuera de [0,L] no contribuyen.

Pulsa **Calcular respuestas** después de editar datos. El control de avance muestra las cargas que están sobre la viga. El campo a selecciona una sección para graficar su respuesta durante el recorrido. La tabla contiene los extremos muestreados para todas las secciones; se puede descargar como CSV.

Las gráficas representan la respuesta total del tren. Para una línea de influencia unitaria usa una sola carga P = 1. Con varias cargas, las gráficas son la superposición de sus contribuciones desplazadas.

El cortante es discontinuo en una carga. Se muestran ambos valores laterales, incluido el caso x = a. El momento es continuo. Los extremos de las envolventes son discretos: reduce Δx y ΔL y compara resultados para comprobar convergencia. No se calculan automáticamente los extremos exactos entre pasos. Se limita el tamaño del cálculo para mantener la interfaz utilizable.

## Abrir en tu computadora

Descarga todos los archivos del programa conservando sus nombres y carpetas (o extrae el paquete ZIP proporcionado). En GitHub puedes descargar `Puentes-programa.zip` desde la raíz del repositorio o usar Code → Download ZIP.

1. Instala Python 3 si no lo tienes.
2. Abre una terminal dentro de la carpeta que contiene `index.html`.
3. En Windows ejecuta `py -m http.server 8000 --bind 127.0.0.1`. En macOS/Linux ejecuta `python3 -m http.server 8000 --bind 127.0.0.1`.
4. Escribe `http://localhost:8000` en el navegador de esa computadora. Mantén la terminal abierta; Ctrl+C detiene el servidor.

No abras `index.html` directamente con doble clic: los módulos JavaScript necesitan un servidor HTTP. No hace falta instalar Node para usar la calculadora. Los datos editados viven en memoria y se restablecen al recargar; descarga el CSV para conservar resultados. En Excel puedes importar el CSV con separador coma y punto decimal.

### Ejemplo

L = 10, Δx = 0.1, ΔL = 0.5. Introduce P = 10, 15 y 10 kN con separaciones 0, 2 y 2 m (x = 0, −2, −4 m). Pulsa **Calcular respuestas**. Cambia a para inspeccionar otra sección; mueve el control de avance para visualizar el tren. Las gráficas superiores muestran respuestas frente al avance, no diagramas espaciales instantáneos. Las gráficas de envolventes muestran máximos y mínimos frente a la sección a. Cambiar a no modifica las envolventes.

### Precisión de máximos y mínimos

Los valores son correctos para las posiciones muestreadas y los dos lados del salto de cortante. No son extremos continuos exactos: por ejemplo, con una sola carga de 10 kN, L = 10 m, a = 5 m, Δx = 3 m produce M máx = 20 kN·m; con Δx = 0.5 m se obtiene el valor exacto de 25 kN·m. Reduce Δx por mitades y compara. Reduce ΔL para explorar más secciones de la viga. Se corrigen diferencias de redondeo de coma flotante en coincidencias carga/sección y en apoyos.

## Publicar en internet

La aplicación es estática: no necesita servidor de cálculo, base de datos, claves ni compilación. Publica `index.html`, `style.css`, `app.mjs` y `beam.mjs` juntos en la raíz del sitio. Puedes incluir también la documentación y las pruebas.

- **GitHub Pages:** guarda y sube los archivos a `DannyBarco/Puentes`. En Settings → Pages selecciona Deploy from a branch, la rama `main` y la carpeta `/ (root)`. Guarda y espera al despliegue. GitHub mostrará la dirección publicada (normalmente `https://dannybarco.github.io/Puentes/`). La disponibilidad depende del plan y visibilidad del repositorio. Subir los archivos al repositorio no activa GitHub Pages; debes habilitarlo en Settings → Pages.
- **Netlify:** en la opción de despliegue manual, arrastra una carpeta que tenga los cuatro archivos en su raíz. No hay comando de build. Netlify asigna una dirección HTTPS.
- **Cloudflare Pages o Vercel:** crea un proyecto estático desde el repositorio; no se necesitan instalación ni build, y la salida es la carpeta raíz. También puedes usar cualquier alojamiento que sirva módulos `.mjs` con tipo MIME JavaScript.

Publicar el entorno de Codex conserva su configuración y archivos; es una acción distinta de publicar este sitio web en internet.

## Prueba real de navegador (opcional para desarrollo)

`tests/browser.mjs` ejecuta Chromium con Playwright y verifica edición, recuperación de entradas inválidas, recálculo, gráficas, tabla, CSV y anchuras de escritorio/móvil. El servidor local debe estar iniciado. Instala la herramienta fuera del checkout; no es una dependencia de la aplicación:

```sh
npm install --prefix /tmp/puentes-browser --cache /tmp/puentes-npm-cache playwright --no-audit --no-fund
PLAYWRIGHT_MODULE=/tmp/puentes-browser/node_modules/playwright/index.mjs BROWSER_EXECUTABLE=/usr/bin/chromium node tests/browser.mjs
```

Ajusta `BROWSER_EXECUTABLE` al ejecutable de Chromium/Chrome instalado. Puedes definir `TEST_URL` para otro servidor y `TEST_ARTIFACTS` para guardar capturas y CSV en otra carpeta. Las rutas del ejemplo corresponden al entorno Linux de desarrollo.
