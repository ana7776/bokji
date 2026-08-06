export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.hostname === "www.sosotime.com") {
    url.hostname = "sosotime.com";
    return Response.redirect(url.toString(), 301);
  }

  return context.next();
}
