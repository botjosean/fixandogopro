#!/usr/bin/env python3
"""
Genera tarjetas de presentación (3.5x2" con sangrado) y la placa del carro (5x7") en PDF.
Uso:
  pip install "qrcode[pil]" playwright && playwright install chromium
  python3 tarjetas/build_cards.py --domain fixandgopro.com --phone 2054908033 [--zone atl] --out print
Los logos se leen de logo/ en la raíz del repo. Los QR apuntan a /go/ (la página del QR).
"""
import argparse, io, os
import qrcode, qrcode.image.svg
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser()
ap.add_argument("--domain", default="fixandgopro.com")
ap.add_argument("--phone", default="2054908033", help="10 dígitos, sin +1")
ap.add_argument("--name", default="", help="nombre en el reverso; vacío = solo la marca Fix & Go")
ap.add_argument("--zone", default="", help="atl para tarjetas de Chamblee/Atlanta")
ap.add_argument("--out", default=".")
ap.add_argument("--placa-sin-nfc", action="store_true", help="solo la placa del carro, sin la parte NFC, en PNG 600 dpi")
ap.add_argument("--opciones", default="abc", help="opciones de mecánica en la placa: a, b y/o c")
ap.add_argument("--volante", action="store_true", help="volante 4x6 para entregar (PNG 600 dpi) + hoja carta con 2")
ap.add_argument("--hoja4", action="store_true", help="hoja carta 8.5x11 con 4 volantes de 4.25x5.5 (JPG y PNG 300 dpi)")
ap.add_argument("--hoja4doc", action="store_true", help="hoja carta para impresion de documento: 4 volantes con margen blanco (PDF y PNG)")
a = ap.parse_args()

P = a.phone
PHONE_FMT = f"({P[:3]}) {P[3:6]}-{P[6:]}"
Z = f"&z={a.zone}" if a.zone else ""
AREA = {"": {"en": "Birmingham area", "es": "Birmingham y alrededores"},
        "atl": {"en": "Chamblee, Doraville & Atlanta", "es": "Chamblee, Doraville y Atlanta"}}[a.zone]

LOGO_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "logo")

def logo_svg(name, uid):
    """SVG del logo en línea, con ids únicos por uso (varios logos en la misma página)."""
    with open(os.path.join(LOGO_DIR, name), encoding="utf-8") as f:
        svg = f.read().strip()
    svg = svg.replace('id="r"', f'id="{uid}"').replace("url(#r)", f"url(#{uid})")
    return svg

def logo_white():
    """Logo horizontal en blanco para fondo verde azulado: sin cuadro, F, círculo y letras en blanco, & en mango."""
    svg = logo_svg("logo-horizontal.svg", "lw")
    svg = svg.replace('<rect width="200" height="200" fill="#14213D"/>', "")    # quita el cuadro azul marino
    svg = svg.replace('<g fill="#14213D"><path', '<g fill="#F2A541"><path')      # & dentro del círculo
    return svg.replace('fill="#14213D"', 'fill="#ffffff"')                      # letras "Fix" y "Go"

def qr(url):
    img = qrcode.make(url, image_factory=qrcode.image.svg.SvgPathImage, box_size=10, border=0,
                      error_correction=qrcode.constants.ERROR_CORRECT_M)
    b = io.BytesIO(); img.save(b)
    svg = b.getvalue().decode()
    return svg[svg.index("<svg"):]

CARDS = {
  "casa":    {"en": ("Your home: safe, connected, done", "Cameras, Wi-Fi, TVs, lights, furniture. One visit, done."),
              "es": ("Tu casa segura, conectada y al día", "Cámaras, WiFi, TV, lámparas y muebles. Una visita y listo.")},
  "tramites":{"en": ("Paperwork, handled", "Taxes, LLCs, insurance, payments, appointments and shipping."),
              "es": ("Tus trámites, resueltos", "Taxes, LLC, seguros, pagos, citas y paquetería.")},
  "tech":    {"en": ("Slow, overheating or dead? We'll fix it", "iPhone, PS5, PCs and Macs, hacked accounts and lost data."),
              "es": ("¿Lenta, caliente o no prende? La arreglamos", "iPhone, PS5, PC y Mac, cuentas hackeadas y datos perdidos.")},
  "negocio": {"en": ("Social media that sells", "Community management, content, ads and landing pages."),
              "es": ("Tus redes sociales, vendiendo", "Community manager, contenido, anuncios y páginas que venden.")},
  "viajes":  {"en": ("We drive you, wait, and bring you back", "Atlanta trips, airport rides and appointments."),
              "es": ("Te llevamos, te esperamos y te traemos", "Consulado en Atlanta, aeropuerto y citas.")},
}
# orden actual del sitio (config.js -> ORDER), asi la tarjeta general sigue lo mismo que la pagina
CAT_ORDER = {"en": ["casa", "tech", "negocio", "viajes", "tramites"], "es": ["casa", "tramites", "tech", "negocio", "viajes"]}
BACK = {"en": ("Text or call", "English and Spanish"), "es": ("Escríbenos o llámanos", "Español e inglés")}
TAG = {"en": "Home · Tech · Social media · Rides · Paperwork", "es": "Casa · Trámites · Tecnología · Redes sociales · Viajes"}

