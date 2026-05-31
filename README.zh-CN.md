# ChatGPT 价格对比

[English README](./README.md)

一个用于比较 ChatGPT 订阅在不同国家和地区价格的 React 应用。应用会从 OpenAI 的价格配置接口读取国家/地区定价，将价格转换为用户选择的显示货币，并按价格排序展示。

## 功能

- 按套餐和计费周期查看全球订阅价格
- 使用实时汇率换算为显示货币
- 按换算价格升序或降序排序
- 复制国家/地区代码和货币代码，例如 `US USD`
- 通过全局刷新按钮重新请求最新后端数据
- 多语言、深色模式和本地偏好保存

## 技术栈

- React 19
- TypeScript
- Vite
- HeroUI v3
- Tailwind CSS v4
- Zustand
- Cloudflare Pages

## 本地开发

```bash
npm install
npm run dev
```

打开 Vite 输出的本地地址。默认通常是 `http://127.0.0.1:5173/`。

## 验证

```bash
npm test
npm run lint
npm run build
```

## Cloudflare 部署

当前项目配置为 Cloudflare Pages 静态部署。API Proxy Worker 已暂时禁用，用于测试部署后的浏览器直连上游价格接口是否会遇到 CORS 限制。

部署前请先登录 Wrangler：

```bash
npx wrangler login
```

然后构建并部署：

```bash
npm run deploy:pages
```

如果在 Cloudflare Pages 控制台配置项目，请使用：

- 构建命令：`npm run build`
- 构建输出目录：`dist`

`worker/index.ts` 和 `wrangler.toml` 中的 Worker/API Proxy 配置已暂时注释。
当前有效的 Wrangler 配置只会让 Pages 上传 `dist` 目录。
`deploy:pages` 脚本会为 Linus 的 Cloudflare 账号设置 `CLOUDFLARE_ACCOUNT_ID`，便于 Wrangler 在非交互模式下部署。
