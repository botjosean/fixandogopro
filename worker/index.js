// fixandgopro.com/youtube/* va al servidor de Dos Lenguas (yt.fixandgopro.com, Google Cloud).
// Todo lo demas son los archivos estaticos del sitio, igual que siempre.
//
// El servidor se apaga solo cuando nadie lo usa. Si esta dormido, al abrir el portal (con la clave)
// se le pide al "despertador" que lo encienda y se muestra una pagina de espera que se recarga sola.
const ORIGEN = "yt.fixandgopro.com";
const DESPERTADOR = "https://us-east1-doslenguas-yt.cloudfunctions.net/despertar";
const DORMIDO = new Set([502, 504, 521, 522, 523, 524]);

const ESPERA = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="8">
<title>Dos Lenguas</title><style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0816;color:#fff;font-family:system-ui,sans-serif;text-align:center}
p{opacity:.7}.p{width:46px;height:46px;margin:0 auto 22px;border:5px solid #ffffff30;border-top-color:#FFD23F;border-radius:50%;animation:g 1s linear infinite}
@keyframes g{to{transform:rotate(360deg)}}</style></head><body><div><div class="p"></div>
<h2>Despertando el servidor…</h2><p>Tarda cerca de un minuto. Esta página se recarga sola.</p></div></body></html>`;

async function youtube(request) {
  const url = new URL(request.url);
  url.protocol = "https:";
  url.hostname = ORIGEN;
  url.port = "";
  const respuesta = await fetch(new Request(url, request));
  if (!DORMIDO.has(respuesta.status)) return respuesta;

  const esApi = url.pathname.startsWith("/youtube/api/");
  // El refresco automatico de la lista no despierta al servidor: solo abrir el portal o mandar algo.
  if (request.method === "GET" && esApi) return Response.json({ detail: "El servidor está dormido" }, { status: 503 });
  const clave = request.headers.get("Authorization");
  const pedirClave = new Response("Clave requerida", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="Dos Lenguas"' } });
  if (!clave) return pedirClave;
  const d = await fetch(DESPERTADOR, { headers: { Authorization: clave } });
  if (d.status === 401) return pedirClave;
  if (request.method !== "GET") {
    return Response.json({ detail: "El servidor estaba dormido y ya está despertando. Intenta de nuevo en un minuto." }, { status: 503 });
  }
  return new Response(ESPERA, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === "/youtube" || pathname.startsWith("/youtube/")) return youtube(request);
    return env.ASSETS.fetch(request);
  },
};