CSS = """
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,800&family=Atkinson+Hyperlegible:wght@400;700&display=swap');
:root{--navy:#14213D;--sea:#0E7C86;--mango:#F2A541;--paper:#FBFCFD;--muted:#4A5873}
*{box-sizing:border-box;margin:0;padding:0}
body{-webkit-print-color-adjust:exact;print-color-adjust:exact;font-family:'Atkinson Hyperlegible',Arial,sans-serif}
h1,h2,.b{font-family:'Bricolage Grotesque','Arial Narrow',Arial,sans-serif}
.pg{position:relative;overflow:hidden;page-break-after:always}
/* tarjeta 3.5x2 + 1/16" sangrado; zona segura 1/8" hacia dentro del corte */
.card{width:3.625in;height:2.125in}
.front{background:var(--sea);color:#fff}
.front::after{content:"";position:absolute;right:-.55in;bottom:-.7in;width:1.7in;height:1.7in;border-radius:50%;background:var(--mango)}
.front .tx{position:absolute;left:.22in;top:.22in;width:2.05in;z-index:1}
.front h1{font-weight:800;font-size:17pt;line-height:.98;letter-spacing:-.02em}
.front p{font-size:7.6pt;margin-top:.08in;line-height:1.3}
.gen h1{font-size:13.2pt}
.gen .tx{width:2.12in}
.gen ul{list-style:none;margin-top:.1in;font-size:7.4pt;line-height:1.45;font-weight:700}
.gen li::before{content:"";display:inline-block;width:.05in;height:.05in;border-radius:50%;background:var(--mango);margin-right:.06in;vertical-align:middle}
.front .ar{position:absolute;left:.22in;bottom:.2in;font-size:6.8pt;font-weight:700;opacity:.9;z-index:1}
.qrbox{position:absolute;right:.22in;top:.22in;width:1.02in;background:#fff;border-radius:.1in;padding:.07in;z-index:2;text-align:center}
.qrbox svg{width:100%;height:auto;display:block}
.qrbox span{display:block;color:var(--navy);font-size:6.2pt;font-weight:700;margin-top:.04in}
.back{background:var(--paper);color:var(--navy)}
.back .tx{position:absolute;left:.22in;top:.24in;right:.22in;display:flex;align-items:center;gap:.09in}
.back .mk{width:.45in;height:.45in;flex:none}
.back .mk>svg,.plate .logo>svg{display:block;width:100%;height:100%}
.back .nm{font-weight:800;font-size:22pt;line-height:1}
.back .br{font-family:'Bricolage Grotesque',Arial;font-size:11pt;color:var(--sea);font-weight:800;margin-top:.04in}
.back .br i,.back .nm i{font-style:normal;color:var(--mango)}
.back .tg{font-size:7.6pt;font-weight:700;color:var(--sea);margin-top:.05in}
.plate .logo{height:.5in;width:1.48in;margin-bottom:.2in}
.back .ph{position:absolute;left:.22in;bottom:.42in;font-family:'Bricolage Grotesque',Arial;font-weight:800;font-size:17pt;letter-spacing:-.01em}
.back .ln{position:absolute;left:.22in;bottom:.22in;font-size:7.2pt;color:var(--muted)}
.back .dot{position:absolute;right:-.35in;top:-.35in;width:1in;height:1in;border-radius:50%;background:var(--mango)}
/* placa 5x7 + 1/8" sangrado */
.plate{width:5.25in;height:7.25in;background:var(--sea);color:#fff}
.plate::after{content:"";position:absolute;right:-1.2in;top:-1.2in;width:3.2in;height:3.2in;border-radius:50%;background:var(--mango)}
.plate .tx{position:absolute;left:.45in;top:.5in;right:.45in;z-index:1}
.plate h1{font-weight:800;font-size:34pt;line-height:.95;letter-spacing:-.03em;max-width:4.35in}
.plate h2{font-weight:500;font-size:17pt;margin-top:.12in;opacity:.95}
.plate .sv{font-size:13pt;margin-top:.22in;line-height:1.45;max-width:4.2in}
.plate .pill{display:inline-block;margin:.1in 0 0;padding:.05in .18in;border-radius:999px;background:#fff;color:#14213D;font-weight:800;font-size:12.5pt}
.plate .ph{font-family:'Bricolage Grotesque',Arial;font-weight:800;font-size:29pt;line-height:1;letter-spacing:-.02em;margin:.1in 0 0}
.plate .phs{font-size:10.5pt;margin:.04in 0 0;opacity:.95}
.duo{position:absolute;left:.45in;right:.45in;bottom:.5in;display:flex;gap:.3in;z-index:1}
.col{flex:1;text-align:center}
.col b{display:block;font-family:'Bricolage Grotesque',Arial;font-size:18pt;line-height:1;margin-top:.14in}
.col span{display:block;font-size:9.5pt;margin-top:.05in;opacity:.95}
.qrbig{background:#fff;border-radius:.18in;padding:.16in;aspect-ratio:1}
.qrbig svg{width:100%;height:100%;display:block}
.tap{aspect-ratio:1;border-radius:50%;background:#fff;border:.07in dashed var(--mango);padding:.28in}
/* mecánica en la placa */
.plate .pill.auto{background:var(--mango);color:var(--navy)}
.plate .pill svg,.plate .new svg{width:.2in;height:.2in;vertical-align:-.035in;margin-right:.07in}
.plate .new{color:var(--mango);font-weight:800;font-size:14pt;margin-top:.12in}
.solo{justify-content:center}
.va .solo .col,.vc .solo .col{width:1.62in}
.vc.flyer .solo .col{width:2.15in}
.solo .col{flex:none;width:2.05in}
"""

