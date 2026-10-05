/* =====================================================================
   Fix & Go — configuración y servicios COMPARTIDOS
   Lo usan la página principal (/index.html) y la página del QR (/go/index.html).
   Cambia aquí el teléfono, el correo o los servicios y se actualizan las dos.
   ===================================================================== */
/* ================= CONFIGURA AQUÍ ================= */
const CONFIG = {
  PHONE:    "12054908033",   // tu número con código de país, sin + ni espacios
  FB_PAGE:  "61594526717885",            // usuario de tu página de Facebook (m.me/usuario). Vacío = sin botón Messenger
  EMAIL:    "info@fixandgopro.com",   // correo de empresa (Cloudflare Email Routing → tu Gmail)
  ENDPOINT: "https://script.google.com/macros/s/AKfycbzCaTUIxOX9CNWUhCMA24Jal9Y65akvUR0h-pwQyxJvgz2Zsl26u6KgsOQGvXKe-l9zEw/exec"               // URL de la App web de Apps Script (fixandgo-backend.gs). Vacío = sin notas de voz
};
const ZONES = {
  bham:{ area:"Birmingham, AL", note:null },
  atl: { area:"Chamblee, Doraville y Atlanta",
         note:{ es:"Estamos en Chamblee y Doraville los fines de semana. Déjanos tu mensaje y aparta tu día.",
                en:"We're in Chamblee and Doraville on weekends. Leave us a message to book your spot." } }
};
/* ================================================== */

