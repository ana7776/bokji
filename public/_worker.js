export default {
  fetch(request, env) {
    const url = new URL(request.url);

    if (url.hostname === "www.bokjicheck.co.kr") {
      url.hostname = "bokjicheck.co.kr";
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === "/sitemap.xml") {
      const sitemapUrl = new URL("/sitemap-index.xml", url.origin);
      return env.ASSETS.fetch(
        new Request(sitemapUrl.toString(), {
          headers: request.headers,
          method: "GET",
        }),
      );
    }

    return env.ASSETS.fetch(request);
  },
};
