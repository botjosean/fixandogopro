/**
 * Fix & Go — backend de tickets (Google Apps Script)
 * Recibe: 1) mensajes y notas de voz de la página web, 2) buzones y SMS de Google Voice.
 * Todo se convierte en un ticket con IA que llega a tu Gmail, con botón para llamar y para responder.
 *
 * INSTALAR (una sola vez):
 * 1. script.google.com → Nuevo proyecto → pega este archivo.
 * 2. Configuración del proyecto → Propiedades del script:
 *      OPENROUTER_KEY = tu llave de OpenRouter
 *      DEEPGRAM_KEY   = tu llave de Deepgram (para transcribir notas de voz)
 * 3. Ejecuta setup() y acepta los permisos.
 * 4. Implementar → Nueva implementación → Tipo: App web → Ejecutar como: Yo → Acceso: Cualquier usuario.
 *    Copia la URL que termina en /exec y pégala en index.html en CONFIG.ENDPOINT.
 * 5. Google Voice → Configuración: buzón por correo con transcripción + reenviar mensajes al correo.
 */
const CFG = {
  MODEL: 'google/gemini-2.5-flash',
  NAME: 'José',
  BRAND: 'Fix & Go',
  LABEL: 'Tickets',
  FOLDER: 'Fix & Go - notas de voz',
  VOICE_QUERY: 'from:voice-noreply@google.com -label:Tickets newer_than:3d',
  // PRECIOS DE EJEMPLO: cámbialos por los tuyos. La IA solo usa estos rangos.
  PRICES: {
    'Montar TV': '$80–$150', 'Cámara de seguridad (por cámara)': '$75–$120', 'Timbre con video': '$70–$100',
    'Ventilador de techo': '$100–$180', 'Cambio de lámpara': '$60–$120', 'Armado de muebles': '$60–$150',
    'Limpieza PS5/Xbox': '$60–$90', 'Reparación control (drift)': '$35–$60', 'Limpieza y optimización PC': '$60–$100',
    'Perfil de Google para negocio': '$150–$300', 'Viaje a Atlanta ida y vuelta con espera': '$180–$260',
  },
};

/* ---------- instalación ---------- */
function setup() {
  const p = PropertiesService.getScriptProperties();
  if (!p.getProperty('OPENROUTER_KEY')) throw new Error('Falta OPENROUTER_KEY en Propiedades del script');
  label_(); folder_();
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('processVoice').timeBased().everyMinutes(5).create();
  processVoice();
}

/* ---------- 1) mensajes de la página web ---------- */
function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents || '{}');
    if (d.hp) return out_({ ok: true });                       // bot atrapado
    const phone = String(d.phone || '').replace(/\D/g, '').slice(-10);
    if (phone.length < 10) return out_({ ok: false, error: 'phone' });
    if (!throttle_()) return out_({ ok: false, error: 'busy' });

    let transcript = '', audioUrl = '';
    if (d.audio) {
      const mime = String(d.mime || 'audio/webm').split(';')[0];
      const bytes = Utilities.base64Decode(d.audio);
      if (bytes.length > 8 * 1024 * 1024) return out_({ ok: false, error: 'size' });
      const ext = mime.indexOf('mp4') > -1 ? 'm4a' : 'webm';
      const f = folder_().createFile(Utilities.newBlob(bytes, mime, `nota-${phone}-${Date.now()}.${ext}`));
      audioUrl = f.getUrl();
      transcript = deepgram_(bytes, mime);
    }
    const said = [d.text, transcript].filter(Boolean).join('\n') || '(nota de voz sin transcripción, escúchala)';
    const input = `Origen: página web (${d.zone === 'atl' ? 'zona Atlanta/Chamblee' : 'zona Birmingham'})
Servicio elegido: ${d.service}  | Categoría: ${d.line || 'general'}  | Para cuándo: ${d.when || 'no dijo'}
Nombre: ${d.name || ''}  | Teléfono: ${phone}  | Idioma de la página: ${d.lang}
Mensaje${transcript ? ' (nota de voz transcrita)' : ''}: ${said}`;

    const t = ticket_(input, { telefono: fmtPhone_(phone), nombre: d.name || '', idioma: d.lang });
    t.origen = 'Página web' + (audioUrl ? ' · nota de voz' : '');
    t.audio = audioUrl;
    email_(t);
    return out_({ ok: true });
  } catch (err) {
    console.error(err);
    return out_({ ok: false, error: 'server' });
  }
}
function doGet() { return out_({ ok: true, service: CFG.BRAND }); }