const I = {
  tv:'<rect x="3" y="4.5" width="18" height="12.5" rx="2"/><path d="M8 21h8M12 17v4"/>',
  cam:'<rect x="2.5" y="7" width="13" height="10" rx="2.5"/><path d="M15.5 10.5 21 7.5v9l-5.5-3"/>',
  bell:'<rect x="7" y="2" width="10" height="20" rx="5"/><circle cx="12" cy="9" r="2.5"/><path d="M12 15.5v1"/>',
  fan:'<circle cx="12" cy="12" r="1.6"/><path d="M12 10.4C10.6 6.2 11.6 3 14.3 3c2.6 0 2.8 4-.7 8.3"/><path d="M13.5 12.7c4 1.7 5.4 4.8 3.5 6.5-1.9 1.8-4.8-.7-5.3-6"/><path d="M10.5 12.6c-4.3 1.2-7.4.2-7.3-2.5.1-2.6 4-2.9 7.6.6"/>',
  bulb:'<path d="M9 18h6M10 21.5h4"/><path d="M12 2.5a6.5 6.5 0 0 0-3.8 11.8c.6.5 1 1.3 1 2.2V17h5.6v-.5c0-.9.4-1.7 1-2.2A6.5 6.5 0 0 0 12 2.5z"/>',
  sofa:'<path d="M4.5 11V8.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3V11"/><path d="M2.5 13.2a2 2 0 0 1 4 0V15h11v-1.8a2 2 0 0 1 4 0V17a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2z"/><path d="M5.5 19v2M18.5 19v2"/>',
  frame:'<rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="m3 16 5-5 4 4 3-3 6 6"/><circle cx="15.5" cy="8.5" r="1.5"/>',
  wifi:'<path d="M2 8.8a15 15 0 0 1 20 0M5 12.3a10 10 0 0 1 14 0M8.5 15.8a5 5 0 0 1 7 0"/><circle cx="12" cy="19.3" r="1"/>',
  home:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  shield:'<path d="M12 2.5 19.5 5.5v5.8c0 4.7-3.2 8.6-7.5 10.2-4.3-1.6-7.5-5.5-7.5-10.2V5.5z"/><path d="m9 12 2 2 4-4"/>',
  laptop:'<rect x="4" y="4" width="16" height="11" rx="1.8"/><path d="M2 19h20"/>',
  gamepad:'<path d="M7 7.5h10a5 5 0 0 1 5 5v1.8a3.7 3.7 0 0 1-6.7 2.2L14 14.8h-4l-1.3 1.7A3.7 3.7 0 0 1 2 14.3v-1.8a5 5 0 0 1 5-5z"/><path d="M7.5 10.5v3.5M5.8 12.2h3.5"/><circle cx="15.5" cy="11" r=".9"/><circle cx="17.8" cy="13.2" r=".9"/>',
  joy:'<circle cx="12" cy="7" r="4"/><path d="M12 11v5"/><rect x="4.5" y="16" width="15" height="5" rx="2.2"/>',
  lock:'<rect x="4.5" y="10.5" width="15" height="10.5" rx="2.2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><path d="M12 14.5v2.5"/>',
  phone:'<rect x="7" y="2" width="10" height="20" rx="2.6"/><path d="M11 18h2"/>',
  bolt:'<path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12z"/>',
  db:'<ellipse cx="12" cy="5.5" rx="7.5" ry="3"/><path d="M4.5 5.5v13c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-13"/><path d="M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3"/>',
  bug:'<rect x="8" y="7" width="8" height="13" rx="4"/><path d="M12 7V4.5M9.5 3.5 10.8 7M14.5 3.5 13.2 7M3.5 11H8M16 11h4.5M3.5 17H8M16 17h4.5"/>',
  tablet:'<rect x="4" y="2" width="16" height="20" rx="2.5"/><path d="M11 18h2"/>',
  headset:'<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="2.5" y="13" width="4" height="6" rx="1.6"/><rect x="17.5" y="13" width="4" height="6" rx="1.6"/><path d="M19.5 19c0 1.6-2 2.8-5 2.8H13"/>',
  cpu:'<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5" rx=".8"/><path d="M9 2.5V6M15 2.5V6M9 18v3.5M15 18v3.5M2.5 9H6M2.5 15H6M18 9h3.5M18 15h3.5"/>',
  pin:'<path d="M12 21.5s7-6 7-11.8a7 7 0 0 0-14 0c0 5.8 7 11.8 7 11.8z"/><circle cx="12" cy="9.7" r="2.6"/>',
  mega:'<path d="M3 10.2v3.6a1 1 0 0 0 1 1h2.5L15 20V4L6.5 9.2H4a1 1 0 0 0-1 1z"/><path d="M18.5 9a4 4 0 0 1 0 6"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.4 2.6 3.7 5.6 3.7 9s-1.3 6.4-3.7 9c-2.4-2.6-3.7-5.6-3.7-9S9.6 5.6 12 3z"/>',
  bot:'<rect x="4" y="8" width="16" height="12" rx="3.2"/><path d="M12 8V4.5"/><circle cx="12" cy="3.5" r="1"/><circle cx="9" cy="14" r="1.2"/><circle cx="15" cy="14" r="1.2"/><path d="M2 13v3M22 13v3"/>',
  share:'<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="m8.2 10.8 7.6-4.1M8.2 13.2l7.6 4.1"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
  grid:'<rect x="3" y="3" width="7.5" height="7.5" rx="1.8"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.8"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.8"/><path d="M17.3 13.5V21M13.5 17.3H21"/>',
  cloud:'<path d="M7 19a4.8 4.8 0 0 1-.9-9.5A6 6 0 0 1 17.6 8a4.5 4.5 0 0 1-.1 11z"/>',
  car:'<path d="M4.5 16.5V12l1.8-4.4A2 2 0 0 1 8.2 6.3h7.6a2 2 0 0 1 1.9 1.3l1.8 4.4v4.5z"/><path d="M4.5 12h15"/><path d="M6.5 16.5v2M17.5 16.5v2"/><circle cx="8" cy="14.2" r=".8"/><circle cx="16" cy="14.2" r=".8"/>',
  plane:'<path d="M21 15.5v-2l-8-5V3.8a1.5 1.5 0 0 0-3 0v4.7l-8 5v2l8-2.5v5l-2 1.5V21l3.5-1 3.5 1v-1.5l-2-1.5v-5z"/>',
  heart:'<path d="M20.4 5.6a5.2 5.2 0 0 0-7.4 0L12 6.6l-1-1a5.2 5.2 0 0 0-7.4 7.4L12 21.4l8.4-8.4a5.2 5.2 0 0 0 0-7.4z"/><path d="M3.6 12h3.9l1.8-2.8 2.8 5.3 1.9-2.5h6.4"/>',
  translate:'<path d="M3.5 5h9M8 3v2M5.5 5c.6 3 2.6 5.4 5 6.8M10.5 5c-.7 3.3-3 6-6 7.5"/><path d="m13 21 4-9 4 9M14.4 18h5.2"/>',
  repeat:'<path d="m17 2 3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12"/><path d="m7 22-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/>',
  bag:'<path d="M5 8h14l-1.1 13H6.1z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
  mac:'<rect x="3" y="3.5" width="18" height="12.5" rx="2"/><path d="M9.5 20.5h5M12 16v4.5"/><path d="M13 7.3c-.5-.2-1 .1-1 .1s-.5-.3-1-.1c-.9.3-1.2 1.4-.8 2.5.3.8.9 1.5 1.3 1.4.2 0 .3-.1.5-.1s.3.1.5.1c.4 0 1-.6 1.3-1.4.4-1.1.1-2.2-.8-2.5zM12 7.4c0-.5.3-1 .8-1.1"/>',
  ig:'<rect x="3" y="3" width="18" height="18" rx="5.5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none"/>',
  fbk:'<rect x="3" y="3" width="18" height="18" rx="5.5"/><path d="M15.5 7.5h-1.8a2.2 2.2 0 0 0-2.2 2.2V21M9 12.5h5.5"/>',
  tiktok:'<path d="M14 3v11.8a3.8 3.8 0 1 1-3.8-3.8"/><path d="M14 3c.4 2.6 2.2 4.4 5 4.6"/>',
  yt:'<rect x="2.5" y="5" width="19" height="14" rx="4.5"/><path d="m10 9 5 3-5 3z" fill="currentColor"/>',
  gg:'<path d="M20.5 12.2c0 4.8-3.4 8.3-8.5 8.3a8.5 8.5 0 1 1 5.8-14.7"/><path d="M12.5 12h8"/>',
  li:'<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M7.8 10.5V17M7.8 7.3v.1M11.5 17v-6.5M11.5 13.3a2.6 2.6 0 0 1 5.2 0V17"/>',
  xx:'<path d="M4 4l16 16M20 4 4 20"/>',
  th:'<path d="M16.5 10.5c-.5-3-2.4-4.5-4.8-4.5-3.3 0-5.2 2.6-5.2 6s1.8 6 5.4 6c2.6 0 4.9-1.5 4.9-4 0-2.3-2-3.3-4.3-3.3-1.8 0-3 .9-3 2.2 0 1.2 1 2 2.3 2 2.4 0 3.1-2.2 2.7-5.2"/>',
  trend:'<path d="m3 17 6-6 4 4 8-8"/><path d="M14.5 7H21v6.5"/>',
  down:'<path d="m6 9 6 6 6-6"/>', right:'<path d="m9 6 6 6-6 6"/>', close:'<path d="M6 6l12 12M18 6 6 18"/>',
  mic:'<rect x="9" y="2.5" width="6" height="12" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  stop:'<rect x="7" y="7" width="10" height="10" rx="2.2" fill="currentColor"/>',
  pen:'<path d="M4 20h4L19.5 8.5a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  call:'<path d="M5 3h3.6l2 5-2.5 1.6a11 11 0 0 0 6.3 6.3L16 13.4l5 2V19a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
  msg:'<path d="M20.5 12a8.5 8.5 0 0 1-12.2 7.6L3.5 21l1.4-4.6A8.5 8.5 0 1 1 20.5 12z"/>',
  sms:'<path d="M4 4.5h16a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H9l-4.5 3.5v-3.5H4A1.5 1.5 0 0 1 2.5 16V6A1.5 1.5 0 0 1 4 4.5z"/><path d="M7 10h.01M12 10h.01M17 10h.01"/>',
  fb:'<path d="M12 2.5C6.6 2.5 2.5 6.4 2.5 11.4c0 2.7 1.2 5 3.2 6.6v3.5l3.1-1.7c1 .3 2.1.4 3.2.4 5.4 0 9.5-3.9 9.5-8.8S17.4 2.5 12 2.5z"/><path d="m6.5 13.5 3.5-3.7 2.4 2.1 3.6-2.2-3.5 3.8-2.4-2.1z"/>',
  wa:'<path d="M3.5 20.5 5 16a8.5 8.5 0 1 1 3.3 3.3z"/><path d="M9 8.5c0 3.5 2.9 6.5 6.5 6.5l1-1.6-2-1-1 .8a4.3 4.3 0 0 1-2.2-2.2l.8-1-1-2z"/>',
  check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  mail:'<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
  receipt:'<path d="M5.5 2.5h13v19l-2.2-1.5-2.1 1.5-2.2-1.5-2.2 1.5-2.1-1.5-2.2 1.5z"/><path d="M9 7.5h6M9 11h6M9 14.5h4"/>',
  box:'<path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7z"/><path d="M3.5 7 12 11.5 20.5 7M12 11.5v10M7.8 4.8l8.4 4.5"/>',
  file:'<path d="M14 2.5H7A2.5 2.5 0 0 0 4.5 5v14A2.5 2.5 0 0 0 7 21.5h10a2.5 2.5 0 0 0 2.5-2.5V8z"/><path d="M14 2.5V8h5.5M8.5 13h7M8.5 17h5"/>',
  card:'<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6.5 15h4"/>',
  form:'<rect x="4.5" y="3.5" width="15" height="18" rx="2.2"/><path d="M9 2.5h6v3H9zM8.5 11l1.5 1.5 3-3M8.5 16.5h7"/>',
  wrench:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
  brake:'<circle cx="11" cy="13" r="8"/><circle cx="11" cy="13" r="2.4"/><path d="M14.5 3.3a10.5 10.5 0 0 1 6.2 6.2l-3 1.1a7.3 7.3 0 0 0-4.3-4.3z"/>',
  battery:'<rect x="3" y="7.5" width="18" height="12" rx="2"/><path d="M6.5 7.5V5h3.5v2.5M14 7.5V5h3.5v2.5M6.5 13.5h4M14 13.5h4M16 11.5v4"/>',
  key:'<circle cx="7.5" cy="16.5" r="4"/><path d="m10.4 13.6 9.6-9.6M16.5 7.5l2.5 2.5M19 5l2 2"/>',
  plug:'<path d="M12 2v2.5M9.5 4.5h5v4h-5zM8.5 8.5h7l-1 6h-5zM10.5 14.5h3v4h-3zM12 18.5V22"/>',
  snow:'<path d="M12 2.5v19M3.8 7.2l16.4 9.6M20.2 7.2 3.8 16.8"/><path d="m9.5 4 2.5 2.5L14.5 4M9.5 20l2.5-2.5 2.5 2.5"/>',
  belt:'<circle cx="7" cy="8" r="3.5"/><circle cx="16.5" cy="15.5" r="4.5"/><path d="M4.4 10.4l8.9 8.4M9.6 5.6l10.1 6.7"/>',
  oil:'<path d="M12 3s-5.5 6.2-5.5 10.5a5.5 5.5 0 0 0 11 0C17.5 9.2 12 3 12 3z"/><path d="M9.5 14a2.5 2.5 0 0 0 2.5 2.5"/>',
  gauge:'<path d="M3.5 17.5a9 9 0 1 1 17 0"/><path d="m12 15 4-5"/><circle cx="12" cy="15" r="1.3"/>',
  cal:'<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M8 14h2M14 14h2M8 17.5h2"/>',
  addc:'<circle cx="9.5" cy="8" r="3.8"/><path d="M2.5 20.5a7 7 0 0 1 14 0"/><path d="M19 8v6M16 11h6"/>',
  wall:'<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M3 9.5h18M3 15h18M9 4v5.5M15 9.5V15M9 15v5"/>',
  drop:'<path d="M3 4h18"/><path d="M12 8s-4.2 4.6-4.2 7.6a4.2 4.2 0 0 0 8.4 0C16.2 12.6 12 8 12 8z"/>',
  crack:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m10.5 3 2 5-3 4 4 4-2 5"/>',
  studs:'<path d="M4 21V3M12 21V3M20 21V3M3 7h18M3 17h18"/>',
  radiator:'<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M7.5 6v13M12 6v13M16.5 6v13M9 3h6"/>',
  shocks:'<path d="M12 2v3M12 19v3"/><path d="M7.5 5h9l-9 2.8h9l-9 2.8h9l-9 2.8h9l-9 2.8h9"/>'
};
const ico = (k, c="") => `<svg class="i ${c}" viewBox="0 0 24 24" aria-hidden="true">${I[k]||I.msg}</svg>`;
const CAT_ICON = {tech:"laptop", seg:"cam", negocio:"share", casa:"home", tramites:"file"};


