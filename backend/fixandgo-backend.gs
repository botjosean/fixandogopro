/**
 * Fix & Go — backend de tickets (Google Apps Script)
 * Recibe: 1) mensajes y notas de voz de la página web, 2) buzones y SMS de Google Voice,
 *         3) correos que llegan a info@fixandgopro.com (Cloudflare Email Routing → tu Gmail).
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
 * 6. Correo de empresa: sigue la sección "Correo de empresa" del README (Cloudflare Email Routing +
 *    Gmail "Enviar como" info@). Si ya habías ejecutado setup(), ejecútalo otra vez para crear el trigger.
 */
const CFG = {
  MODEL: 'google/gemini-2.5-flash',
  SIGNATURE: 'Equipo Fix & Go',   // firma de las respuestas: siempre como empresa
  BRAND: 'Fix & Go',
  SUPPORT: 'info@fixandgopro.com',  // correo de empresa; llega a tu Gmail por Cloudflare Email Routing
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
  ScriptApp.newTrigger('processEmail').timeBased().everyMinutes(5).create();
  ScriptApp.newTrigger('processJobs').timeBased().everyMinutes(1).create();   // cola de mensajes de la página web
  processVoice();
  processEmail();
}

/* ---------- 1) mensajes de la página web ---------- */
function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents || '{}');
    if (d.hp) return out_({ ok: true });                       // bot atrapado
    if (d.type === 'consent') return consent_(d);
    if (d.type === 'transcribe') {                              // solo escribe lo que se dijo; no crea ticket
      if (!throttle_()) return out_({ ok: false, error: 'busy' });
      const tb = Utilities.base64Decode(d.audio || '');
      if (!tb.length || tb.length > 8 * 1024 * 1024) return out_({ ok: false, error: 'size' });
      const tm = String(d.mime || 'audio/webm').split(';')[0];
      const text = deepgram_(tb, tm);
      let aid = '';
      try { aid = folder_().createFile(Utilities.newBlob(tb, tm, `nota-${Date.now()}.${tm.indexOf('mp4') > -1 ? 'm4a' : 'webm'}`)).getId(); } catch (e) { console.error(e); }
      return out_({ ok: true, text, aid });
    }
    const phone = String(d.phone || '').replace(/\D/g, '').slice(-10);
    const email = String(d.email || '').trim().slice(0, 80);
    if (email ? !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) : phone.length < 10) return out_({ ok: false, error: 'phone' });   // basta un contacto: teléfono o correo
    if (!throttle_()) return out_({ ok: false, error: 'busy' });

    let transcript = '', audioUrl = '';
    if (d.aid) {                                                // el audio ya se guardó al transcribir: no se vuelve a subir
      try { audioUrl = DriveApp.getFileById(String(d.aid)).getUrl(); } catch (e) { console.error(e); }
    } else if (d.audio) {
      const mime = String(d.mime || 'audio/webm').split(';')[0];
      const bytes = Utilities.base64Decode(d.audio);
      if (bytes.length > 8 * 1024 * 1024) return out_({ ok: false, error: 'size' });
      const ext = mime.indexOf('mp4') > -1 ? 'm4a' : 'webm';
      const f = folder_().createFile(Utilities.newBlob(bytes, mime, `nota-${phone || 'correo'}-${Date.now()}.${ext}`));
      audioUrl = f.getUrl();
      transcript = d.tx ? '' : deepgram_(bytes, mime);
    }
    // se responde YA al cliente; el ticket (IA + correo) se arma en segundo plano
    const job = { phone, email, name: String(d.name || '').slice(0, 80), service: String(d.service || '').slice(0, 120), line: d.line || '', when: d.when || '',
      lang: d.lang, zone: d.zone, text: String(d.text || '').slice(0, 2000), transcript: transcript.slice(0, 2000), audioUrl, tx: d.tx ? 1 : 0, a: 0 };
    const pr = PropertiesService.getScriptProperties();
    pr.setProperty('job_' + Date.now() + '_' + Math.floor(Math.random() * 1e6), JSON.stringify(job));
    if (!pr.getProperty('oneshot_id')) {                        // arranque inmediato; el trigger de cada minuto queda de respaldo
      try { pr.setProperty('oneshot_id', ScriptApp.newTrigger('processJobs').timeBased().after(1500).create().getUniqueId()); } catch (e) { console.error(e); }
    }
    return out_({ ok: true });
  } catch (err) {
    console.error(err);
    return out_({ ok: false, error: 'server' });
  }
}

