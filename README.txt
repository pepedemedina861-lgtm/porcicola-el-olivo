PORCÍCOLA EL OLIVO — VERSIÓN INICIAL LOCAL

Qué incluye
- Inventario individual con ID/arete único, categoría, lote, sexo, fecha de nacimiento, peso, estado y notas.
- Registros reproductivos: montaje, inseminación, gestación, parto y destete.
- Salud y alimentación: vacunas, tratamientos, síntomas, pesajes, consumo y próxima fecha de control.
- Finanzas: ingresos, gastos y balance.
- Recordatorios con fecha, prioridad y estado.
- Búsqueda, edición, eliminación, exportación JSON y CSV.
- Base local IndexedDB, adecuada para miles de registros.
- PWA con service worker para cargar los archivos de la app sin conexión después de la primera visita.

IMPORTANTE SOBRE DATOS
Los datos se guardan únicamente en el navegador/dispositivo. No se conectan a Supabase en esta versión. Si borras los datos del sitio, cambias de dispositivo o el navegador elimina el almacenamiento, podrías perder registros. Descarga copias JSON periódicamente y guárdalas en otro lugar seguro. La exportación CSV es solo para inventario.

CÓMO PROBAR EN UN PC WINDOWS
1. Descomprime el ZIP.
2. Para una prueba rápida, abre index.html en un navegador moderno. El registro local puede funcionar, pero la instalación PWA y el modo sin conexión requieren servir la carpeta por HTTPS o localhost.
3. Para uso real en iPhone, publica los archivos estáticos en un alojamiento HTTPS gratuito, por ejemplo GitHub Pages. No subas datos de animales ni copias de seguridad al repositorio.
4. Abre la dirección HTTPS en Safari del iPhone.
5. Pulsa Compartir → Añadir a pantalla de inicio → Añadir.
6. Abre desde el nuevo icono y crea un registro de prueba. Exporta una copia JSON y verifica que se pueda importar.

CÓMO PUBLICAR GRATIS CON GITHUB PAGES (RESUMEN)
1. Crea/inicia sesión en GitHub y crea un repositorio nuevo vacío.
2. Sube index.html, styles.css, app.js, manifest.json y sw.js a la raíz del repositorio.
3. En Settings → Pages, configura Deploy from a branch, selecciona la rama principal y la carpeta /(root).
4. Espera a que GitHub muestre la URL HTTPS del sitio.
5. Abre esa URL en Safari del iPhone y añádela a la pantalla de inicio.

SUPABASE
Se deja fuera del flujo de datos local por elección del usuario. Si luego se desea sincronizar, habrá que diseñar una sincronización explícita, autenticación, políticas RLS y resolución de conflictos. No basta con poner una URL y una clave. Nunca incluyas la service_role key en una app cliente.

LIMITACIONES DE ESTA VERSIÓN INICIAL
- Es un prototipo funcional inicial; no sustituye asesoría veterinaria ni lleva protocolos de dosificación.
- Las fechas de parto son manuales; todavía no calcula automáticamente ciclos reproductivos.
- Los recordatorios se muestran dentro de la app; no garantiza notificaciones del sistema cuando está cerrada.
- No tiene sincronización multiusuario ni nube.
- No adjunta fotos ni genera reportes PDF todavía.
- Antes de usarla como registro oficial de una granja de 1000+ animales, prueba con datos ficticios, exporta/importa copias y valida los flujos de trabajo.

Próximo paso recomendado
Configurar el despliegue HTTPS y probar en iPhone; después añadir importación masiva desde Excel/CSV para cargar inventario existente y revisar si conviene conectar el proyecto Supabase ya creado.
