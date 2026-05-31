# ChatGPT 价格对比

[English README](./README.md)

一个用于比较 ChatGPT 订阅在不同国家和地区价格的 React 应用。应用会通过自托管 TypeScript 后端读取价格配置，将价格转换为用户选择的显示货币，并按价格排序展示。

## 功能

- 按套餐和计费周期查看全球订阅价格
- 使用实时汇率换算为显示货币
- 按换算价格升序或降序排序
- 复制国家/地区代码和货币代码，例如 `US USD`
- 通过全局刷新按钮重新请求最新后端数据
- 通过同源 TypeScript 后端代理价格 API 请求
- 后端对上游价格响应缓存一天
- 多语言、深色模式和本地偏好保存
- 使用 HeroUI v3 和 Tailwind CSS v4 构建响应式界面

## 技术栈

- React 19
- TypeScript
- Vite
- HeroUI v3
- Tailwind CSS v4
- Zustand
- Node.js TypeScript 后端

## 本地开发

安装依赖：

```bash
npm install
```

启动后端 API 和静态文件服务：

```bash
npm run dev:server
```

另开一个终端启动 Vite：

```bash
npm run dev
```

打开 Vite 输出的本地地址。默认通常是 `http://127.0.0.1:5173/`。开发环境下，Vite 会把 `/api/*` 请求代理到 `http://127.0.0.1:8787`。

## 生产部署

构建前端和后端：

```bash
npm run build
```

启动自托管服务：

```bash
PORT=8787 npm start
```

生产服务会从 `dist/` 提供构建后的 React 应用，并在 `/api/proxy/*` 处理价格 API 代理请求。域名、TLS 和进程守护可以用你服务器上常用的方案放在 Node 服务前面，例如 Nginx、Caddy、systemd、PM2、Docker 或平台服务。

后端会把成功的上游价格响应缓存在内存中一天。每次前端请求都会优先读取后端缓存；缓存过期后，下一次请求会重新访问上游 API 并刷新缓存。

## Docker

构建运行镜像：

```bash
docker build -t openai-sub-price .
```

运行容器：

```bash
docker run --rm -p 8787:8787 openai-sub-price
```

Dockerfile 使用多阶段构建。最终镜像只包含 Node.js、编译后的后端 `dist-server/` 和构建后的前端 `dist/`。

## Docker Compose

可以使用 [`docker-compose.example.yml`](./docker-compose.example.yml) 作为服务器部署模板：

```bash
docker compose -f docker-compose.example.yml up -d
```

示例会拉取 `ghcr.io/linusxiong/openai_sub_price:latest`，并把应用暴露在 `8787` 端口。

## GitHub Actions 容器发布

仓库包含一个手动触发的 GitHub Actions workflow：[`.github/workflows/docker-image.yml`](./.github/workflows/docker-image.yml)。它会构建 Docker 镜像，并发布到 GitHub Container Registry。

手动发布容器：

1. 打开 GitHub 仓库。
2. 进入 **Actions**。
3. 选择 **Build Docker Image**。
4. 点击 **Run workflow**。
5. 输入镜像标签，例如 `latest` 或 `2026-05-31`。

发布标签：

- `ghcr.io/linusxiong/openai_sub_price:<image_tag>`
- `ghcr.io/linusxiong/openai_sub_price:<commit_sha>`

镜像发布后，可以在服务器上使用 Docker Compose 或你偏好的容器运行方式手动部署。

## 验证

```bash
npm test
npm run lint
npm run build
```

## 项目结构

```text
src/
  components/      React UI 组件
  hooks/           价格和汇率 hooks
  i18n/            多语言文案
  services/        价格和汇率客户端
  store/           本地持久化偏好
  utils/           价格和货币工具函数
server/
  index.ts         自托管 Node 服务
  proxy.ts         价格 API 代理处理器
docker-compose.example.yml
                  Docker Compose 部署示例
```

## 说明

应用会使用浏览器会话缓存，避免在短时间内反复请求所有国家/地区的配置。可以使用页面顶部的刷新按钮清空浏览器缓存，并向后端重新请求数据。后端在服务端缓存未过期时仍会返回一天内的缓存响应。