/* cola: arma el ticket de cada mensaje recibido de la página (reintenta hasta 3 veces) */
function processJobs() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(25000)) return;
  try {
    const pr = PropertiesService.getScriptProperties(), oid = pr.getProperty('oneshot_id');
    if (oid) { ScriptApp.getProjectTriggers().filter(t => t.getUniqueId() === oid).forEach(t => ScriptApp.deleteTrigger(t)); pr.deleteProperty('oneshot_id'); }
    const all = pr.getProperties();
    Object.keys(all).filter(k => k.indexOf('job_') === 0).sort().forEach(k => {
      let j; try { j = JSON.parse(all[k]); } catch (e) { pr.deleteProperty(k); return; }
      j.a = (j.a || 0) + 1;
      if (j.a > 3) { pr.deleteProperty(k); console.error('ticket descartado tras 3 intentos', k); return; }
      pr.setProperty(k, JSON.stringify(j));
      try { buildWebTicket_(j); pr.deleteProperty(k); } catch (e) { console.error(e); }
    });
  } finally { lock.releaseLock(); }
}

function buildWebTicket_(d) {
  const said = [d.text, d.transcript].filter(Boolean).join('\n') || '(nota de voz sin transcripción, escúchala)';
  const input = `Origen: página web (${d.zone === 'atl' ? 'zona Atlanta/Chamblee' : 'zona Birmingham'})
Servicio elegido: ${d.service}  | Categoría: ${d.line || 'general'}  | Para cuándo: ${d.when || 'no dijo'}
Nombre: ${d.name || ''}  | Teléfono: ${d.phone ? fmtPhone_(d.phone) : '(no dio)'}  | Correo: ${d.email || '(no dio)'}  | Idioma de la página: ${d.lang}
Mensaje${d.transcript ? ' (nota de voz transcrita)' : ''}: ${said}`;
  const t = ticket_(input, { telefono: d.phone ? fmtPhone_(d.phone) : '', email: d.email || '', nombre: d.name || '', idioma: d.lang });
  t.origen = 'Página web' + (d.audioUrl ? ' · nota de voz' : '');
  t.audio = d.audioUrl;
  email_(t);
}
function doGet() { return out_({ ok: true, service: CFG.BRAND }); }

/* ---------- consentimiento firmado en línea (recibo de equipo) ---------- */
function consent_(d) {
  const clean = (s, n) => String(s || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
  const name = clean(d.name, 80), items = clean(d.items, 400), signed = clean(d.signature, 80), email = clean(d.email, 120);
  const phone = String(d.phone || '').replace(/\D/g, '').slice(-10);
  if (name.length < 3 || signed.length < 3 || !items || !d.agree || !d.agree2) return out_({ ok: false, error: 'data' });
  if (signed.toLowerCase() !== name.toLowerCase()) return out_({ ok: false, error: 'match' });
  if (!throttle_()) return out_({ ok: false, error: 'busy' });
  const en = d.lang === 'en', when = Utilities.formatDate(new Date(), 'America/Chicago', "yyyy-MM-dd HH:mm 'CT'");
  const body = `<div style="font-family:Arial,sans-serif;max-width:560px;color:#14213D">
    <div style="background:#0E7C86;color:#fff;border-radius:18px;padding:16px 20px">
      <div style="font-size:13px;opacity:.9">${en ? 'Signed equipment receipt' : 'Recibo de equipo firmado'} · ${esc_(when)}</div>
      <div style="font-size:21px;font-weight:800;margin:4px 0">${esc_(items)}</div>
      <div>${esc_(name)}${phone ? ' · ' + esc_(fmtPhone_(phone)) : ''}${email ? ' · ' + esc_(email) : ''}</div></div>
    <p>${en
      ? 'The customer authorized Fix &amp; Go to pick up and inspect the equipment above, agreed that no repair is done without approving a quote first, and accepted the terms shown on the form. Signed electronically by typing their full name.'
      : 'El cliente autorizó a Fix &amp; Go a recoger y revisar el equipo indicado, aceptó que no se repara nada sin aprobar antes una cotización, y aceptó los términos del formulario. Firmado electrónicamente escribiendo su nombre completo.'}</p>
    <p><b>${en ? 'Terms accepted' : 'Términos aceptados'}:</b></p><ul>${(d.terms || []).slice(0, 12).map(x => `<li>${esc_(clean(x, 400))}</li>`).join('')}</ul>
    <p style="font-size:13px;color:#4A5873">${en ? 'Electronic signature' : 'Firma electrónica'}: <b>${esc_(signed)}</b> · ${esc_(when)}<br>${en ? 'Also accepted separately: clause 8 (unclaimed equipment). Form version' : 'Aceptó también por separado la cláusula 8 (equipo no retirado). Versión del formulario'}: ${esc_(clean(d.v, 10))} · ${esc_(clean(d.ua, 200))}</p></div>`;
  const subject = `[${en ? 'SIGNED' : 'FIRMADO'}] ${items.slice(0, 50)} · ${name}`;
  const owner = Session.getEffectiveUser().getEmail();
  GmailApp.sendEmail(owner, subject, `${name} - ${items} - ${when}`, { htmlBody: body, name: 'Recibos ' + CFG.BRAND });
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    const opts = { htmlBody: body, name: CFG.BRAND }; if (hasAlias_()) opts.from = CFG.SUPPORT;
    try { GmailApp.sendEmail(email, `${CFG.BRAND} · ${en ? 'Your signed receipt' : 'Tu recibo firmado'}`, `${items} - ${when}`, opts); } catch (e) { console.error(e); }
  }
  return out_({ ok: true });
}

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