/* ---------- 2) buzones y SMS de Google Voice ---------- */
function processVoice() {
  const lab = label_();
  GmailApp.search(CFG.VOICE_QUERY, 0, 15).forEach(th => {
    try {
      const m = th.getMessages().pop(), subject = m.getSubject();
      if (!/voicemail|text message|mensaje|buz[oó]n/i.test(subject)) { th.addLabel(lab); return; }
      const body = m.getPlainBody().slice(0, 6000);
      const ph = (subject + ' ' + body).match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
      const t = ticket_(`Origen: Google Voice\nAsunto: ${subject}\n\n${body}`, { telefono: ph ? ph[0] : '' });
      t.origen = /voicemail|buz/i.test(subject) ? 'Buzón de voz' : 'SMS';
      email_(t);
      th.addLabel(lab);
    } catch (e) { console.error(e); }
  });
}

/* ---------- IA ---------- */
function ticket_(input, base) {
  base = base || {};
  const sys = `Eres el asistente de ${CFG.NAME} (${CFG.BRAND}), técnico, handyman y chofer bilingüe en Birmingham y Atlanta.
Recibes un contacto de un cliente (puede venir de una transcripción con errores). Devuelve SOLO JSON válido con:
nombre, telefono, idioma ("es"|"en"), linea ("casa"|"tech"|"negocio"|"viajes"|"otro"), servicio (corto, en español),
pedido_original (lo que dijo, en su idioma), resumen (2-3 líneas en español), urgencia ("hoy"|"semana"|"flexible"),
ubicacion, disponibilidad, soluciones (array, español), materiales (array), precio (SOLO un rango de esta lista o "a cotizar": ${JSON.stringify(CFG.PRICES)}),
preguntas (array de lo que falta saber), respuesta_sms (mensaje corto listo para enviarle, en SU idioma, cálido y directo, firmado ${CFG.NAME}, sin precio exacto).
Si un dato no aparece, usa "". No inventes.`;
  let t = {};
  try {
    const r = UrlFetchApp.fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: { Authorization: 'Bearer ' + prop_('OPENROUTER_KEY') },
      payload: JSON.stringify({ model: CFG.MODEL, temperature: 0.2, response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: sys }, { role: 'user', content: input }] }),
    });
    const txt = JSON.parse(r.getContentText()).choices[0].message.content.replace(/```json|```/g, '').trim();
    t = JSON.parse(txt);
  } catch (e) {
    console.error('IA falló, envío sin análisis', e);
    t = { servicio: 'Nuevo contacto', resumen: 'La IA no pudo analizarlo. Lee el mensaje original abajo.', pedido_original: input };
  }
  Object.keys(base).forEach(k => { if (base[k] && !t[k]) t[k] = base[k]; });
  if (base.telefono) t.telefono = base.telefono;
  return t;
}

function deepgram_(bytes, mime) {
  const key = prop_('DEEPGRAM_KEY'); if (!key) return '';
  try {
    const r = UrlFetchApp.fetch('https://api.deepgram.com/v1/listen?model=nova-3&language=multi&smart_format=true', {
      method: 'post', contentType: mime, payload: bytes, muteHttpExceptions: true,
      headers: { Authorization: 'Token ' + key },
    });
    const j = JSON.parse(r.getContentText());
    return (((j.results || {}).channels || [])[0] || {}).alternatives[0].transcript || '';
  } catch (e) { console.error('Deepgram', e); return ''; }
}