NFC = '<svg class="nfc" viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"><path d="M14 16c3 4.5 3 11.5 0 16"/><path d="M22 11c5 7.5 5 18.5 0 26"/><path d="M30 6c7 10.5 7 25.5 0 36"/></svg>'

def front(k, lang):
    h, s = CARDS[k][lang]
    url = f"https://{a.domain}/go/?s={k}&lang={lang}{Z}"
    scan = "Escanea" if lang == "es" else "Scan me"
    return f'''<div class="pg card front"><div class="tx"><h1>{h}</h1><p>{s}</p></div>
      <div class="ar">{AREA[lang]}</div>
      <div class="qrbox">{qr(url)}<span>{scan}</span></div></div>'''

# version corta (una linea) de cada categoria, para que quepan las 5 en la tarjeta general
TILE = {
  "casa":    {"en": "Cameras, Wi-Fi & TV", "es": "Cámaras, WiFi y TV"},
  "tramites":{"en": "Taxes, LLCs & insurance", "es": "Taxes, LLC y seguros"},
  "tech":    {"en": "iPhone, PS5, PC & Mac", "es": "iPhone, PS5, PC y Mac"},
  "negocio": {"en": "Social media & ads", "es": "Redes sociales y anuncios"},
  "viajes":  {"en": "Atlanta & airport rides", "es": "Atlanta y aeropuerto"},
}
GEN = {
  "en": ("Need a hand?<br>We've got you.", [TILE[k]["en"] for k in CAT_ORDER["en"]]),
  "es": ("¿Necesitas una mano?<br>Aquí estamos.", [TILE[k]["es"] for k in CAT_ORDER["es"]]),
}

def front_general(lang):
    h, items = GEN[lang]
    url = f"https://{a.domain}/go/?lang={lang}{Z}"
    scan = "Escanea" if lang == "es" else "Scan me"
    lis = "".join(f"<li>{x}</li>" for x in items)
    return f'''<div class="pg card front gen"><div class="tx"><h1>{h}</h1><ul>{lis}</ul></div>
      <div class="ar">{AREA[lang]}</div>
      <div class="qrbox">{qr(url)}<span>{scan}</span></div></div>'''

def back(lang):
    l1, l2 = BACK[lang]
    if a.name:   # tarjeta personal: nombre + marca
        top = f'<div class="nm b">{a.name}</div><div class="br">Fix <i>&amp;</i> Go</div>'
    else:        # tarjeta de empresa: marca + lo que hacemos
        top = f'<div class="nm b">Fix <i>&amp;</i> Go</div><div class="tg">{TAG[lang]}</div>'
    return f'''<div class="pg card back"><div class="dot"></div><div class="tx">
      <div class="mk">{logo_svg("logo-mark.svg", "lm-" + lang)}</div>
      <div>{top}</div></div>
      <div class="ph">{PHONE_FMT}</div><div class="ln">{l1}. {l2}.</div></div>'''

