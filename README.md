# Metai Game Editor

## 项目简介

这是一个基于 Next.js 开发的游戏编辑器前端项目，使用了 Konva 进行画布操作。

## 环境要求

- Node.js (推荐 v18 或更高版本)
- npm 或 yarn 或 pnpm

## 快速开始

### 1. 安装依赖

在项目根目录下运行以下命令安装依赖：

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. 启动开发服务器

安装完成后，运行以下命令启动开发环境：

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

启动成功后，打开浏览器访问 [http://localhost:3000](http://localhost:3000) 即可看到项目运行效果。

## 构建生产版本

如果需要构建生产环境版本，请运行：

```bash
npm run build
```

构建完成后，可以通过以下命令启动生产服务：

```bash
npm run start
```

## 技术栈

- **框架**: [Next.js](https://nextjs.org/) 14 (App Router)
- **语言**: [TypeScript](https://www.typescriptlang.org/)
- **样式**: [Tailwind CSS](https://tailwindcss.com/)
- **画布库**: [Konva](https://konvajs.org/) / [React Konva](https://konvajs.org/docs/react/index.html)
- **图标**: [Lucide React](https://lucide.dev/)

## 目录结构

- `src/app`: Next.js App Router 页面及布局
- `src/components`: 组件目录
  - `components/workspace`: 编辑器主要工作区组件
    - `elements`: 画布上的各种元素组件 (矩形, 圆形, 文本等)
    - `toolbars`: 各种工具的属性面板
