#!/usr/bin/env python3
"""
Genera contacto.vcf (la tarjeta de contacto de Fix & Go que el cliente guarda en su teléfono con un toque).
Uso: python3 tarjetas/build_vcard.py      -> escribe contacto.vcf en la raíz del sitio
La dirección es solo la ciudad: nunca la dirección de la casa.
"""
import base64, os

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
PHONE = "+12054908033"

with open(os.path.join(ROOT, "logo", "apple-touch-icon.png"), "rb") as f:
    photo = base64.b64encode(f.read()).decode()

lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "N:;Fix & Go;;;",
    "FN:Fix & Go",
    "ORG:Fix & Go",
    f"TEL;TYPE=CELL,VOICE,pref:{PHONE}",
    "EMAIL;TYPE=INTERNET,WORK:info@fixandgopro.com",
    "URL:https://fixandgopro.com",
    "ADR;TYPE=WORK:;;;Birmingham;AL;;USA",
    "NOTE:Home\\, tech\\, auto repair\\, social media and paperwork. English & Spanish. / "
    "Casa\\, tecnología\\, mecánica\\, redes sociales y trámites. Español e inglés.",
    f"PHOTO;ENCODING=b;TYPE=PNG:{photo}",
    "END:VCARD",
]

def fold(line):
    """vCard: líneas de máximo 75 bytes; las largas siguen en la línea de abajo empezando con un espacio."""
    out, cur = [], b""
    for ch in line:
        c = ch.encode("utf-8")
        if len(cur) + len(c) > (75 if not out else 74):
            out.append(cur); cur = b""
        cur += c
    out.append(cur)
    return b"\r\n ".join(out)

data = b"\r\n".join(fold(l) for l in lines) + b"\r\n"
with open(os.path.join(ROOT, "contacto.vcf"), "wb") as f:
    f.write(data)
print("OK contacto.vcf", len(data), "bytes")