PHONE_SVG = """<svg viewBox="0 0 120 120" width="100%" height="100%" fill="none">
  <g transform="rotate(-18 60 60)">
    <rect x="38" y="18" width="44" height="80" rx="9" fill="#14213D"/>
    <rect x="42" y="26" width="36" height="62" rx="3" fill="#0E7C86"/>
    <circle cx="60" cy="93" r="2.6" fill="#F2A541"/>
  </g>
  <g stroke="#F2A541" stroke-width="5" stroke-linecap="round">
    <path d="M90 42c6 9 6 27 0 36"/><path d="M100 32c10 14 10 42 0 56"/>
  </g></svg>"""

WRENCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/></svg>'

def flyer():
    """Volante 4x6" para entregar en la mano: el mismo diseño de la placa (opción C), reducido; el espacio extra queda antes del QR."""
    z = 4.25 / 5.25
    return plate(nfc=False, v="c").replace('<div class="pg plate vc">', f'<div class="pg plate vc flyer" style="zoom:{z:.4f};height:{6.25 / z:.3f}in">', 1)

def plate(nfc=True, v="a"):
    # la placa es bilingüe: sin lang, así la página sale en el idioma del teléfono
    # nfc=False: sin el círculo "Tap here" (para imprimir antes de tener las etiquetas NFC); el QR queda solo y más grande
    # v: cómo va mecánica  a) en el texto + etiqueta mango  b) solo en el texto  c) etiqueta mango al lado de recojo gratis
    url = f"https://{a.domain}/go/" + (f"?z={a.zone}" if a.zone else "")
    tap = f'<div class="col"><div class="tap">{PHONE_SVG}</div><b>Tap here</b><span>Hold your phone here</span></div>' if nfc else ""
    sub = "Home, tech, social media and paperwork." if v == "c" else "Home, tech, auto repair, social media and paperwork."
    auto = f'<p class="pill auto">{WRENCH}Auto repair &middot; 20% off labor</p>'
    pills = {"a": f'<p class="pill">Free pickup &middot; Recojo gratis</p><br>{auto}',
             "b": '<p class="pill">Free pickup &middot; Recojo gratis</p>',
             "c": f'<p class="new">{WRENCH}New: auto repair &middot; 20% off labor</p><p class="pill">Free pickup &middot; Recojo gratis</p>'}[v]
    return f'''<div class="pg plate v{v}"><div class="tx">
      <div class="logo">{logo_white()}</div><h1>Need a hand?<br>We&#39;ve got you.</h1><h2>{sub}</h2>
      {pills}
      <p class="ph">(205) 490-8033</p><p class="phs">Call or text &middot; Llama o escribe &middot; Se habla espa&ntilde;ol</p></div>
      <div class="duo{'' if nfc else ' solo'}">
        <div class="col"><div class="qrbig">{qr(url)}</div><b>Scan</b><span>Open your camera</span></div>
        {tap}
      </div></div>'''

def render(pages, size, path):
    html = f"<html><head><meta charset='utf-8'><style>{CSS}@page{{size:{size};margin:0}}</style></head><body>{''.join(pages)}</body></html>"
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page()
        pg.set_content(html, wait_until="networkidle"); pg.wait_for_timeout(800)
        pg.pdf(path=path, print_background=True, prefer_css_page_size=True)
        b.close()
    print("OK", path)

def render_png(page, w_in, h_in, path, dpi=600):
    """PNG de alta resolución (por defecto 600 dpi) del mismo diseño, para imprimir en cualquier tienda."""
    html = f"<html><head><meta charset='utf-8'><style>{CSS}</style></head><body>{page}</body></html>"
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": round(w_in * 96), "height": round(h_in * 96)}, device_scale_factor=dpi / 96)
        pg.set_content(html, wait_until="networkidle"); pg.wait_for_timeout(800)
        pg.screenshot(path=path, clip={"x": 0, "y": 0, "width": w_in * 96, "height": h_in * 96})
        b.close()
    print("OK", path)

