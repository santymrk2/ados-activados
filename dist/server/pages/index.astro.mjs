import { e as createComponent, k as renderHead, l as renderSlot, r as renderTemplate, n as renderComponent } from '../chunks/astro/server_igTFnf3S.mjs';
import 'piccolore';
import 'clsx';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

const $$Layout = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`<html lang="es"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Activados</title>${renderHead()}</head> <body> ${renderSlot($$result, $$slots["default"])} </body></html>`;
}, "/Users/santiagomercadocarbone/Documents/Develops/a2/src/layouts/Layout.astro", void 0);

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {}, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "ActivadosApp", null, { "client:only": "react", "client:component-hydration": "only", "client:component-path": "/Users/santiagomercadocarbone/Documents/Develops/a2/src/components/ActivadosApp", "client:component-export": "default" })} ` })}`;
}, "/Users/santiagomercadocarbone/Documents/Develops/a2/src/pages/index.astro", void 0);

const $$file = "/Users/santiagomercadocarbone/Documents/Develops/a2/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