/* ---------- 3) correos a info@ ---------- */
function processEmail() {
  const lab = label_(), me = Session.getEffectiveUser().getEmail().toLowerCase(), sup = CFG.SUPPORT.toLowerCase();
  const alias = hasAlias_();
  const q = `(to:${CFG.SUPPORT} OR cc:${CFG.SUPPORT} OR deliveredto:${CFG.SUPPORT}) -label:${CFG.LABEL} -in:sent -in:drafts newer_than:3d`;
  GmailApp.search(q, 0, 15).forEach(th => {
    try {
      // último mensaje que no mandamos nosotros
      const m = th.getMessages().filter(x => { const f = addr_(x.getFrom()); return f !== me && f !== sup; }).pop();
      if (!m || isAutomated_(m)) { th.addLabel(lab); return; }
      const from = m.getFrom(), email = addr_(from), name = from.replace(/<[^>]*>/, '').replace(/"/g, '').trim();
      const subject = m.getSubject(), body = m.getPlainBody().slice(0, 6000);
      const ph = (subject + ' ' + body).match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
      const t = ticket_(`Origen: correo a ${CFG.SUPPORT}\nDe: ${from}\nAsunto: ${subject}\n\n${body}`,
        { nombre: name && name !== email ? name : '', telefono: ph ? ph[0] : '' });
      t.origen = 'Correo';
      t.email = email;

      // borrador de respuesta en el mismo hilo (desde info@ si el alias existe)
      const opts = alias ? { from: CFG.SUPPORT, name: CFG.BRAND } : {};
      m.createDraftReply(t.respuesta_sms || ack_(t), opts);
      t.draft = `https://mail.google.com/mail/?authuser=${encodeURIComponent(me)}#all/${th.getId()}`;
      t.alias = alias;

      email_(t);
      th.addLabel(lab);   // etiquetar ANTES del acuse: si algo falla después, nunca se le escribe dos veces al cliente

      // acuse automático, solo desde info@ para no revelar el Gmail personal
      if (alias) m.reply(ack_(t), { from: CFG.SUPPORT, name: CFG.BRAND });
    } catch (e) { console.error(e); }
  });
}

function hasAlias_() {
  try { return GmailApp.getAliases().some(a => a.toLowerCase() === CFG.SUPPORT.toLowerCase()); }
  catch (e) { console.error('getAliases', e); return false; }
}

function isAutomated_(m) {
  const from = String(m.getFrom()).toLowerCase();
  if (/(no-?reply|do-?not-?reply|mailer-daemon|postmaster|bounces?[@+.-]|notifications?@|notify@|alerts?@)/.test(from)) return true;
  const h = n => { try { return String(m.getHeader(n) || '').toLowerCase(); } catch (e) { return ''; } };
  const auto = h('Auto-Submitted');
  if (auto && auto !== 'no') return true;
  if (/bulk|list|junk|auto_reply/.test(h('Precedence'))) return true;
  return !!(h('List-Unsubscribe') || h('List-Id') || h('X-Autoreply') || h('X-Autorespond'));
}

function ack_(t) {
  const first = String(t.nombre || '').trim().split(/\s+/)[0];
  return t.idioma === 'en'
    ? `Hi${first ? ' ' + first : ''},\n\nWe got your message. We'll get back to you today.\n\n${CFG.BRAND} Team\nfixandgopro.com`
    : `Hola${first ? ' ' + first : ''}:\n\nRecibimos tu mensaje. Te respondemos hoy mismo.\n\n${CFG.SIGNATURE}\nfixandgopro.com`;
}

/* ---------- IA ---------- */
function ticket_(input, base) {
  base = base || {};
  const sys = `Eres el asistente de ${CFG.BRAND}, una empresa bilingüe de servicios para el hogar, tecnología, trámites y viajes en Birmingham y Atlanta.
Recibes un contacto de un cliente (puede venir de una transcripción con errores). Devuelve SOLO JSON válido con:
nombre, telefono, idioma ("es"|"en"), linea ("casa"|"tech"|"tramites"|"negocio"|"viajes"|"otro"), servicio (corto, en español),
pedido_original (lo que dijo, en su idioma), resumen (2-3 líneas en español), urgencia ("hoy"|"semana"|"flexible"),
ubicacion, disponibilidad, soluciones (array, español), materiales (array), precio (SOLO un rango de esta lista o "a cotizar": ${JSON.stringify(CFG.PRICES)}),
preguntas (array de lo que falta saber), respuesta_sms (mensaje corto listo para enviarle, en SU idioma, cálido y directo, hablando como empresa en plural ("nosotros", nunca "yo"), firmado "${CFG.SIGNATURE}", sin precio exacto),
equipo (lista corta del equipo o aparato que hay que recoger para revisar, en el idioma del cliente, p. ej. "PS5 con control"; "" si el trabajo es en sitio o no hay equipo),
pedido_es (lo que dijo el cliente traducido al español; si ya está en español, repítelo igual), respuesta_es (traducción al español de respuesta_sms, para que el dueño entienda qué se le envía; si ya está en español, repítela igual).
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
  if (base.email) t.email = base.email;
  return t;
}

// vocabulario propio: mejora el reconocimiento de estas palabras en español e inglés (máx. ~100 palabras)
const KEYTERMS = ['PlayStation 5', 'PS5', 'PlayStation', 'Xbox', 'Nintendo Switch', 'iPhone', 'iPad', 'MacBook', 'iMac', 'Windows', 'laptop',
  'WiFi', 'router', 'HDMI', 'Alexa', 'Google Home', 'Ring', 'Wyze', 'Eufy', 'Fix and Go', 'LLC', 'ITIN', 'taxes', 'TikTok', 'Instagram',
  'Facebook', 'WhatsApp', 'Gmail', 'iCloud', 'Homewood', 'Hoover', 'Birmingham', 'Chamblee', 'Doraville', 'Atlanta'];
function deepgram_(bytes, mime) {
  const key = prop_('DEEPGRAM_KEY'); if (!key) return '';
  try {
    const kt = KEYTERMS.map(k => '&keyterm=' + encodeURIComponent(k)).join('');
    const r = UrlFetchApp.fetch('https://api.deepgram.com/v1/listen?model=nova-3&language=multi&smart_format=true' + kt, {
      method: 'post', contentType: mime, payload: bytes, muteHttpExceptions: true,
      headers: { Authorization: 'Token ' + key },
    });
    const j = JSON.parse(r.getContentText());
    return (((j.results || {}).channels || [])[0] || {}).alternatives[0].transcript || '';
  } catch (e) { console.error('Deepgram', e); return ''; }
}

/* ---------- correo ---------- */
const U_ = { hoy: '&#128308; HOY', semana: '&#128992; Semana', flexible: '&#128994; Flexible' };   // entidades HTML: los emoji directos salían rotos en Gmail
const UT_ = { hoy: 'HOY', semana: 'SEMANA', flexible: 'FLEXIBLE' };
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
    <div style="font-size:15px">${esc_(t.nombre || 'Sin nombre')}${t.telefono ? ' · ' + esc_(t.telefono) : ''}${t.email ? ' · ' + esc_(t.email) : ''} · ${esc_(t.ubicacion)}</div>
  </div>
  <div style="margin:14px 0">
    ${!n && t.email ? btn('mailto:' + t.email + '?subject=' + encodeURIComponent('Fix & Go') + '&body=' + encodeURIComponent(t.respuesta_sms || ''), '&#9993; Responder por correo', '#2FB344') : ''}
    ${n ? btn('tel:+' + n, '&#128222; Llamar', '#14213D') : ''}
    ${n ? btn('sms:+' + n + '?&body=' + encodeURIComponent(t.respuesta_sms || ''), '&#128172; Enviar respuesta', '#2FB344') : ''}
    ${n ? btn('https://wa.me/' + n + '?text=' + encodeURIComponent(t.respuesta_sms || ''), 'WhatsApp', '#1FA855') : ''}
    ${t.audio ? btn(t.audio, '&#127911; Escuchar nota', '#F2A541') : ''}
    ${n && t.equipo ? btn('sms:+' + n + '?&body=' + encodeURIComponent(consentMsg_(t)), '&#128221; Enviar consentimiento', '#8A5CF6') : ''}
    ${t.draft ? btn(t.draft, '&#9993; Ver borrador de respuesta', '#0E7C86') : ''}
  </div>
  ${t.draft && !t.alias ? `<p style="background:#FDF0DC;padding:10px 12px;border-radius:10px;font-size:13px">⚠️ Gmail no tiene el alias ${esc_(CFG.SUPPORT)} en "Enviar como": no se mandó acuse al cliente y el borrador saldría desde tu Gmail personal. Configúralo (README → Correo de empresa).</p>` : ''}
  <p><b>Resumen:</b> ${esc_(t.resumen)}</p>
  <p><b>Disponibilidad:</b> ${esc_(t.disponibilidad || '—')} &nbsp; <b>Precio:</b> ${esc_(t.precio || 'a cotizar')}</p>
  <p><b>Posibles soluciones</b></p><ul>${li(t.soluciones)}</ul>
  <p><b>Llevar</b></p><ul>${li(t.materiales)}</ul>
  <p><b>Preguntar</b></p><ul>${li(t.preguntas)}</ul>
  <p><b>Respuesta sugerida${t.idioma === 'en' ? ' (se envía en inglés)' : ''}:</b><br><span style="background:#E6EEF0;display:block;padding:10px 12px;border-radius:10px">${esc_(t.respuesta_sms)}</span></p>
  ${t.idioma === 'en' && t.respuesta_es ? `<p><b>En español (para ti):</b><br><span style="background:#FDF0DC;display:block;padding:10px 12px;border-radius:10px">${esc_(t.respuesta_es)}</span></p>` : ''}
  <p style="color:#4A5873;font-size:13px"><b>Lo que dijo${t.idioma === 'en' ? ' (en inglés)' : ''}:</b> ${esc_(t.pedido_original)}</p>
  ${t.idioma === 'en' && t.pedido_es ? `<p style="color:#4A5873;font-size:13px"><b>En español:</b> ${esc_(t.pedido_es)}</p>` : ''}</div>`;
  const subject = `[${UT_[t.urgencia] || 'NUEVO'}] ${t.servicio || 'Nuevo contacto'} · ${t.ubicacion || 'sin zona'} · ${t.telefono || t.email || ''}`;
  const text = `${t.servicio} | ${t.nombre} ${t.telefono} | ${t.ubicacion}\n${t.resumen}\nPrecio: ${t.precio}\nRespuesta: ${t.respuesta_sms}`;
  GmailApp.sendEmail(Session.getEffectiveUser().getEmail(), subject, text, { htmlBody: html, name: 'Tickets ' + CFG.BRAND });
}

function consentMsg_(t) {
  const en = t.idioma === 'en', first = String(t.nombre || '').trim().split(/\s+/)[0];
  const url = 'https://fixandgopro.com/recibo/?l=' + (en ? 'en' : 'es') + '&n=' + encodeURIComponent(t.nombre || '') +
    '&p=' + encodeURIComponent(String(t.telefono || '').replace(/\D/g, '').slice(-10)) + '&e=' + encodeURIComponent(t.equipo || '');
  return en
    ? `Hi${first ? ' ' + first : ''}! Before we pick up your equipment, please review and sign this short form (1 minute): ${url}\n${CFG.BRAND} Team`
    : `¡Hola${first ? ' ' + first : ''}! Antes de recoger tu equipo, revisa y firma este formulario corto (1 minuto): ${url}\n${CFG.SIGNATURE}`;
}

/* ---------- utilidades ---------- */
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function prop_(k) { return PropertiesService.getScriptProperties().getProperty(k); }
function label_() { return GmailApp.getUserLabelByName(CFG.LABEL) || GmailApp.createLabel(CFG.LABEL); }
function folder_() { const it = DriveApp.getFoldersByName(CFG.FOLDER); return it.hasNext() ? it.next() : DriveApp.createFolder(CFG.FOLDER); }
function addr_(from) { const m = String(from || '').match(/<([^>]+)>/); return (m ? m[1] : String(from || '')).trim().toLowerCase(); }
function fmtPhone_(d) { return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`; }
function throttle_() {  // máximo 30 mensajes cada 10 minutos, para frenar spam
  const c = CacheService.getScriptCache(), k = 'n' + Math.floor(Date.now() / 600000), n = +(c.get(k) || 0);
  if (n >= 30) return false; c.put(k, String(n + 1), 700); return true;
}
