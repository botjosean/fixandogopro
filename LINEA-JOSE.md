# Línea José — recepcionista IA + intérprete de llamadas en vivo

Construye esto completo. Reutiliza todo lo que sirva del pipeline de Auris
(Deepgram Nova-3 streaming → OpenRouter → Deepgram Aura-2, LiveKit, lógica de turnos
con dependencias inyectadas, fix del turno fantasma/eco).

## Objetivo
Un solo número de EE.UU. (llamadas + SMS) que va en tarjetas, landing y anuncios.
1. Cuando alguien llama, contesta un asistente con voz real, toma el pedido y me manda un ticket.
2. Si estoy disponible, atiendo desde la laptop: leo en español lo que dice el cliente
   y hablo en español; el cliente oye mis palabras en inglés con otra voz. Nunca oye mi voz real.

## Infraestructura
- Número: Telnyx (o Twilio) con voz + SMS, SIP trunk a LiveKit (entrante y saliente).
- LiveKit Cloud para empezar; opción self-hosted en Hetzner después.
- Backend: Python (livekit-agents) para el agente; Node o Python para API/tickets.
- Front: consola web React 19 + Vite + Tailwind en `llamadas.MIDOMINIO.com`, con login.
- Deploy: Docker Compose + Caddy (TLS automático) en Hetzner.
- Email: Resend. SMS: API de Telnyx.
- Todo configurable en `config/`: `business.json` (nombre, servicios, zona),
  `prices.json` (precios base por servicio), `voices.json`, textos de saludo ES/EN.

## Módulo 1 — Recepcionista
Flujo de llamada entrante:
1. El agente contesta al instante. Detecta idioma por las primeras palabras y sigue en ese idioma.
   EN: "Hi, this is José's assistant at Fix & Go. This call may be transcribed.
   How can I help you today?" (ES equivalente).
2. En paralelo suena la consola de mi laptop (notificación + sonido) 20 s.
   - Si acepto → paso a Módulo 2 en la misma sala; el agente dice "Connecting you with José now" y sale.
   - Si no → sigue la toma de datos.
3. Toma de datos, máximo 4 preguntas, conversacional, sin sonar a formulario:
   qué necesita, dirección o ZIP, cuándo le conviene, nombre. Confirma en una frase y cuelga cordial.
   Si solo quiere dejar mensaje, lo deja y listo.
4. Al colgar:
   - Transcripción completa → LLM (OpenRouter) → ticket JSON validado con schema.
   - Email a mí (HTML limpio, en español) + SMS corto a mi celular con el resumen.
   - SMS automático al cliente en su idioma: "Got it! José will get back to you today."

Ticket (JSON + email):
`id, fecha, nombre, teléfono, idioma, línea (casa|tech|negocio|viajes), pedido en sus palabras,
resumen en español (3 líneas), urgencia (hoy|semana|flexible), ubicación, disponibilidad,
posibles soluciones, materiales/piezas probables, rango de precio (desde prices.json, nunca inventado),
preguntas pendientes, próximo paso sugerido, transcripción completa, link al audio`.

## Módulo 2 — Consola intérprete (laptop)
Pantalla:
- Panel grande: lo que dice el cliente, en español, apareciendo en vivo (interim en gris, final en negro),
  con el inglés original pequeño debajo.
- Panel propio: lo que yo dije en español y el inglés exacto que se le envió (read-back).
- Barra: marcar número (salientes por el SIP trunk), colgar, mute, silenciar voz traducida, estado de latencia.
- 3 sugerencias de respuesta en español según el contexto; tocar una la envía como si la hubiera dicho.

Audio:
- Cliente (EN) → Nova-3 streaming → traducción ES en pantalla.
- Mi micrófono (ES) → Nova-3 → traducción EN → Aura-2 → track publicado a la llamada.
- Mi track de micrófono crudo NUNCA se suscribe al participante SIP (permisos de track en LiveKit).
- Fin de turno: VAD + endpointing; además modo push-to-talk con la barra espaciadora.
- Uso con audífonos por defecto; aplica el fix de eco/turno fantasma de Auris.

Coherencia y velocidad:
- El traductor recibe: últimos 10 turnos, `business.json`, `prices.json` y un glosario de oficios
  (TV mount, stud, drift, SSD, ceiling fan…). Traduce natural y hablado, no literal.
- Nunca inventa precios ni compromisos que yo no dije. Cifras, direcciones y horas se repiten exactas.
- Traduce por frases mientras hablo; empieza el TTS en cuanto hay frase completa.
- Si la traducción tarda más de 1.2 s, suena un relleno corto y natural ("Sure, one sec").
- Objetivo: < 1.5 s desde que termino de hablar hasta que el cliente oye el inglés. Medir y mostrar.

Voz:
- Aura-2 en inglés, masculina, joven, cálida y segura. Haz un script `scripts/voice_test.py`
  que genere la misma frase con 6 voces candidatas para que yo elija.
- Frase de apertura opcional configurable (recomendada):
  "Hey, it's José. I'm using a live interpreter, so there's a tiny delay."

Al terminar la llamada: mismo flujo de ticket del Módulo 1.

## Calidad
- Escenarios de simulación como en Auris: cliente de cámaras, PS5, viaje a Atlanta, dueño de barbería,
  cliente que habla rápido, cliente con acento, ruido de fondo, cliente que interrumpe.
- Evaluador automático: cifras/direcciones/horas idénticas en ambos idiomas, latencia p50/p95.
- Logs por llamada y costo estimado por minuto en la consola.

## Entrega
1. `docker compose up -d` levanta todo.
2. `README.md` con: comprar número en Telnyx, crear SIP trunk, dispatch rule en LiveKit, variables `.env`.
3. `.env.example` con todas las llaves (LiveKit, Deepgram, OpenRouter, Telnyx, Resend).
Construye por fases: primero Módulo 1 funcionando de punta a punta, luego Módulo 2.
