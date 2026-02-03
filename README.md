# Metai Game Editor

## 项目简介

这是一个基于 Next.js 开发的游戏编辑器前端项目，使用了 Konva 进行画布操作。

## 环境要求

- Bun (推荐 v1.3+)
- Node.js (仅在部分数据库驱动/工具链场景下需要，推荐 v20.9+)

## 快速开始

### 1. 安装依赖

在项目根目录下运行以下命令安装依赖：

```bash
bun install
```

### 2. 启动开发服务器

安装完成后，运行以下命令启动开发环境：

```bash
bun run dev
```

启动成功后，打开浏览器访问 [http://localhost:3000](http://localhost:3000) 即可看到项目运行效果。

## 登录与认证（Better Auth）

本项目使用 Better Auth，直接在 Next.js 内提供邮箱登录与 Google 登录。

### 实现细节（代码级）

**服务端配置**

- 入口文件：`src/lib/auth.ts`
- 数据库使用 MySQL（`mysql2` 驱动）
- `betterAuth` 配置项：
  - `secret`：`BETTER_AUTH_SECRET`
  - `baseURL`：`BETTER_AUTH_URL`
  - `database`：MySQL Pool
  - `emailAndPassword.enabled = true`
  - `socialProviders.google`：`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`（两者都配置才启用）

**API 路由挂载**

- 路由文件：`src/app/api/auth/[...all]/route.ts`
- 使用 `toNextJsHandler(auth)` 暴露 `GET` / `POST`
- 显式设置 `runtime = "nodejs"`，确保数据库驱动可用
- OAuth 回调路径固定为：`/api/auth/callback/google`

**页面层鉴权**

- 登录页：`src/app/login/page.tsx`
  - `auth.api.getSession({ headers })` 判断是否已登录
  - 已登录直接 `redirect("/")`
- 首页：`src/app/page.tsx`
  - 同样通过 `auth.api.getSession` 校验
  - 未登录 `redirect("/login")`
  - 已登录展示 `AuthControls`（右上角退出）

**客户端登录逻辑**

- 客户端入口：`src/lib/auth-client.ts`（`createAuthClient()`）
- 组件：`src/components/Auth/LoginForm.tsx`
  - 邮箱登录：`authClient.signIn.email({ email, password })`
  - 邮箱注册：`authClient.signUp.email({ name, email, password })`
  - Google 登录：`authClient.signIn.social({ provider: "google" })`
- 退出登录：`src/components/Auth/AuthControls.tsx`
  - `authClient.signOut()` 后跳转 `/login`

### 1. 环境变量

复制 `.env.example` 为 `.env.local`（或 `.env`），并补齐以下变量：

```bash
BETTER_AUTH_SECRET=replace-with-a-strong-random-secret
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=mysql://USER:PASSWORD@127.0.0.1:3306/DB_NAME
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

> 生产环境请把 `BETTER_AUTH_URL` 改为线上域名，例如 `https://your-domain.com`。
> 若不需要 Google 登录，可不填 `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`。

### 2. 初始化数据库表

首次运行需要初始化 Better Auth 的数据库表（MySQL）：

```bash
bun run auth:init:mysql
```

如果出现 `Table 'xxx.verification' doesn't exist` 之类错误，说明数据库表还未初始化，请先执行上面的初始化命令再登录。

### 3. Google OAuth 回调地址

在 Google Cloud Console 的 OAuth Client 中添加以下回调地址：

- 本地：`http://localhost:3000/api/auth/callback/google`
- 生产：`https://your-domain.com/api/auth/callback/google`

## 构建生产版本

如果需要构建生产环境版本，请运行：

```bash
bun run build
```

构建完成后，可以通过以下命令启动生产服务：

```bash
bun run start
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
  - `src/components/Workspace`: 编辑器工作区（核心）
    - `Workspace.tsx`: 三栏布局与 Editor/Game 模式切换
    - `CanvasArea.tsx`: 工具栏、浮动属性面板、快捷键、下载导出等 UI 逻辑
    - `EditorStage.tsx`: Konva Stage/Layer 渲染与鼠标事件分发
    - `types/*`: 元素数据模型（ElementState / BaseElement / ToolType 等）
    - `editor/*`: 工具系统、元素注册、吸附/舞台工具函数、历史控制、右键菜单等
    - `chat|game|hierarchy|project/*`: 右侧聊天、游戏面板、左侧图层/项目面板
- `src/store/useWorkspaceStore.ts`: Zustand 全局状态与 zundo 撤销/重做历史
- `public/*`: 静态资源（默认图片等）
- `illustrate/*`: 项目截图/示意图

## 架构概览（编辑器主链路）

编辑器的核心链路可以概括为：状态（elements）→ 渲染（Konva）→ 交互（工具）→ 回写状态（并进入历史）。

- 页面入口：`src/app/page.tsx` 直接渲染 [Workspace](./src/components/Workspace/Workspace.tsx)
- 布局与模式：Workspace 负责左侧（图层/项目）、中间（Editor/Game）、右侧（聊天）三栏与模式切换
- 编辑器容器：CanvasArea 承载工具选择、缩放、浮动属性面板、快捷键（Undo/Redo、删除、切换工具等）
- 画布渲染：EditorStage 负责 Konva 的 Stage/Layer/Transformer，并把鼠标事件分发给当前工具实例

## 状态管理与历史（Zustand + zundo）

[useWorkspaceStore](./src/store/useWorkspaceStore.ts) 维护编辑器核心状态：

- `elements`: 画布元素列表（以类实例的形式存储，来自 `ElementFactory`）
- `selectedId`: 当前选中元素
- `activeTool`: 当前工具（select/hand/pen/pencil/shape/text 等）
- `guidelines`: 吸附对齐参考线
- `temporal(...)`: 通过 zundo 自动记录 `elements` 的变更，实现撤销/重做

说明：

- 历史只追踪 `elements`（selection/tool 不进入历史），避免 undo/redo 干扰 UI 状态
- 元素以不可变方式更新：`updateElement` 通过 `el.update(...)` 生成新实例，便于时间旅行与 React 渲染

## 元素模型（types 与 ElementFactory）

元素模型集中在 [BaseElement.ts](./src/components/Workspace/types/BaseElement.ts) 与 `types/ElementState.ts`：

- `BaseElement<T>`：抽象基类，提供 `toState()`、`update()`、`clone()` 等不可变操作
- `ShapeElement/TextElement/TextShapeElement/ImageElement/DrawElement`：不同元素类型的具体类
- `ElementFactory.create(state)`：把持久化的 state 转成对应元素类实例
- `ElementFactory.createDefault(type, x, y, id?)`：创建默认元素（拖拽/点击创建时使用）

## 渲染层（React Konva + 注册表）

渲染发生在 [EditorStage](./src/components/Workspace/EditorStage.tsx)：

- Konva `Stage`：承载缩放（scaleX/scaleY）与平移（x/y）
- `Layer`：渲染 `elements`（以及绘制中预览的 `previewElement`）
- `Transformer`：选中元素的缩放/旋转控制器
- 元素组件选择：通过 `editor/tools/ElementRegistry.ts`（注册表）按 `el.type` 找到对应 React 组件（通常位于各工具目录下的 `Element.tsx`）

为避免 Konva 在 SSR 环境报错，CanvasArea 使用 Next.js dynamic import 禁用 SSR：

- `const EditorStage = dynamic(() => import('./EditorStage'), { ssr: false })`

## 工具系统（ToolFactory + MouseAction）

工具系统位于 `src/components/Workspace/editor/tools/*`，核心思想是把“交互策略”封装为工具实例：

- `ToolType`：工具/元素类型枚举（在 `types/ToolType.ts`）
- `ToolFactory.createTool(activeTool)`：根据当前工具返回对应 MouseAction 实例
- `IMouseAction`：工具统一接口（onMouseDown/onMouseMove/onMouseUp/onDblClick）
- 事件流：Konva Stage 事件 → EditorStage → 当前 tool 的 MouseAction → 更新 store（elements/selection/guidelines）

新增一个工具的一般步骤（按现有约定）：

- 在 `editor/tools/<tool-name>/` 新增 `MouseAction.ts`（交互）与 `Element.tsx`（渲染）
- 在 ElementRegistry 注册渲染组件；在 ToolFactory 注册 MouseAction
- 如需属性面板，在对应目录补充 `InspectorBar.tsx`，并由 CanvasArea 按元素类型/工具状态决定显示

## 对齐吸附（Guidelines）

对齐吸附逻辑位于 `editor/utils/snapUtils.ts`：

- Transformer 的 `boundBoxFunc` 会计算与其他元素的对齐关系
- 命中吸附时写入 `guidelines`，EditorStage 渲染虚线参考线（Line）

## 常用快捷键（CanvasArea）

[CanvasArea](./src/components/Workspace/CanvasArea.tsx) 监听全局键盘事件：

- 撤销/重做：Ctrl/Cmd+Z，Shift+Ctrl/Cmd+Z 或 Ctrl/Cmd+Y
- 删除：Delete / Backspace
- 工具切换：V(select)、H(hand)、P(pen)、Shift+P(pencil)、R(rectangle)、O(circle)、T(text)

## 导出/下载（元素 PNG）

CanvasArea 内部实现了元素下载：

- 通过 Konva `stage.findOne('#' + selectedId)` 找到选中元素节点
- `node.toDataURL({ pixelRatio: 2, mimeType: 'image/png' })` 生成图片
- 通过创建 `<a download>` 触发浏览器下载

## 构建与部署

- 本地开发：`bun run dev`（默认 http://localhost:3000）
- 生产构建：`bun run build`
- 生产启动：`bun run start`
- Docker：仓库提供 [Dockerfile](./Dockerfile)，使用 Next.js `output: 'standalone'`（见 [next.config.mjs](./next.config.mjs)）生成更小的运行镜像
