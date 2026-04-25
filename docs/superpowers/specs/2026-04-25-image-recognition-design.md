# AI 图片识别工具 — 设计文档

## 概述

一个极简单页 AI 图片识别工具。用户上传图片，后端调用 OpenAI 兼容多模态 API，返回物品名称和估算重量。

技术栈：Next.js 14+ (App Router)，TypeScript，Tailwind CSS，`openai` SDK。

## 架构

```
用户浏览器
   │
   ├─ 页面: / (单页应用)
   │    ├─ 图片上传区域（拖拽 + 点击上传）
   │    ├─ 预览缩略图
   │    └─ 结果展示（物品名称 + 估算重量）
   │
   └─ API: POST /api/recognize
        ├─ 接收 multipart/form-data (图片)
        ├─ 将图片转 base64，调用 OpenAI 兼容接口
        └─ 返回 { name: string, weight: string }
```

方案选择：单 API Route + 客户端调用。不做 provider 抽象，通过环境变量配置 `baseUrl` 切换提供商。

## 环境变量

- `OPENAI_BASE_URL` — API 基础地址（如 `https://api.openai.com/v1`）
- `OPENAI_API_KEY` — API 密钥
- `MODEL_NAME` — 模型名称（如 `gpt-4o`）

## 前端设计

单页面，从上到下布局：

1. **标题区**：工具名称 "AI 物品识别"
2. **上传区**：虚线框，支持点击选择文件和拖拽上传，限制格式 jpg/png/webp，大小限制 10MB
3. **预览区**：上传后显示缩略图 + "识别" 按钮 + "重新上传" 按钮
4. **结果区**：识别完成后显示物品名称和估算重量，纯文本展示
5. **状态提示**：上传中 / 识别中的 loading 状态，识别失败时的错误提示

交互流程：

```
空状态 → 上传图片 → 预览 + 识别按钮 → 点击识别 → loading → 显示结果
                                    ↓
                              重新上传 → 回到空状态
```

样式：纯 Tailwind CSS，不使用 UI 组件库。

## 后端 API 设计

### 接口

`POST /api/recognize`

### 请求

`multipart/form-data`，字段名 `image`，接受 jpg/png/webp。

### 处理流程

1. 校验文件存在性和格式/大小
2. 文件转 base64
3. 调用 OpenAI 兼容接口，system prompt 要求模型返回 JSON 格式 `{name, weight}`
4. 解析模型返回的 JSON，返回给前端

### Prompt 设计

- System：告知模型它是物品识别专家，返回严格 JSON 格式 `{name, weight}`
- User：携带图片 base64，要求识别物品名称和估算重量

### 响应格式

成功：
```json
{ "success": true, "data": { "name": "苹果", "weight": "约200g" } }
```

失败：
```json
{ "success": false, "error": "错误信息" }
```

### 错误处理

- 文件缺失或格式不对 → 400
- API 调用失败或返回解析失败 → 500

## 项目结构

```
src/
├── app/
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 主页面（上传 + 结果展示）
│   ├── globals.css         # 全局样式（Tailwind）
│   └── api/
│       └── recognize/
│           └── route.ts    # 识别 API
├── .env.local              # 环境变量
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```
