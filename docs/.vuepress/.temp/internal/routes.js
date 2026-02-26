export const redirects = JSON.parse("{}")

export const routes = Object.fromEntries([
  ["/", { loader: () => import(/* webpackChunkName: "index.html" */"/Users/sunray/Documents/virtual-bank-doc/virtual-bank-doc/docs/.vuepress/.temp/pages/index.html.js"), meta: {"title":"Home"} }],
  ["/get-started.html", { loader: () => import(/* webpackChunkName: "get-started.html" */"/Users/sunray/Documents/virtual-bank-doc/virtual-bank-doc/docs/.vuepress/.temp/pages/get-started.html.js"), meta: {"title":"Get Started"} }],
  ["/open-api-guide.html", { loader: () => import(/* webpackChunkName: "open-api-guide.html" */"/Users/sunray/Documents/virtual-bank-doc/virtual-bank-doc/docs/.vuepress/.temp/pages/open-api-guide.html.js"), meta: {"title":"Open API 对接指南"} }],
  ["/404.html", { loader: () => import(/* webpackChunkName: "404.html" */"/Users/sunray/Documents/virtual-bank-doc/virtual-bank-doc/docs/.vuepress/.temp/pages/404.html.js"), meta: {"title":""} }],
]);

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  if (__VUE_HMR_RUNTIME__.updateRoutes) {
    __VUE_HMR_RUNTIME__.updateRoutes(routes)
  }
  if (__VUE_HMR_RUNTIME__.updateRedirects) {
    __VUE_HMR_RUNTIME__.updateRedirects(redirects)
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(({ routes, redirects }) => {
    __VUE_HMR_RUNTIME__.updateRoutes(routes)
    __VUE_HMR_RUNTIME__.updateRedirects(redirects)
  })
}