os.makedirs(a.out, exist_ok=True)
suf = f"-{a.zone}" if a.zone else ""
if a.hoja4doc:   # "Document Printing" (impresora láser con borde blanco): 4 volantes con margen blanco parejo; 2 cortes en cruz
    z = 5.0 / 7.25
    one = plate(nfc=False, v="c").replace('<div class="pg plate vc">', f'<div class="pg plate vc" style="zoom:{z:.4f};width:{3.75 / z:.3f}in;height:7.25in">', 1)
    cell = f'<div style="width:4.25in;height:5.5in;padding:.25in;box-sizing:border-box;background:#fff"><div style="width:3.75in;height:5in;overflow:hidden">{one}</div></div>'
    marks = ('<div style="position:absolute;left:4.25in;top:0;height:.18in;border-left:.5pt solid #B8C0CC"></div>'
             '<div style="position:absolute;left:4.25in;bottom:0;height:.18in;border-left:.5pt solid #B8C0CC"></div>'
             '<div style="position:absolute;top:5.5in;left:0;width:.18in;border-top:.5pt solid #B8C0CC"></div>'
             '<div style="position:absolute;top:5.5in;right:0;width:.18in;border-top:.5pt solid #B8C0CC"></div>')
    sheet = f'<div style="width:8.5in;height:11in;position:relative;display:grid;grid-template-columns:4.25in 4.25in;background:#fff">{cell * 4}{marks}</div>'
    render([sheet], "8.5in 11in", os.path.join(a.out, f"Fix-and-Go-volantes-documento{suf}.pdf"))
    render_png(sheet, 8.5, 11, os.path.join(a.out, f"Fix-and-Go-volantes-documento{suf}.png"), dpi=300)
    raise SystemExit
if a.hoja4:   # hoja carta 8.5x11 con 4 volantes de 4.25x5.5" (para "Business Flyer" de Walgreens); se corta en cruz
    z = 5.5 / 7.25
    one = plate(nfc=False, v="c").replace('<div class="pg plate vc">', f'<div class="pg plate vc" style="zoom:{z:.4f};width:{4.25 / z:.3f}in;height:7.25in">', 1)
    cell = f'<div style="width:4.25in;height:5.5in;overflow:hidden">{one}</div>'
    sheet = f'<div style="width:8.5in;height:11in;display:grid;grid-template-columns:4.25in 4.25in">{cell * 4}</div>'
    png = os.path.join(a.out, f"volantes-4-por-hoja-carta{suf}.png")
    render_png(sheet, 8.5, 11, png, dpi=300)
    from PIL import Image
    Image.open(png).convert("RGB").save(png[:-4] + ".jpg", quality=95, dpi=(300, 300))
    print("OK", png[:-4] + ".jpg")
    raise SystemExit
if a.volante:   # volante 4x6" (con 1/8" de sangrado) + hoja carta con 2 volantes para imprimir en casa
    render_png(flyer(), 4.25, 6.25, os.path.join(a.out, f"volante-4x6{suf}.png"))
    one = flyer()
    sheet = f'''<div style="width:8.5in;height:11in;background:#fff;position:relative">
      <div style="position:absolute;left:.25in;top:2.5in;width:8in;height:6in;display:flex;overflow:hidden">
        <div style="width:4in;height:6in;overflow:hidden;position:relative"><div style="position:absolute;left:-.125in;top:-.125in">{one}</div></div>
        <div style="width:4in;height:6in;overflow:hidden;position:relative"><div style="position:absolute;left:-.125in;top:-.125in">{one}</div></div>
      </div>
      <div style="position:absolute;left:4.25in;top:2.2in;height:6.6in;border-left:1px dashed #9AA5B5"></div>
      <div style="position:absolute;left:.1in;right:.1in;top:2.5in;border-top:1px dashed #9AA5B5"></div>
      <div style="position:absolute;left:.1in;right:.1in;top:8.5in;border-top:1px dashed #9AA5B5"></div>
      <div style="position:absolute;left:.25in;top:2.2in;height:6.6in;border-left:1px dashed #9AA5B5"></div>
      <div style="position:absolute;left:8.25in;top:2.2in;height:6.6in;border-left:1px dashed #9AA5B5"></div>
      <p style="position:absolute;left:0;right:0;top:9in;text-align:center;font-size:9pt;color:#9AA5B5">Corta por las líneas · 2 volantes de 4x6"</p></div>'''
    render_png(sheet, 8.5, 11, os.path.join(a.out, f"volantes-hoja-carta{suf}.png"), dpi=300)
    raise SystemExit
if a.placa_sin_nfc:   # solo la placa del carro, sin la parte NFC ("Tap here"), en las 3 opciones de mecánica
    for v in a.opciones:
        render_png(plate(nfc=False, v=v), 5.25, 7.25, os.path.join(a.out, f"placa-carro-sin-nfc-{v}{suf}.png"))
    raise SystemExit
for lang in ("en", "es"):
    render([front_general(lang), back(lang)], "3.625in 2.125in", os.path.join(a.out, f"tarjeta-{lang}{suf}.pdf"))
render([plate()], "5.25in 7.25in", os.path.join(a.out, f"placa-carro{suf}.pdf"))
