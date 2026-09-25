#!/usr/bin/env python3
"""
Genera tarjetas de presentación (3.5x2" con sangrado) y la placa del carro (5x7") en PDF.
Uso:
  pip install "qrcode[pil]" playwright && playwright install chromium
  python3 tarjetas/build_cards.py --domain fixandgopro.com --phone 2055550000 [--zone atl] --out print
Los logos se leen de logo/ en la raíz del repo.
"""
import argparse, io, os
import qrcode, qrcode.image.svg
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser()
ap.add_argument("--domain", default="fixandgopro.com")
ap.add_argument("--phone", default="2055550000", help="10 dígitos, sin +1")
ap.add_argument("--name", default="", help="nombre en el reverso; vacío = solo la marca Fix & Go")
ap.add_argument("--zone", default="", help="atl para tarjetas de Chamblee/Atlanta")
ap.add_argument("--out", default=".")
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
  "casa":   {"en": ("TV mounting, cameras & ceiling fans", "Lights, furniture, Wi-Fi. Same week."),
             "es": ("TV en la pared, cámaras y ventiladores", "Lámparas, muebles y WiFi. Esta misma semana.")},
  "tech":   {"en": ("PS5, PC & controller repair", "Slow, loud or dead? Fixed fast."),
             "es": ("Reparamos PS5, PC y controles", "¿Lento, ruidoso o no prende? Lo arreglamos.")},
  "negocio":{"en": ("More customers for your business", "Google Maps, ads, websites and AI."),
             "es": ("Más clientes para tu negocio", "Google Maps, anuncios, web e IA.")},
  "viajes": {"en": ("Rides to Atlanta & the airport", "We drive you, wait and bring you back."),
             "es": ("Te llevamos, te esperamos y te traemos", "Atlanta, aeropuerto y citas médicas.")},
}
BACK = {"en": ("Text or call", "English and Spanish"), "es": ("Escríbenos o llámanos", "Español e inglés")}
TAG = {"en": "Home · Tech · Paperwork · Rides", "es": "Casa · Tecnología · Trámites · Viajes"}

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
.gen h1{font-size:14.5pt}
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
.plate h1{font-weight:800;font-size:36pt;line-height:.95;letter-spacing:-.03em;max-width:3.1in}
.plate h2{font-weight:500;font-size:17pt;margin-top:.12in;opacity:.95}
.plate .sv{font-size:13pt;margin-top:.22in;line-height:1.45;max-width:4.2in}
.duo{position:absolute;left:.45in;right:.45in;bottom:.5in;display:flex;gap:.3in;z-index:1}
.col{flex:1;text-align:center}
.col b{display:block;font-family:'Bricolage Grotesque',Arial;font-size:18pt;line-height:1;margin-top:.14in}
.col span{display:block;font-size:9.5pt;margin-top:.05in;opacity:.95}
.qrbig{background:#fff;border-radius:.18in;padding:.16in;aspect-ratio:1}
.qrbig svg{width:100%;height:100%;display:block}
.tap{aspect-ratio:1;border-radius:50%;background:#fff;border:.07in dashed var(--mango);padding:.28in}
"""

NFC = '<svg class="nfc" viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"><path d="M14 16c3 4.5 3 11.5 0 16"/><path d="M22 11c5 7.5 5 18.5 0 26"/><path d="M30 6c7 10.5 7 25.5 0 36"/></svg>'

def front(k, lang):
    h, s = CARDS[k][lang]
    url = f"https://{a.domain}/?s={k}&lang={lang}{Z}"
    scan = "Escanea" if lang == "es" else "Scan me"
    return f'''<div class="pg card front"><div class="tx"><h1>{h}</h1><p>{s}</p></div>
      <div class="ar">{AREA[lang]}</div>
      <div class="qrbox">{qr(url)}<span>{scan}</span></div></div>'''

GEN = {
  "en": ("We mount it, fix it, and drive you.",
         ["TV mounting and security cameras", "PS5, PC and Apple repair", "More customers for your business", "Rides to Atlanta and the airport"]),
  "es": ("Lo instalamos, lo arreglamos y te llevamos.",
         ["TV en la pared y cámaras", "Reparamos PS5, PC y Apple", "Más clientes para tu negocio", "Viajes a Atlanta y al aeropuerto"]),
}

def front_general(lang):
    h, items = GEN[lang]
    url = f"https://{a.domain}/?lang={lang}{Z}"
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

def plate():
    url = f"https://{a.domain}/?lang=en{Z}"
    return f'''<div class="pg plate"><div class="tx">
      <div class="logo">{logo_white()}</div><h1>Need a hand at home?</h1><h2>¿Necesitas una mano en casa?</h2>
      <p class="sv">TV mounting, cameras, ceiling fans, PS5 and PC repair, rides to Atlanta.</p></div>
      <div class="duo">
        <div class="col"><div class="qrbig">{qr(url)}</div><b>Scan</b><span>Escanea con la cámara</span></div>
        <div class="col"><div class="tap">{PHONE_SVG}</div><b>Tap here</b><span>Acerca tu teléfono aquí</span></div>
      </div></div>'''

def render(pages, size, path):
    html = f"<html><head><meta charset='utf-8'><style>{CSS}@page{{size:{size};margin:0}}</style></head><body>{''.join(pages)}</body></html>"
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page()
        pg.set_content(html, wait_until="networkidle"); pg.wait_for_timeout(800)
        pg.pdf(path=path, print_background=True, prefer_css_page_size=True)
        b.close()
    print("OK", path)

os.makedirs(a.out, exist_ok=True)
suf = f"-{a.zone}" if a.zone else ""
for lang in ("en", "es"):
    render([front_general(lang), back(lang)], "3.625in 2.125in", os.path.join(a.out, f"tarjeta-{lang}{suf}.pdf"))
render([plate()], "5.25in 7.25in", os.path.join(a.out, f"placa-carro{suf}.pdf"))
