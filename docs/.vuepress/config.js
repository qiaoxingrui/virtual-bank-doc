import { defaultTheme } from '@vuepress/theme-default'
import { defineUserConfig } from 'vuepress'
import { viteBundler } from '@vuepress/bundler-vite'

export default defineUserConfig({
  locales: {
    '/': {
      lang: 'zh-CN',
      title: '虚拟账号平台',
      description: 'Open API 对接文档',
    },
    '/zh-TW/': {
      lang: 'zh-TW',
      title: '虛擬帳號平台',
      description: 'Open API 串接文件',
    },
    '/en/': {
      lang: 'en-US',
      title: 'Virtual Account Platform',
      description: 'Open API Integration Guide',
    },
  },

  theme: defaultTheme({
    locales: {
      '/': {
        selectLanguageName: '简体中文',
        selectLanguageText: '选择语言',
        navbar: [
          { text: '首页', link: '/' },
          { text: 'Open API 对接指南', link: '/open-api-guide' },
        ],
        sidebar: [
          { text: 'Open API 对接指南', link: '/open-api-guide' },
        ],
        lastUpdatedText: '上次更新',
        contributorsText: '贡献者',
        tip: '提示',
        warning: '注意',
        danger: '警告',
        notFound: ['页面未找到'],
        backToHome: '返回首页',
      },
      '/zh-TW/': {
        selectLanguageName: '繁體中文',
        selectLanguageText: '選擇語言',
        navbar: [
          { text: '首頁', link: '/zh-TW/' },
          { text: 'Open API 串接指南', link: '/zh-TW/open-api-guide' },
        ],
        sidebar: [
          { text: 'Open API 串接指南', link: '/zh-TW/open-api-guide' },
        ],
        lastUpdatedText: '上次更新',
        contributorsText: '貢獻者',
        tip: '提示',
        warning: '注意',
        danger: '警告',
        notFound: ['頁面未找到'],
        backToHome: '返回首頁',
      },
      '/en/': {
        selectLanguageName: 'English',
        selectLanguageText: 'Languages',
        navbar: [
          { text: 'Home', link: '/en/' },
          { text: 'Open API Guide', link: '/en/open-api-guide' },
        ],
        sidebar: [
          { text: 'Open API Integration Guide', link: '/en/open-api-guide' },
        ],
        lastUpdatedText: 'Last Updated',
        contributorsText: 'Contributors',
        notFound: ['Page not found'],
        backToHome: 'Back to Home',
      },
    },
  }),

  bundler: viteBundler(),
})
