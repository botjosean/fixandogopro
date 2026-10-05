// fixandgopro.com/youtube/* va al servidor de Dos Lenguas (yt.fixandgopro.com, Google Cloud).
// Todo lo demas son los archivos estaticos del sitio, igual que siempre.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/youtube" || url.pathname.startsWith("/youtube/")) {
      url.protocol = "https:";
      url.hostname = "yt.fixandgopro.com";
      url.port = "";
      return fetch(new Request(url, request));
    }
    return env.ASSETS.fetch(request);
  },
};