/* Orden de las categorías según el idioma. En inglés solo lo que dominamos (tecnología, seguridad y web);
   en español se muestra todo. Una categoría con only:"es" no sale en inglés. */
const ORDER = {
  es:["tech","seg","negocio","casa","tramites"],
  en:["tech","seg","negocio"]
};
const catsFor = l => (ORDER[l] || ORDER.es).filter(k => S[k] && (!S[k].only || S[k].only === l));

/* Lo más pedido: accesos directos que salen primero (categoría, ícono del servicio, nombre corto), por idioma. */
const HOT = {
  es:[
    ["tech","headset","Soporte en línea −20%"],
    ["tech","laptop","PC lenta o no prende"],
    ["seg","cam","Cámaras de seguridad"],
    ["seg","pin","GPS para tu carro"],
    ["tech","wrench","Tarjeta madre"],
    ["tech","gamepad","PS5 y consolas"],
    ["tech","phone","iPhone y Android"],
    ["negocio","globe","Página web"],
    ["negocio","share","Redes sociales"],
    ["tech","mac","Mac"],
    ["tech","lock","Cuenta hackeada"],
    ["casa","wall","Drywall"],
    ["tramites","receipt","Taxes"]
  ],
  en:[
    ["tech","headset","Online support −20%"],
    ["tech","laptop","PC won't turn on"],
    ["seg","cam","Security cameras"],
    ["seg","pin","GPS tracker"],
    ["tech","wrench","Motherboard repair"],
    ["tech","gamepad","PS5 & consoles"],
    ["tech","phone","iPhone & Android"],
    ["negocio","globe","Website"],
    ["negocio","share","Social media"],
    ["tech","mac","Mac tune-up"],
    ["tech","lock","Hacked account"],
    ["tech","cpu","Custom PC build"]
  ]
};
/* Precios "desde" (USD): ~30% por debajo del mercado de Birmingham. Número = por trabajo; [n,"mo"] = por mes. Sin entrada = sin precio.
   Cambia un número aquí y se actualiza en todas las páginas. */
