# Fix & Go — fixandgopro.com

Sitio bilingüe (ES/EN) con dos páginas:

| Dirección | Archivo | Para qué |
|---|---|---|
| **fixandgopro.com** | `index.html` | Página principal: moderna, animada, con todos los servicios, zonas y preguntas. |
| **fixandgopro.com/go/** | `go/index.html` | Página del **QR / NFC** (placa del carro y tarjetas): elegir servicio, llamar, escribir o mandar nota de voz en 3 toques. |

Los dos leen el teléfono, el correo y la lista de servicios de **`config.js`**. Se cambia ahí una sola vez.
En `config.js` también está **`HOT`**, la lista "Lo más pedido" **por idioma** (`HOT.es` y `HOT.en`): los botones que salen primero en las dos páginas.
El orden de las categorías también va por idioma en **`ORDER`**: en español primero casa y trámites; en inglés casa y tecnología. Redes sociales (`negocio`) se ve siempre, pero no de primero.
Dentro de cada categoría, los servicios salen en el orden en que están escritos en `S` (lo que más se pide va primero).
La sección **Redes sociales / Community manager** de la página principal (rueda de redes, lo que incluye, cómo lo hacemos) tiene sus textos en `index.html` (`L.es` / `L.en`: `deliv`, `proc`, `who`, `nets`).
Cuando cambies `config.js`, sube el número de versión en las dos páginas (`/config.js?v=2` → `?v=3`) para que nadie vea la copia vieja guardada en caché.
Si después de publicar ves algo viejo, en Cloudflare → **Caching** → **Configuration** → **Purge Everything** se borra la copia guardada. Las páginas siguen funcionando aunque llegue un `config.js` viejo (solo no sale "Lo más pedido" y usa el orden de siempre).
Los enlaces viejos del QR (`fixandgopro.com/?s=…`, `?lang=…`, `?z=…`) se redirigen solos a `/go/`.

## Estructura
```
index.html                    Página principal (HTML + CSS + JS). Se publica tal cual, sin build.
go/index.html                 Página del QR/NFC (la que abren la placa y las tarjetas)
config.js                     Teléfono, correo, Facebook, ENDPOINT y la lista de servicios (compartido)
.assetsignore                 Lo que Cloudflare NO publica (solo se publican index.html, go/, config.js y logo/)
logo/                         Logos (los usan las dos páginas y las tarjetas)
  logo-mark.svg               Ícono F& (azul marino): header de la web y reverso de la tarjeta
  logo-mark-teal.svg          Ícono F& verde azulado: header en modo oscuro
  logo-horizontal.svg         Ícono + "Fix & Go": base de la placa del carro (versión blanca)
  logo-horizontal.png         Logo horizontal en PNG (fondo transparente)
  og-image.png                Imagen al compartir el link (og:image, 1200x630, fondo sólido)
  logo-mark-32.png            Favicon
  apple-touch-icon.png        Ícono de iPhone en pantalla de inicio (180x180, fondo sólido, sin esquinas)
  logo-mark-180.png           Ícono 180 con esquinas redondeadas transparentes
  logo-mark-192.png           Ícono de Android
  logo-mark-512.png           Ícono grande (redes, perfiles)
  qr-go.svg                   QR a fixandgopro.com/go/ (pie de la página principal)
backend/fixandgo-backend.gs   Google Apps Script: web + Google Voice + correo info@ → ticket con IA a Gmail
tarjetas/build_cards.py       Genera la placa del carro (5x7") y las tarjetas EN/ES en PDF
docs/LINEA-JOSE.md            Plan futuro: recepcionista IA e intérprete de llamadas
```

Si cambias un logo, reemplaza el archivo en `logo/` con el **mismo nombre** y la web y las tarjetas lo usan solos.
La imagen para compartir usa la URL absoluta `https://fixandgopro.com/logo/og-image.png`.

## Cambiar PHONE, FB_PAGE, EMAIL y ENDPOINT

Abre **`config.js`** (en la raíz) y cambia el bloque `CONFIGURA AQUÍ`. Lo usan las dos páginas:

```js
const CONFIG = {
  PHONE:    "12054908033",   // tu número con código de país, sin + ni espacios
  FB_PAGE:  "",              // usuario de tu página de Facebook. Vacío = sin botón Messenger
  EMAIL:    "info@fixandgopro.com",   // correo de empresa
  ENDPOINT: ""               // URL de la App web de Apps Script. Vacío = sin notas de voz
};
```

| Campo | Qué poner | Ejemplo | Dónde se usa |
|---|---|---|---|
| `PHONE` | Tu número de Google Voice **con el 1 delante**, solo dígitos (sin `+`, espacios ni guiones). | `"12055551234"` | Botón de llamar, Texto (SMS) y WhatsApp. |
| `FB_PAGE` | El usuario de tu página de Facebook, lo que va después de `facebook.com/`. **Vacío = no sale el botón Messenger** (así está hasta crear la página). | `"fixandgo"` | Botón Messenger (`m.me/fixandgo`). |
| `EMAIL` | El correo de empresa (ver *Correo de empresa*). | `"info@fixandgopro.com"` | Botón Correo (abre el correo del cliente con el mensaje ya escrito). |
| `ENDPOINT` | La URL `/exec` de la App web del backend (ver *Backend de tickets*). | `"https://script.google.com/macros/s/AKfy.../exec"` | Enviar notas de voz y mensajes escritos como ticket. |

Con `ENDPOINT` vacío la página sigue funcionando: se oculta la nota de voz y “Enviar mensaje”
abre WhatsApp (en español) o SMS (en inglés) con el mensaje ya escrito.

Guarda, haz commit y push: Cloudflare Pages publica solo en ~1 minuto.

```bash
git add config.js
git commit -m "Actualizar teléfono / endpoint"
git push
```

## Enlaces para QR / NFC
- General: `https://fixandgopro.com/go/`
- Abrir directo "Déjanos un mensaje": `?m=1`
- Por categoría: `?s=casa`, `?s=tech`, `?s=tramites`, `?s=negocio`, `?s=viajes`
- Idioma: `&lang=es` o `&lang=en` (si no, detecta el teléfono)
- Zona Atlanta: `&z=atl`

Ejemplo: `https://fixandgopro.com/go/?s=tech&lang=es&z=atl`

## Publicar en Cloudflare (sin build)

La página está publicada como **Worker** `fixandogopro`, conectado a este repo:
`https://fixandogopro.glowstudios.workers.dev`. Cada push a `main` se vuelve a publicar solo.

Conectar el dominio (una sola vez):
1. Cloudflare → **Workers & Pages** → abre `fixandogopro` → **Settings** → **Domains & Routes** → **+ Add**.
2. **Custom domain** → `fixandgopro.com` → **Add domain**.
3. Repite con `www.fixandgopro.com`.

Cloudflare crea solo los registros DNS y el certificado SSL. Puede tardar unos minutos.

`.assetsignore` evita que se publiquen los archivos internos (README, backend, tarjetas, docs). Solo se
publican `index.html`, `go/`, `config.js` y `logo/`. Si agregas archivos privados nuevos, ponlos también en `.assetsignore`.

## Backend de tickets
1. script.google.com → nuevo proyecto → pegar `backend/fixandgo-backend.gs`.
2. Propiedades del script: `OPENROUTER_KEY`, `DEEPGRAM_KEY`.
3. Ejecutar `setup()` → Implementar → App web → Ejecutar como: Yo → Acceso: Cualquier usuario.
4. Copiar la URL `/exec` a `ENDPOINT` en `config.js`.
5. Cambiar los precios de ejemplo en `PRICES`.

Cada 5 minutos el script revisa los buzones y SMS de Google Voice (`processVoice`) y los correos que llegan a
info@ (`processEmail`). Si instalaste el backend antes de agregar el correo, ejecuta `setup()` otra vez para
crear el trigger nuevo.

La grabación de voz necesita HTTPS (Cloudflare ya lo da) y que el cliente acepte el permiso de micrófono.

## Correo de empresa (info@fixandgopro.com)

Los clientes escriben a **info@fixandgopro.com**. Cloudflare reenvía ese correo a tu Gmail y el backend lo
convierte en ticket:
- Se ignoran no-reply, mailer-daemon, boletines y respuestas automáticas.
- Te llega el ticket con la IA (origen **Correo**) y el botón **✉️ Ver borrador de respuesta**.
- En el mismo hilo queda un **borrador** con la respuesta sugerida. Lo revisas y lo mandas tú.
- Si Gmail ya tiene info@ en "Enviar como", el cliente recibe al momento un acuse en su idioma
  ("Recibimos tu mensaje. Te respondemos hoy mismo.") **enviado desde info@**. Si el alias no existe,
  no se le manda nada, para no mostrar tu Gmail personal, y el ticket te avisa.
- El hilo queda con la etiqueta **Tickets** para no procesarlo dos veces. Si el cliente vuelve a
  responder en ese hilo, lo ves en Gmail, pero no se crea otro ticket.

### 1. Cloudflare Email Routing (recibir en info@)
1. Entra a dash.cloudflare.com y elige el dominio **fixandgopro.com**.
2. Menú **Email** → **Email Routing** → **Get started** / **Enable Email Routing**.
3. Cloudflare te muestra los registros **MX** y **TXT (SPF)** que va a crear → **Add records and enable**.
4. Pestaña **Destination addresses** → **Add destination address** → escribe tu Gmail → **Save**.
   Te llega un correo de Cloudflare a tu Gmail: ábrelo y pulsa **Verify email address**.
5. Pestaña **Routing rules** → **Custom addresses** → **Create address**:
   - Custom address: `info`
   - Action: **Send to an email**
   - Destination: tu Gmail (ya verificado)
   - **Save**. La regla debe quedar en **Active**.
6. Prueba: desde otro correo escribe a info@fixandgopro.com. Debe llegarte a tu Gmail en segundos.

### 1b. Filtro de Gmail: que info@ nunca caiga en Spam
Gmail a veces manda a **Spam** los correos que reenvía Cloudflare, y el backend **no revisa Spam**:
sin este filtro esos correos no se convierten en ticket.
1. Desde la computadora (la app del celular no crea filtros), abre
   https://mail.google.com/mail/u/0/#settings/filters → **Crear un filtro nuevo**.
2. En **Para** escribe `info@fixandgopro.com` → **Crear filtro**.
3. Marca **Nunca enviarlo a Spam** y **Marcar siempre como importante** → **Crear filtro**.
4. Si ya hay correos de info@ en Spam, ábrelos y pulsa **Informar que no es spam**.

### 2. Gmail "Enviar como" info@ (responder desde info@)
1. Activa la **verificación en 2 pasos** de tu cuenta de Google: myaccount.google.com → Seguridad.
2. Crea una **contraseña de aplicación** en myaccount.google.com/apppasswords con el nombre
   `Fix & Go correo`. Copia las 16 letras; solo se muestran una vez.
3. Gmail → ⚙️ **Ver toda la configuración** → **Cuentas e importación** → **Enviar como** →
   **Añadir otra dirección de correo electrónico**:
   - Nombre: `Fix & Go`
   - Dirección: `info@fixandgopro.com`
   - Deja marcado **Tratar como un alias** → **Siguiente paso**.
4. Servidor SMTP:
   - Servidor SMTP: `smtp.gmail.com`
   - Puerto: `587`
   - Nombre de usuario: tu Gmail completo
   - Contraseña: la **contraseña de aplicación** del paso 2
   - Marca **Conexión segura con TLS** → **Añadir cuenta**.
5. Gmail manda un código de confirmación a info@, que te llega a tu Gmail gracias a Cloudflare.
   Ábrelo y pulsa el enlace (o pega el código).
6. Recomendado: en **Enviar como**, marca **Responder desde la misma dirección a la que se envió el mensaje**.
   Así, cuando respondas a un cliente que escribió a info@, sale desde info@.

### 3. Registro SPF final (para que tus correos no caigan en spam)
En Cloudflare → **DNS** → **Records**, edita el registro **TXT** del dominio raíz (`fixandgopro.com`) que
empieza con `v=spf1` (lo creó Email Routing) y déjalo exactamente así:

```
v=spf1 include:_spf.mx.cloudflare.net include:_spf.google.com ~all
```

Solo puede haber **un** registro SPF. Si hay otro `v=spf1`, bórralo. El primer `include` es de Cloudflare
(recibir) y el segundo de Google (enviar desde info@ con Gmail).

### 4. Activar el backend
Si el backend ya estaba instalado, abre el proyecto en script.google.com, pega la versión nueva de
`backend/fixandgo-backend.gs` y ejecuta `setup()` una vez. Eso crea el trigger de `processEmail`.

## Regenerar tarjetas e impresión

Instalar una vez:
```bash
pip install "qrcode[pil]" playwright && playwright install chromium
```

Generar (cambia `NUMERO` por tu número, ej. `2055551234`):
```bash
python3 tarjetas/build_cards.py --domain fixandgopro.com --phone NUMERO --out print
python3 tarjetas/build_cards.py --domain fixandgopro.com --phone NUMERO --zone atl --out print   # Chamblee/Atlanta
```

El reverso sale como tarjeta de empresa (logo, "Fix & Go" y los servicios). Para una tarjeta con nombre de una
persona del equipo agrega `--name "Nombre"`.

Córrelo desde la raíz del repo. Toma los logos de `logo/` (`logo-mark.svg` en el reverso de la tarjeta y
`logo-horizontal.svg` en blanco arriba de la placa).

Salida en `print/`: `placa-carro.pdf`, `tarjeta-en.pdf`, `tarjeta-es.pdf` (con `--zone atl` llevan `-atl` al final).
La carpeta `print/` está en `.gitignore`, no se sube al repo.

Regenera las tarjetas cada vez que cambies de número o de dominio, porque los QR llevan el enlace impreso.
