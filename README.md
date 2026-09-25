# Fix & Go — fixandgopro.com

Landing bilingüe (ES/EN) con QR/NFC, mensajes de voz o texto y tickets automáticos por correo.

## Estructura
| Archivo | Qué es |
|---|---|
| `index.html` | La página completa. Se publica tal cual, sin build. |
| `backend/fixandgo-backend.gs` | Google Apps Script: web + Google Voice → ticket con IA a Gmail. |
| `tarjetas/build_cards.py` | Genera la placa del carro (5x7") y las tarjetas EN/ES en PDF. |
| `docs/LINEA-JOSE.md` | Plan futuro: recepcionista IA e intérprete de llamadas. |

## Configurar (arriba del `<script>` en index.html)
```js
PHONE:    "1205XXXXXXX"   // número de Google Voice con 1 delante
FB_PAGE:  "fixandgo"      // usuario de la página de Facebook
ENDPOINT: "https://script.google.com/macros/s/.../exec"   // URL de la App web del backend
```

## Enlaces para QR / NFC
- General: `https://fixandgopro.com/`
- Por categoría: `?s=casa`, `?s=tech`, `?s=negocio`, `?s=viajes`
- Idioma: `&lang=es` o `&lang=en` (si no, detecta el teléfono)
- Zona Atlanta: `&z=atl`

## Publicar (Cloudflare Pages)
Cloudflare → Workers & Pages → Create → Pages → conectar este repo → sin build command, output `/` →
Custom domains → `fixandgopro.com` y `www.fixandgopro.com`.

## Backend de tickets
1. script.google.com → nuevo proyecto → pegar `backend/fixandgo-backend.gs`.
2. Propiedades del script: `OPENROUTER_KEY`, `DEEPGRAM_KEY`.
3. Ejecutar `setup()` → Implementar → App web → Ejecutar como: Yo → Acceso: Cualquier usuario.
4. Copiar la URL `/exec` a `ENDPOINT` en index.html.
5. Cambiar los precios de ejemplo en `PRICES`.

## Tarjetas e impresión
```bash
pip install "qrcode[pil]" playwright && playwright install chromium
python3 tarjetas/build_cards.py --phone 205XXXXXXX --out print
python3 tarjetas/build_cards.py --phone 404XXXXXXX --zone atl --out print   # Chamblee/Atlanta
```
Salida: `print/placa-carro.pdf`, `print/tarjeta-en.pdf`, `print/tarjeta-es.pdf`.
