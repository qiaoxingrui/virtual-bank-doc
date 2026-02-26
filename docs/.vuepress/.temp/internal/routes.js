export const redirects = JSON.parse("{}")

export const routes = Object.fromEntries([
  ["/", { loader: () => import(/* webpackChunkName: "index.html" */"/Users/sunray/Documents/virtual-bank-doc/virtual-bank-doc/docs/.vuepress/.temp/pages/index.html.js"), meta: {"title":"虚拟账号平台"} }],
  ["/open-api-guide.html", { loader: () => import(/* webpackChunkName: "open-api-guide.html" */"/Users/sunray/Documents/virtual-bank-doc/virtual-bank-doc/docs/.vuepress/.temp/pages/open-api-guide.html.js"), meta: {"title":"Open API 对接指南"} }],
  ["/en/", { loader: () => import(/* webpackChunkName: "en_index.html" */"/Users/sunray/Documents/virtual-bank-doc/virtual-bank-doc/docs/.vuepress/.temp/pages/en/index.html.js"), meta: {"title":"Virtual Account Platform"} }],
  ["/en/open-api-guide.html", { loader: () => import(/* webpackChunkName: "en_open-api-guide.html" */"/Users/sunray/Documents/virtual-bank-doc/virtual-bank-doc/docs/.vuepress/.temp/pages/en/open-api-guide.html.js"), meta: {"title":"Open API Integration Guide"} }],
  ["/zh-TW/", { loader: () => import(/* webpackChunkName: "zh-TW_index.html" */"/Users/sunray/Documents/virtual-bank-doc/virtual-bank-doc/docs/.vuepress/.temp/pages/zh-TW/index.html.js"), meta: {"title":"虛擬帳號平台"} }],
  ["/zh-TW/open-api-guide.html", { loader: () => import(/* webpackChunkName: "zh-TW_open-api-guide.html" */"/Users/sunray/Documents/virtual-bank-doc/virtual-bank-doc/docs/.vuepress/.temp/pages/zh-TW/open-api-guide.html.js"), meta: {"title":"Open API 串接指南"} }],
  ["/404.html", { loader: () => import(/* webpackChunkName: "404.html" */"/Users/sunray/Documents/virtual-bank-doc/virtual-bank-doc/docs/.vuepress/.temp/pages/404.html.js"), meta: {"title":""} }],
]);
