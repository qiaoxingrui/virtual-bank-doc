import { GitContributors } from "/Users/sunray/Documents/virtual-bank-doc/virtual-bank-doc/node_modules/.pnpm/@vuepress+plugin-git@2.0.0-rc.88_vuepress@2.0.0-rc.20_@vuepress+bundler-vite@2.0.0-rc.2_9fd2b117fb7c69cff0280a6efcf179c1/node_modules/@vuepress/plugin-git/lib/client/components/GitContributors.js";
import { GitChangelog } from "/Users/sunray/Documents/virtual-bank-doc/virtual-bank-doc/node_modules/.pnpm/@vuepress+plugin-git@2.0.0-rc.88_vuepress@2.0.0-rc.20_@vuepress+bundler-vite@2.0.0-rc.2_9fd2b117fb7c69cff0280a6efcf179c1/node_modules/@vuepress/plugin-git/lib/client/components/GitChangelog.js";

export default {
  enhance: ({ app }) => {
    app.component("GitContributors", GitContributors);
    app.component("GitChangelog", GitChangelog);
  },
};
