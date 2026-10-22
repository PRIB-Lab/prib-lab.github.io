export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.hostname === "www.priblabs.com") {
      url.hostname = "priblabs.com";
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }

    return env.ASSETS.fetch(request);
  }
};
