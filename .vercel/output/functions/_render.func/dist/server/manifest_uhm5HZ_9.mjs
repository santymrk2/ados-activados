import 'piccolore';
import { o as decodeKey } from './chunks/astro/server_igTFnf3S.mjs';
import 'clsx';
import { N as NOOP_MIDDLEWARE_FN } from './chunks/astro-designed-error-pages_Sf1PYbfi.mjs';
import 'es-module-lexer';

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///Users/santiagomercadocarbone/Documents/Develops/a2/","cacheDir":"file:///Users/santiagomercadocarbone/Documents/Develops/a2/node_modules/.astro/","outDir":"file:///Users/santiagomercadocarbone/Documents/Develops/a2/dist/","srcDir":"file:///Users/santiagomercadocarbone/Documents/Develops/a2/src/","publicDir":"file:///Users/santiagomercadocarbone/Documents/Develops/a2/public/","buildClientDir":"file:///Users/santiagomercadocarbone/Documents/Develops/a2/dist/client/","buildServerDir":"file:///Users/santiagomercadocarbone/Documents/Develops/a2/dist/server/","adapterName":"@astrojs/vercel","routes":[{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","component":"_server-islands.astro","params":["name"],"segments":[[{"content":"_server-islands","dynamic":false,"spread":false}],[{"content":"name","dynamic":true,"spread":false}]],"pattern":"^\\/_server-islands\\/([^/]+?)\\/?$","prerender":false,"isIndex":false,"fallbackRoutes":[],"route":"/_server-islands/[name]","origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"stage":"head-inline","children":"window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };\n\t\tvar script = document.createElement('script');\n\t\tscript.defer = true;\n\t\tscript.src = '/_vercel/insights/script.js';\n\t\tvar head = document.querySelector('head');\n\t\thead.appendChild(script);\n\t"}],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image\\/?$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/astro/dist/assets/endpoint/generic.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"stage":"head-inline","children":"window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };\n\t\tvar script = document.createElement('script');\n\t\tscript.defer = true;\n\t\tscript.src = '/_vercel/insights/script.js';\n\t\tvar head = document.querySelector('head');\n\t\thead.appendChild(script);\n\t"}],"styles":[],"routeData":{"route":"/api/activities","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/activities\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"activities","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/activities.ts","pathname":"/api/activities","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"stage":"head-inline","children":"window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };\n\t\tvar script = document.createElement('script');\n\t\tscript.defer = true;\n\t\tscript.src = '/_vercel/insights/script.js';\n\t\tvar head = document.querySelector('head');\n\t\thead.appendChild(script);\n\t"}],"styles":[],"routeData":{"route":"/api/live","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/live\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"live","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/live.ts","pathname":"/api/live","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"stage":"head-inline","children":"window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };\n\t\tvar script = document.createElement('script');\n\t\tscript.defer = true;\n\t\tscript.src = '/_vercel/insights/script.js';\n\t\tvar head = document.querySelector('head');\n\t\thead.appendChild(script);\n\t"}],"styles":[],"routeData":{"route":"/api/participants","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/participants\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"participants","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/participants.ts","pathname":"/api/participants","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"stage":"head-inline","children":"window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };\n\t\tvar script = document.createElement('script');\n\t\tscript.defer = true;\n\t\tscript.src = '/_vercel/insights/script.js';\n\t\tvar head = document.querySelector('head');\n\t\thead.appendChild(script);\n\t"}],"styles":[{"type":"external","src":"/_astro/index.Djv-7Kqq.css"}],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}}],"base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["/Users/santiagomercadocarbone/Documents/Develops/a2/src/pages/index.astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener(\"change\",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000noop-middleware":"_noop-middleware.mjs","\u0000virtual:astro:actions/noop-entrypoint":"noop-entrypoint.mjs","\u0000@astro-page:src/pages/api/activities@_@ts":"pages/api/activities.astro.mjs","\u0000@astro-page:src/pages/api/live@_@ts":"pages/api/live.astro.mjs","\u0000@astro-page:src/pages/api/participants@_@ts":"pages/api/participants.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000@astro-page:node_modules/astro/dist/assets/endpoint/generic@_@js":"pages/_image.astro.mjs","\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000@astrojs-manifest":"manifest_uhm5HZ_9.mjs","/Users/santiagomercadocarbone/Documents/Develops/a2/node_modules/astro/dist/assets/services/sharp.js":"chunks/sharp_BROSblNR.mjs","/Users/santiagomercadocarbone/Documents/Develops/a2/src/components/ActivadosApp":"_astro/ActivadosApp.C0HBWsne.js","@astrojs/react/client.js":"_astro/client.BE3be5O-.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[],"assets":["/_astro/index.Djv-7Kqq.css","/_astro/ActivadosApp.C0HBWsne.js","/_astro/client.BE3be5O-.js","/_astro/index.Chpzn5vo.js","/fonts/ClashGrotesk-Bold.eot","/fonts/ClashGrotesk-Bold.ttf","/fonts/ClashGrotesk-Bold.woff","/fonts/ClashGrotesk-Bold.woff2","/fonts/ClashGrotesk-Extralight.eot","/fonts/ClashGrotesk-Extralight.ttf","/fonts/ClashGrotesk-Extralight.woff","/fonts/ClashGrotesk-Extralight.woff2","/fonts/ClashGrotesk-Light.eot","/fonts/ClashGrotesk-Light.ttf","/fonts/ClashGrotesk-Light.woff","/fonts/ClashGrotesk-Light.woff2","/fonts/ClashGrotesk-Medium.eot","/fonts/ClashGrotesk-Medium.ttf","/fonts/ClashGrotesk-Medium.woff","/fonts/ClashGrotesk-Medium.woff2","/fonts/ClashGrotesk-Regular.eot","/fonts/ClashGrotesk-Regular.ttf","/fonts/ClashGrotesk-Regular.woff","/fonts/ClashGrotesk-Regular.woff2","/fonts/ClashGrotesk-Semibold.eot","/fonts/ClashGrotesk-Semibold.ttf","/fonts/ClashGrotesk-Semibold.woff","/fonts/ClashGrotesk-Semibold.woff2","/fonts/ClashGrotesk-Variable.eot","/fonts/ClashGrotesk-Variable.ttf","/fonts/ClashGrotesk-Variable.woff","/fonts/ClashGrotesk-Variable.woff2"],"buildFormat":"directory","checkOrigin":true,"allowedDomains":[],"actionBodySizeLimit":1048576,"serverIslandNameMap":[],"key":"czCZ86pNkKl+hfh7G7zhAtBrGIqpEmDw167DaPCnZv4="});
if (manifest.sessionConfig) manifest.sessionConfig.driverModule = null;

export { manifest };