const PRICE = {
  "tech:phone":39, "tech:gamepad":59, "tech:laptop":55, "tech:mac":55, "tech:lock":69, "tech:mail":45, "tech:db":79,
  "tech:shield":49, "tech:bug":65, "tech:joy":45, "tech:bolt":45, "tech:headset":39, "tech:cpu":99, "tech:wrench":79, "tech:cloud":99,
  "tramites:receipt":99, "tramites:file":149, "tramites:card":15, "tramites:form":25,
  "negocio:share":[299,"mo"], "negocio:pen":149, "negocio:trend":199, "negocio:mega":[199,"mo"], "negocio:globe":299,
  "negocio:pin":99, "negocio:search":149, "negocio:bot":149, "negocio:shield":99,
  "seg:cam":59, "seg:bell":49, "seg:wifi":59, "seg:shield":49, "seg:home":69, "seg:lock":59, "seg:pin":79, "seg:key":99, "seg:car":49,
  "casa:tv":99, "casa:sofa":45, "casa:frame":35
};
const priceOf = (k, ic, lang) => {
  const v = PRICE[k + ":" + ic]; if (v == null) return "";
  const [n, u] = Array.isArray(v) ? v : [v, ""];
  return (lang === "en" ? "From $" : "Desde $") + n + (u === "mo" ? (lang === "en" ? "/mo" : "/mes") : "");
};
const hotIndex = (k, ic) => S[k].items.findIndex(x => x[0] === ic);

