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


ACTUALIZACIÓN VISUAL Y OPERATIVA
- Identidad visual olivo, café, beige y dorado; incorpora el logo suministrado.
- Ubicación de referencia: Guadalupe, Huila, Colombia.
- Nave 1: áreas de cerdas de cría, machos reproductores, maternidad/lechones recién nacidos y charcas; capacidad pendiente de definir.
- Nave 2: 4 corrales de 50 plazas (200 en total).
- Nave 3: 12 corrales de 40 plazas (480 en total).
- Para contar ocupación, escribe en el campo Lote los códigos N2-C1…N2-C4 o N3-C1…N3-C12.
- Comederos configurables por capacidad en kg, número de cerdos, etapa, sexo, consumo estimado kg/cerdo/día, factor ambiental y stock disponible.
- Conversión de alimento: 1 bulto = 40 kg. La app estima kg/día, bultos/día y días de duración del stock.
- Se añadió seguimiento de estado de inmunocastración y fechas de dosis al registro de animales.
- Se añadieron campos de servicio, último celo observado y riesgo de repetir celo en reproducción.

NOTA TÉCNICA
La ubicación Guadalupe, Huila queda como dato de la granja; no se asigna automáticamente un factor climático sin mediciones o recomendación técnica. En comederos el factor comienza en 1,00 y es editable. El consumo real depende de etapa, peso, genética, dieta, agua, temperatura y manejo.
La duración gestacional debe registrarse con fecha probable validada por el productor/veterinario; esta versión todavía no calcula automáticamente la fecha de parto ni determina un porcentaje clínico de repetición de celo. El seguimiento de inmunocastración es administrativo, no una indicación de protocolo o dosificación veterinaria.

CÁLCULOS REPRODUCTIVOS AÑADIDOS EN V2
- Cuando se registra fecha de servicio o una fecha de inicio de gestación, la interfaz estima el parto a 114 días si no se introduce una fecha manual.
- Muestra una ventana orientativa de vigilancia por posible retorno a celo a los 18–24 días después del servicio.
- Esto no representa una probabilidad individual calculada: la repetición de celo debe confirmarse mediante observación y registro. La fecha estimada es orientativa y debe validarse con el personal veterinario.

CORRECCIÓN V3 — NAVE Y CORRALES
Se corrigió el HTML de las tarjetas de Nave 2 y Nave 3: ahora los 4 corrales de 50 plazas y los 12 corrales de 40 plazas están escritos como HTML válido, en vez de mostrar código JavaScript como texto. Se actualizó el identificador de caché del service worker para facilitar la descarga de los archivos nuevos.

VERSIÓN 4 — CALENDARIO REPRODUCTIVO AUTOMÁTICO
Al registrar un servicio (monta o inseminación) con fecha, el sistema calcula automáticamente la ventana orientativa de retorno a celo (días 18–24) y la fecha probable de parto (114 días desde el servicio). Genera recordatorios automáticamente, sin que el usuario tenga que crear alertas manualmente. En el registro reproductivo debe seleccionarse el estado de gestación: Pendiente de confirmar, Preñada confirmada, No preñada / repitió celo o Parto realizado. La confirmación de gestación modifica el tipo de seguimiento automático. El usuario solo registra el servicio y el resultado observado; la app calcula las fechas.
Nota: 114 días es una estimación habitual, no una garantía exacta. La ventana de 18–24 días es orientativa; la observación real y confirmación veterinaria son importantes.

VERSIÓN 5 — INGRESO POR CANTIDAD, FICHAS INDIVIDUALES Y CORRALES
- Se puede ingresar una cantidad de animales por categoría y edad en días.
- Cada animal ingresado recibe una ficha individual y un ID único; en engorde se agrupan por un mismo lote y se cuentan machos y hembras.
- Se puede editar individualmente cada animal, cambiar su lote y su ubicación actual. La ocupación de áreas se recalcula a partir de los registros activos.
- Ubicaciones: Timbo gestación, Timbo macho reproductor, Timbo lactancia, Precebo 1, 2 y 3, Charca 1 y 2, Nave 2 corrales 1–4, Nave 3 corrales 1–12.
- Cada área tiene una capacidad configurable. Se inicializa en 0/no configurada porque el usuario no indicó las capacidades reales; al ingresar animales, la app advierte si se excede una capacidad configurada.
- La edad de ingreso en días se convierte en fecha de nacimiento estimada a partir de la fecha de ingreso. Es una estimación administrativa.

VERSIÓN 5 — INGRESO INDIVIDUAL POR GRUPOS Y CORRALES
- Ingreso por cantidad: Engorde, Cerda de cría, Macho reproductor, Lechones y Reemplazo.
- Cada animal ingresado genera una ficha individual con arete único, edad en días, fecha de nacimiento calculada, lote, sexo y ubicación actual.
- En engorde se debe repartir la cantidad entre machos y hembras; cada ficha queda individual y se puede editar/mover de lote o corral.
- Áreas precargadas: Timbo gestación, Timbo macho reproductor, Timbo lactancia, Precebo 1, Precebo 2, Precebo 3, Charca 1, Charca 2, Nave 2 corrales 1–4 y Nave 3 corrales 1–12.
- En Corrales y lotes se puede editar la capacidad máxima real de cada ubicación. Ocupación y plazas libres se calculan según fichas activas.
- El inventario muestra edad, lote, ubicación y sexo, y permite editar cada cerdo individual.


VERSIÓN 5 — INGRESOS POR LOTE Y CAPACIDAD POR CORRAL
- Botón “Ingreso por lote” crea una ficha individual por cada cerdo ingresado, con identificador único, edad en días convertida a fecha de nacimiento, lote, sexo, categoría y ubicación.
- Para engorde, se indica cantidad de machos y cantidad de hembras; la suma define cuántas fichas individuales se crean.
- Para cerdas de cría y machos reproductores, se indica la cantidad total y el sistema asigna el sexo correspondiente.
- Los animales de engorde pueden editarse individualmente y moverse de lote o corral desde el formulario individual.
- La sección “Naves y corrales” permite editar la capacidad máxima de cada área y muestra ocupación activa, plazas disponibles y alertas si se supera la capacidad.
- Áreas: Timbo gestación, Timbo macho reproductor, Timbo lactancia, Precebo 1, 2 y 3, Charca 1 y 2, Nave 2 corrales 1–4, Nave 3 corrales 1–12.
- Capacidad predeterminada: Nave 2 corrales 1–4 = 50 cada uno; Nave 3 corrales 1–12 = 40 cada uno. Áreas de Nave 1 empiezan con capacidad 0/sin definir para que el usuario configure la capacidad real.
- Se corrigió el resumen para leer los almacenes correctos y se actualizó la caché del service worker.
