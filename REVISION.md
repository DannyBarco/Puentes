# Revisión del programa

Validación en el entorno de desarrollo, con servidor HTTP Python y Chromium real (Playwright, modo headless).

- 11 pruebas numéricas aprobadas, sin omitidas ni fallidas: fórmulas, superposición, cargas fuera de luz, extremos conocidos, apoyos, saltos con decimales, cargas ascendentes/coincidentes, refinamiento de Δx, control de tamaño y rango numérico.
- Comparación independiente por equilibrio de reacciones y brazos de palanca para cada posición y sección de dos trenes de cargas, uno con signos mixtos.
- Navegador: edición de P, x y separación; añadir/eliminar cargas; cambiar L/Δx/ΔL; corregir entradas vacías/negativas; cambiar sección; comprobar tabla y cuatro gráficas; estado final descargado.
- CSV descargado desde Chromium: cabecera, número de filas y todos los valores contrastados con los resultados sin redondear. La tabla visual usa tres decimales.
- Revisión de capturas de escritorio (1440 px) y móvil (390 px). Comprobación de ausencia de desbordamiento de página a 390 y 320 px. Las tablas amplias conservan desplazamiento horizontal interno.

Se corrigieron la propagación de separaciones inválidas, gráficas obsoletas al elegir una sección inválida, el desbordamiento móvil y la detección de coincidencias decimales. Se añadieron gráficas de envolventes y un estado descargado al final del control de avance, conservando las funciones existentes.

Los extremos son muestreados. Ejemplo: P = 10 kN, L = 10 m, a = 5 m. Con Δx = 3 m: V mín = −3 kN, V máx = 4 kN, M máx = 20 kN·m. Con Δx = 0.5 m: V mín = −5 kN, V máx = 5 kN, M máx = 25 kN·m. Los extremos continuos pueden quedar entre muestras.

Para repetir: `node --test tests/beam.test.mjs` y la prueba de navegador descrita en USO.md.

## Ampliación: entrada CSV

Se añadieron 5 pruebas de lectura CSV (16 pruebas unitarias en total). Incluyen posiciones acumuladas, equivalencia de envolventes con entrada manual, CSV de Excel, validación de números/cabeceras/separaciones y límites de tamaño. La prueba de Chromium verifica importar, recalcular, editar las cargas importadas, rechazar un archivo incorrecto conservando datos y descargar la plantilla.