const S = {
  tech:{
    promoItem:"headset",   // el aviso de la oferta abre directo este servicio
    es:{t:"¿No prende, está lenta o se calienta? La arreglamos", d:"Laptops, PCs, consolas y celulares: reparamos hasta la tarjeta madre. Y soporte en línea para Windows, Mac, Linux e iPhone, estés donde estés.", tile:"Reparación de laptops, PCs, consolas y celulares, y soporte en línea", promo:"20% de descuento en soporte en línea", promoTag:"Soporte en línea", promoSub:"Mac, Windows, Linux e iPhone, a distancia"},
    en:{t:"Won't turn on, slow or overheating? We fix it", d:"Laptops, PCs, game consoles and phones, down to board-level repair. Plus online support for Windows, Mac, Linux and iPhone, wherever you are.", tile:"Laptop, PC, console and phone repair, plus online support", promo:"20% off online tech support", promoTag:"Online tech support", promoSub:"Mac, Windows, Linux & iPhone, remotely"},
    items:[
      ["headset",{es:["Soporte técnico en línea: Windows, Mac, Linux e iPhone","Lo arreglamos a distancia, estés donde estés · 20% de descuento"],en:["Online tech support: Windows, Mac, Linux & iPhone","Fixed remotely, wherever you are · 20% off"],kw:"remoto online en linea distancia ayuda tecnologica soporte remote support help desk windows linux mac macos apple computadora laptop software programa instalar"}],
      ["laptop",{es:["Tu computadora no prende, está lenta o se calienta","Reparación, limpieza y mantenimiento profesional de laptops y PCs"],en:["Computer won't turn on, slow or overheating?","Professional repair, cleaning and maintenance for laptops and PCs"],kw:"pc laptop windows reparacion limpieza mantenimiento no prende lenta calienta repair computer maintenance"}],
      ["wrench",{es:["Tarjeta madre, tarjeta de video y memoria RAM","Diagnóstico y reparación a nivel de componentes"],en:["Motherboard, graphics card and RAM repair","Component-level diagnosis and repair"],kw:"motherboard board mainboard tarjeta madre placa video grafica gpu ram memoria soldadura componentes reparacion hardware"}],
      ["bolt",{es:["Repotenciamos tu computadora vieja","SSD, memoria RAM y tarjeta de video: velocidad de equipo nuevo sin comprar otro"],en:["Give your old PC a second life","SSD, RAM and graphics upgrades: new-PC speed without buying one"],kw:"repotenciar upgrade mejorar acelerar ssd ram vieja lenta rapida"}],
      ["cpu",{es:["Te armamos tu PC gamer o de trabajo","A tu medida y a tu presupuesto"],en:["Custom gaming or work PC build","Built to your needs and budget"],kw:"pc gamer armar build custom gaming trabajo workstation"}],
      ["cloud",{es:["Mantenimiento de servidores","Limpieza, revisión, discos, respaldos y mantenimiento profesional"],en:["Server maintenance","Cleaning, health checks, drives, backups and professional upkeep"],kw:"servidor server rack nas mantenimiento respaldo backup raid disco"}],
      ["gamepad",{es:["PS4, PS5, Xbox, Nintendo y Wii","Limpieza interna, pasta térmica, puerto HDMI y reparaciones"],en:["PS4, PS5, Xbox, Nintendo & Wii repair","Deep cleaning, thermal paste, HDMI port and more"],kw:"playstation consola xbox nintendo switch wii ps4 ps5 console hdmi"}],
      ["joy",{es:["Control que se mueve solo","Reparamos el drift, botones y batería"],en:["Controller moving on its own?","Stick drift, buttons and battery repair"]}],
      ["phone",{es:["Celulares Android e iPhone","Puerto de carga, pantalla, batería, fotos, iCloud y respaldo"],en:["Android & iPhone repair","Charge port, screen, battery, photos, iCloud and backup"],kw:"celular telefono android samsung apple ios pantalla bateria puerto carga charging port"}],
      ["mac",{es:["Tu Mac como nueva","Optimización, limpieza y actualización de macOS"],en:["Your Mac, like new","Tune-up, cleanup and macOS updates"],kw:"macbook imac apple optimizacion"}],
      ["db",{es:["Recuperamos tus fotos y archivos","De teléfonos, computadoras, discos y memorias USB"],en:["Get your photos and files back","From phones, computers, drives and USB sticks"],kw:"datos recuperar borrados perdidos data recovery disco"}],
      ["lock",{es:["¿Te hackearon Facebook, Instagram o WhatsApp?","Recuperamos la cuenta y la blindamos"],en:["Hacked Facebook, Instagram or WhatsApp?","We recover it and lock it down"],kw:"hackeo hackearon robaron cuenta seguridad hacked"}],
      ["mail",{es:["Recuperamos tu correo","Gmail, Outlook, iCloud o Yahoo: contraseña olvidada o cuenta robada"],en:["Get your email back","Gmail, Outlook, iCloud or Yahoo: forgotten password or stolen account"],kw:"correo email contraseña password recuperar gmail hotmail outlook"}],
      ["bug",{es:["Virus, anuncios raros y ventanas que se abren solas",""],en:["Viruses, pop-ups and weird ads, gone",""]}],
      ["shield",{es:["Ciberseguridad para tu familia y tu negocio","Contraseñas, verificación en dos pasos y cómo no caer en estafas"],en:["Cybersecurity for your family and business","Passwords, two-step verification and avoiding scams"],kw:"ciberseguridad estafa fraude phishing seguridad cybersecurity scam"}]
    ]
  },
  seg:{
    es:{t:"Cámaras, alarmas y GPS: tú lo ves todo", d:"Instalamos y configuramos cámaras, sistemas de seguridad en puertas y ventanas, y GPS para tu carro o tu flota. Lo ves todo desde tu teléfono.", tile:"Cámaras, alarmas en puertas y ventanas, GPS y WiFi seguro"},
    en:{t:"Cameras, alarms and GPS: see it all", d:"We install and set up cameras, door and window security, and GPS trackers for your car or fleet. Watch everything from your phone.", tile:"Cameras, door and window alarms, GPS and secure Wi-Fi"},
    items:[
      ["cam",{es:["Cámaras de seguridad y circuito cerrado","Ring, Wyze, Eufy o sistema con grabador (DVR/NVR), instalado y configurado"],en:["Security cameras and CCTV systems","Ring, Wyze, Eufy or wired DVR/NVR systems, installed and configured"],kw:"camaras camara seguridad cctv circuito cerrado dvr nvr vigilancia ring wyze eufy security camera surveillance"}],
      ["shield",{es:["Alarma en puertas y ventanas","Sensores, sirenas y avisos al teléfono"],en:["Door and window alarms","Sensors, sirens and phone alerts"],kw:"alarma sensor puerta ventana sirena seguridad alarm sensor door window siren"}],
      ["bell",{es:["Sabe quién toca antes de abrir","Timbre con video"],en:["Know who's at the door before you open","Video doorbells"],kw:"timbre video doorbell ring"}],
      ["lock",{es:["Cerraduras inteligentes","Abre con el teléfono o un código"],en:["Smart locks","Open with your phone or a code"],kw:"cerradura inteligente smart lock candado codigo"}],
      ["pin",{es:["Mira tu carro en vivo desde el teléfono","Instalamos el GPS y lo ves en una app, con avisos si se mueve"],en:["See your car live on your phone","We install a GPS tracker and you watch it in an app, with alerts"],kw:"gps rastreo rastreador localizador tracker tracking ubicacion robo seguridad app flota"}],
      ["key",{es:["GPS que apaga el motor","Corte de motor a distancia si roban el carro o dejan de pagar"],en:["GPS with engine shut-off","Cut the engine remotely if the car is stolen or payments stop"],kw:"gps apagar motor corte bloqueo inmovilizador kill switch engine cut stolen financiado"}],
      ["car",{es:["Geocerca: aviso si el carro sale de la zona","Tú defines el área y te avisamos al instante"],en:["Geofence alerts when the car leaves the area","You set the zone and get an instant alert"],kw:"geocerca geofence zona area aviso alerta flota empleados"}],
      ["wifi",{es:["WiFi que llega a todos los cuartos","Se acabaron los puntos muertos y tu red queda blindada"],en:["Wi-Fi in every room","No more dead spots, and your network locked down"],kw:"wifi router red internet senal mesh"}],
      ["home",{es:["Casa inteligente","Alexa, Google Home, luces y enchufes por voz"],en:["Smart home setup","Alexa, Google Home, voice-controlled lights"]}]
    ]
  },
  negocio:{
    es:{t:"Redes sociales, páginas web y sistemas a medida", d:"Community manager, contenido, anuncios, landing pages y sistemas hechos para tu negocio. Desde cero o para rescatarlo.", tile:"Redes sociales, landing pages, sistemas a medida y anuncios"},
    en:{t:"Social media, websites and custom systems", d:"Community management, content, ads, landing pages and custom software. From scratch or to relaunch your business.", tile:"Social media, landing pages, custom systems and ads"},
    items:[
      ["share",{es:["Manejamos tus redes: community manager","Publicamos, contestamos y hacemos crecer Instagram, Facebook y TikTok"],en:["We run your social media","We post, reply and grow your Instagram, Facebook and TikTok"],kw:"redes sociales social media community manager instagram facebook tiktok contenido reels posts seguidores followers"}],
      ["globe",{es:["Landing page o página web que vende","Con dominio, correo propio y lista para tus anuncios"],en:["Landing page or website that sells","Your own domain, business email, ready for ads"],kw:"landing page pagina web sitio website diseno design"}],
      ["grid",{es:["Un sistema hecho a la medida de tu negocio","Inventario, facturación, reservas, adiós a los papeles"],en:["Software built for your business","Inventory, invoicing, bookings, no more paper"],kw:"sistema a medida software custom inventario facturacion app"}],
      ["bot",{es:["Que tu WhatsApp conteste solo","Respuestas automáticas, citas y chatbots con IA"],en:["Your WhatsApp answers itself","AI auto-replies, bookings and chatbots"]}],
      ["mega",{es:["Anuncios en Facebook, Instagram y TikTok que traen mensajes","Meta Ads con presupuesto que tú controlas"],en:["Facebook, Instagram and TikTok ads that bring in messages","Ads on a budget you control"],kw:"publicidad anuncios ads promocion marketing"}],
      ["pen",{es:["Tu marca desde cero","Nombre, logo, colores y cómo hablarle a tus clientes"],en:["Your brand from scratch","Name, logo, colors and how you talk to customers"],kw:"branding logo identidad marca emprender diseno design"}],
      ["trend",{es:["Rescatamos tu negocio si bajaron las ventas","Vemos qué está fallando y relanzamos tu marca"],en:["Sales down? We relaunch your business","We find what's failing and relaunch your brand"],kw:"rescate relanzar recuperar ventas clientes"}],
      ["pin",{es:["Que te encuentren en Google Maps","Perfil de Google optimizado con fotos y reseñas"],en:["Get found on Google Maps","Optimized Google Business Profile, photos and reviews"]}],
      ["search",{es:["Google Ads para salir primero",""],en:["Google Ads to show up first",""]}],
      ["shield",{es:["Protege tu negocio de hackeos",""],en:["Protect your business from hackers",""]}]
    ]
  },
  casa:{
    only:"es",   // solo en español: en inglés nos enfocamos en tecnología, seguridad y web
    es:{t:"Arreglos para tu casa", d:"Reparación de drywall, TV, lámparas y muebles. Una visita y listo.", tile:"Drywall, TV, lámparas y muebles"},
    en:{t:"Home fixes", d:"Drywall repair, TVs, lights, furniture. One visit, done.", tile:"Drywall repair, TVs, lights and furniture"},
    items:[
      ["wall",{es:["¿Un hueco en la pared? Lo reparamos","Parche de drywall, igualamos la textura y queda listo para pintar"],en:["Hole in your wall? We'll patch it","Drywall patching and texture matching, ready to paint"],kw:"drywall pared hueco hoyo agujero parche yeso sheetrock tablaroca tabla roca wall hole patch patching repair texture"}],
      ["drop",{es:["Techo o pared con daño de agua","Cambiamos el drywall dañado y lo dejamos como nuevo"],en:["Water-damaged ceiling or wall","We replace the damaged drywall so it looks like new"],kw:"techo cielo raso goteo gotera mancha agua humedad ceiling water damage stain leak drywall sheetrock"}],
      ["crack",{es:["Grietas en paredes y techos","Grietas, esquinas golpeadas y clavos que se salen"],en:["Cracks in walls and ceilings","Cracks, dented corners and nail pops"],kw:"grieta fisura rajadura esquina clavo crack cracks corner bead nail pop drywall sheetrock"}],
      ["studs",{es:["Paredes sencillas de drywall","Divisiones, cerrar un hueco o un closet"],en:["Simple drywall walls","Partition walls, closing an opening or a closet"],kw:"pared nueva division tabique armar drywall sheetrock partition wall framing closet"}],
      ["tv",{es:["Tu TV en la pared, derechito","Cables escondidos y soundbar incluidos"],en:["TV mounted on the wall, perfectly level","Hidden cables and soundbar setup"]}],
      ["fan",{es:["Ventilador de techo nuevo, instalado hoy",""],en:["New ceiling fan, installed today",""]}],
      ["bulb",{es:["Lámparas y luces que por fin se ven bien","Cambio de lámparas, LED y dimmers"],en:["Lights that finally look right","Fixture swaps, LED upgrades and dimmers"]}],
      ["sofa",{es:["Armamos tus muebles para que no pelees con las instrucciones","Camas, closets, escritorios, cunas"],en:["Furniture assembly, no instructions needed","Beds, dressers, desks, cribs"]}],
      ["frame",{es:["Cuadros, espejos y repisas bien colgados",""],en:["Shelves, mirrors and art hung right",""]}]
    ]
  },
  tramites:{
    only:"es",
    es:{t:"Tus trámites, resueltos", d:"Taxes, LLC, seguros, pagos, citas y paquetería. Tú nos dices qué necesitas y nosotros nos encargamos.", tile:"Taxes, LLC, seguro de auto, pagos de USCIS, citas y paquetería"},
    en:{t:"Paperwork, handled", d:"Taxes, LLCs, insurance, payments, appointments and shipping. Tell us what you need and we take care of it.", tile:"Taxes, LLCs, car insurance, USCIS payments, appointments and shipping"},
    items:[
      ["receipt",{es:["Preparamos tus taxes","En español, con Social o ITIN, y te explicamos todo"],en:["Tax preparation","In Spanish or English, with SSN or ITIN, explained clearly"],kw:"impuestos income tax declaracion reembolso refund w2 w-2 1099 irs"}],
      ["file",{es:["Creamos tu LLC o negocio","Registro en el estado, número EIN y todo en orden"],en:["Set up your LLC or business","State filing, EIN number and everything in order"]}],
      ["shield",{es:["Seguro de auto más barato","Comparamos varias aseguradoras y te conectamos con un agente en español"],en:["Cheaper car insurance","We compare several insurers and connect you with an agent"],kw:"aseguranza seguro carro auto vin insurance"}],
      ["card",{es:["Pagos en línea sin enredos","USCIS, multas, facturas y más"],en:["Online payments, no hassle","USCIS, tickets, bills and more"],kw:"migracion inmigracion asilo tasa immigration asylum fee"}],
      ["form",{es:["Citas, formularios y cuentas en línea","Cita de licencia, consulado o pasaporte, correo y contraseñas"],en:["Appointments, forms and online accounts","Driver's license, consulate or passport appointments, email and passwords"],kw:"dmv alea licencia de conducir driver license matricula"}],
      ["box",{es:["Envío de paquetes a tu país","México y Latinoamérica"],en:["Ship packages home","Mexico and Latin America"],kw:"paqueteria paquete caja envio encomienda guatemala honduras salvador"}]
    ]
  }
};

/* Fila de chips ("Lo más pedido") que se desplaza sola, despacio, y se detiene si la tocan. */
function autoScrollChips(el){
  if (!el || el.dataset.auto) return; el.dataset.auto = "1";
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let pos = 0, dir = 1, paused = false, timer = 0, last = 0;
  el.style.scrollSnapType = "none";
  const pause = () => { paused = true; clearTimeout(timer); timer = setTimeout(() => { pos = el.scrollLeft; paused = false; }, 6000); };
  ["pointerdown","touchstart","wheel","keydown","focusin"].forEach(ev => el.addEventListener(ev, pause, {passive:true}));
  el.addEventListener("scroll", () => { if (paused) pos = el.scrollLeft; }, {passive:true});
  const step = ts => {
    if (!el.isConnected) return;
    const max = el.scrollWidth - el.clientWidth;
    if (!paused && max > 8 && document.visibilityState === "visible"){
      pos += dir * Math.min(50, ts - last || 16) * 0.035;
      if (pos >= max){ pos = max; dir = -1; } else if (pos <= 0){ pos = 0; dir = 1; }
      el.scrollLeft = pos;
    }
    last = ts; requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
