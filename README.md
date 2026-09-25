# Fix & Go — fixandgopro.com

Landing bilingüe (ES/EN) con QR/NFC, mensajes de voz o texto y tickets automáticos por correo.

## Estructura
```
index.html                    La página completa (HTML + CSS + JS). Se publica tal cual, sin build.
logo/                         Logos (los usa index.html y las tarjetas)
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
backend/fixandgo-backend.gs   Google Apps Script: web + Google Voice → ticket con IA a Gmail
tarjetas/build_cards.py       Genera la placa del carro (5x7") y las tarjetas EN/ES en PDF
docs/LINEA-JOSE.md            Plan futuro: recepcionista IA e intérprete de llamadas
```

Si cambias un logo, reemplaza el archivo en `logo/` con el **mismo nombre** y la web y las tarjetas lo usan solos.
La imagen para compartir usa la URL absoluta `https://fixandgopro.com/logo/og-image.png`.

## Cambiar PHONE, FB_PAGE y ENDPOINT

Abre `index.html` y busca el bloque `CONFIGURA AQUÍ` (justo al empezar el `<script>`, cerca de la línea 200):

```js
const CONFIG = {
  PHONE:    "12055550000",   // tu número con código de país, sin + ni espacios
  FB_PAGE:  "fixandgo",      // usuario de tu página de Facebook (m.me/usuario)
  ENDPOINT: ""               // URL de la App web de Apps Script. Vacío = sin notas de voz
};
```

| Campo | Qué poner | Ejemplo | Dónde se usa |
|---|---|---|---|
| `PHONE` | Tu número de Google Voice **con el 1 delante**, solo dígitos (sin `+`, espacios ni guiones). | `"12055551234"` | Botón de llamar, Texto (SMS) y WhatsApp. |
| `FB_PAGE` | El usuario de tu página de Facebook, lo que va después de `facebook.com/`. | `"fixandgo"` | Botón Messenger (`m.me/fixandgo`). |
| `ENDPOINT` | La URL `/exec` de la App web del backend (ver *Backend de tickets*). | `"https://script.google.com/macros/s/AKfy.../exec"` | Enviar notas de voz y mensajes escritos como ticket. |

Con `ENDPOINT` vacío la página sigue funcionando: se oculta la nota de voz y “Enviar mensaje”
abre WhatsApp (en español) o SMS (en inglés) con el mensaje ya escrito.

Guarda, haz commit y push: Cloudflare Pages publica solo en ~1 minuto.

```bash
git add index.html
git commit -m "Actualizar teléfono / endpoint"
git push
```

## Enlaces para QR / NFC
- General: `https://fixandgopro.com/`
- Por categoría: `?s=casa`, `?s=tech`, `?s=negocio`, `?s=viajes`
- Idioma: `&lang=es` o `&lang=en` (si no, detecta el teléfono)
- Zona Atlanta: `&z=atl`

Ejemplo: `https://fixandgopro.com/?s=tech&lang=es&z=atl`

## Publicar en Cloudflare Pages (sin build)

1. Cloudflare → **Workers & Pages** → **Create** → pestaña **Pages** → **Connect to Git**.
2. Autoriza GitHub y elige el repo `botjosean/fixandogopro` → **Begin setup**.
3. Configuración:
   - Project name: `fixandgopro`
   - Production branch: `main`
   - Framework preset: **None**
   - Build command: *(vacío)*
   - Build output directory: `/`
4. **Save and Deploy**. Queda en `https://fixandgopro.pages.dev`.
5. En el proyecto → **Custom domains** → **Set up a custom domain** → `fixandgopro.com` → **Activate domain**.
6. Repite con `www.fixandgopro.com`.

Como el dominio ya está en tu Cloudflare, los registros DNS (CNAME) y el certificado SSL se crean solos.
Cada push a `main` se publica automáticamente; otras ramas generan una vista previa.

## Backend de tickets
1. script.google.com → nuevo proyecto → pegar `backend/fixandgo-backend.gs`.
2. Propiedades del script: `OPENROUTER_KEY`, `DEEPGRAM_KEY`.
3. Ejecutar `setup()` → Implementar → App web → Ejecutar como: Yo → Acceso: Cualquier usuario.
4. Copiar la URL `/exec` a `ENDPOINT` en index.html.
5. Cambiar los precios de ejemplo en `PRICES`.

La grabación de voz necesita HTTPS (Cloudflare ya lo da) y que el cliente acepte el permiso de micrófono.

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

Córrelo desde la raíz del repo. Toma los logos de `logo/` (`logo-mark.svg` en el reverso de la tarjeta y
`logo-horizontal.svg` en blanco arriba de la placa).

Salida en `print/`: `placa-carro.pdf`, `tarjeta-en.pdf`, `tarjeta-es.pdf` (con `--zone atl` llevan `-atl` al final).
La carpeta `print/` está en `.gitignore`, no se sube al repo.

Regenera las tarjetas cada vez que cambies de número o de dominio, porque los QR llevan el enlace impreso.
