export const siteData = JSON.parse("{\"base\":\"/\",\"lang\":\"en-US\",\"title\":\"\",\"description\":\"\",\"head\":[],\"locales\":{\"/\":{\"lang\":\"zh-CN\",\"title\":\"虚拟账号平台\",\"description\":\"Open API 对接文档\"},\"/zh-TW/\":{\"lang\":\"zh-TW\",\"title\":\"虛擬帳號平台\",\"description\":\"Open API 串接文件\"},\"/en/\":{\"lang\":\"en-US\",\"title\":\"Virtual Account Platform\",\"description\":\"Open API Integration Guide\"}}}")

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  if (__VUE_HMR_RUNTIME__.updateSiteData) {
    __VUE_HMR_RUNTIME__.updateSiteData(siteData)
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(({ siteData }) => {
    __VUE_HMR_RUNTIME__.updateSiteData(siteData)
  })
}