/* ---------- correo ---------- */
const U_ = { hoy: '🔴 HOY', semana: '🟠 Semana', flexible: '🟢 Flexible' };
const esc_ = s => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const digits_ = p => { const d = String(p || '').replace(/\D/g, '').slice(-10); return d.length === 10 ? '1' + d : ''; };

function email_(t) {
  const n = digits_(t.telefono);
  const li = a => (a || []).map(x => `<li>${esc_(x)}</li>`).join('') || '<li>—</li>';
  const btn = (h, x, bg) => `<a href="${h}" style="display:inline-block;background:${bg};color:#fff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:12px;margin:4px 6px 4px 0">${x}</a>`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;color:#14213D">
  <div style="background:#0E7C86;color:#fff;border-radius:18px;padding:18px 20px">
    <div style="font-size:13px;opacity:.9">${U_[t.urgencia] || ''} · ${esc_(t.origen)} · ${esc_(t.linea)} · ${esc_((t.idioma || '').toUpperCase())}</div>
    <div style="font-size:22px;font-weight:800;margin:4px 0">${esc_(t.servicio || 'Nuevo contacto')}</div>
    <div style="font-size:15px">${esc_(t.nombre || 'Sin nombre')} · ${esc_(t.telefono)} · ${esc_(t.ubicacion)}</div>
  </div>
  <div style="margin:14px 0">
    ${n ? btn('tel:+' + n, '📞 Llamar', '#14213D') : ''}
    ${n ? btn('sms:+' + n + '?&body=' + encodeURIComponent(t.respuesta_sms || ''), '💬 Enviar respuesta', '#2FB344') : ''}
    ${n ? btn('https://wa.me/' + n + '?text=' + encodeURIComponent(t.respuesta_sms || ''), 'WhatsApp', '#1FA855') : ''}
    ${t.audio ? btn(t.audio, '🎧 Escuchar nota', '#F2A541') : ''}
  </div>
  <p><b>Resumen:</b> ${esc_(t.resumen)}</p>
  <p><b>Disponibilidad:</b> ${esc_(t.disponibilidad || '—')} &nbsp; <b>Precio:</b> ${esc_(t.precio || 'a cotizar')}</p>
  <p><b>Posibles soluciones</b></p><ul>${li(t.soluciones)}</ul>
  <p><b>Llevar</b></p><ul>${li(t.materiales)}</ul>
  <p><b>Preguntar</b></p><ul>${li(t.preguntas)}</ul>
  <p><b>Respuesta sugerida:</b><br><span style="background:#E6EEF0;display:block;padding:10px 12px;border-radius:10px">${esc_(t.respuesta_sms)}</span></p>
  <p style="color:#4A5873;font-size:13px"><b>Lo que dijo:</b> ${esc_(t.pedido_original)}</p></div>`;
  const subject = `${U_[t.urgencia] || '⚪'} ${t.servicio || 'Nuevo contacto'} · ${t.ubicacion || 'sin zona'} · ${t.telefono || ''}`;
  const text = `${t.servicio} | ${t.nombre} ${t.telefono} | ${t.ubicacion}\n${t.resumen}\nPrecio: ${t.precio}\nRespuesta: ${t.respuesta_sms}`;
  GmailApp.sendEmail(Session.getEffectiveUser().getEmail(), subject, text, { htmlBody: html, name: 'Tickets ' + CFG.BRAND });
}

/* ---------- utilidades ---------- */
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function prop_(k) { return PropertiesService.getScriptProperties().getProperty(k); }
function label_() { return GmailApp.getUserLabelByName(CFG.LABEL) || GmailApp.createLabel(CFG.LABEL); }
function folder_() { const it = DriveApp.getFoldersByName(CFG.FOLDER); return it.hasNext() ? it.next() : DriveApp.createFolder(CFG.FOLDER); }
function fmtPhone_(d) { return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`; }
function throttle_() {  // máximo 30 mensajes cada 10 minutos, para frenar spam
  const c = CacheService.getScriptCache(), k = 'n' + Math.floor(Date.now() / 600000), n = +(c.get(k) || 0);
  if (n >= 30) return false; c.put(k, String(n + 1), 700); return true;
}
