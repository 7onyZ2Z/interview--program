# AI 物品识别工具

一个基于 Next.js App Router 的单页应用：上传图片后，服务端调用 OpenAI 兼容多模态模型，返回图片中物品的名称与估算重量。

## 1. 项目简介

本项目聚焦一个清晰场景：

- 输入：用户上传 JPG/PNG/WebP 图片
- 处理：后端将图片转为 Base64 Data URL，调用多模态模型识别
- 输出：结构化结果 `{ name, weight }`

适用场景：

- AI 能力 PoC（图片理解 + 结构化输出）
- 轻量级视觉识别演示项目
- 作为多模态 API 代理层的工程模板

## 2. 功能特性

- 支持点击上传和拖拽上传
- 前端文件校验（格式、大小）
- 图片预览与重传
- 一键发起识别并展示结果
- 后端统一校验与错误处理
- 模型返回 JSON 结果解析与字段完整性校验
- 环境变量可配置模型与服务商地址

## 3. 技术栈

- 框架：Next.js 16（App Router）
- 语言：TypeScript
- UI：React 19 + Tailwind CSS 4
- AI SDK：openai

## 4. 核心架构

```text
浏览器（上传图片）
	 -> POST /api/recognize (multipart/form-data)
			-> 图片校验 + Base64 转换
			-> OpenAI 兼容多模态接口
			-> JSON 解析与字段校验
	 <- { success, data: { name, weight } }
```

设计原则：

- 前后端双重校验，提升输入质量
- API 返回统一结构，便于前端消费
- 模型输出强约束为 JSON，降低解析复杂度

## 5. 目录结构

```text
.
├── docs/
│   └── superpowers/
│       ├── plans/
│       └── specs/
├── public/
├── src/
│   └── app/
│       ├── api/
│       │   └── recognize/
│       │       └── route.ts      # 识别 API
│       ├── globals.css           # 全局样式（Tailwind）
│       ├── layout.tsx            # 根布局和 metadata
│       └── page.tsx              # 上传、预览、识别、结果展示
├── eslint.config.mjs
├── next.config.ts
├── package.json
└── tsconfig.json
```

## 6. 环境要求

- Node.js 18.18+（建议 Node.js 20+）
- npm 9+
- 可用的 OpenAI 兼容多模态 API 服务

## 7. 快速开始

### 7.1 安装依赖

```bash
npm install
```

### 7.2 配置环境变量

在项目根目录创建 `.env.local`：

```bash
OPENAI_API_KEY=your-api-key
OPENAI_BASE_URL=https://api.openai.com/v1
MODEL_NAME=gpt-4o
```

变量说明：

- `OPENAI_API_KEY`：访问模型服务的密钥（必填）
- `OPENAI_BASE_URL`：OpenAI 兼容接口地址（可选，不填时使用 SDK 默认地址）
- `MODEL_NAME`：模型名称（可选，默认 `gpt-4o`）

### 7.3 启动开发环境

```bash
npm run dev
```

默认访问地址：<http://localhost:3000>

### 7.4 生产构建与启动

```bash
npm run build
npm run start
```

### 7.5 代码检查

```bash
npm run lint
```

## 8. API 文档

### 8.1 接口信息

- 方法：`POST`
- 路径：`/api/recognize`
- Content-Type：`multipart/form-data`
- 表单字段：`image`

### 8.2 请求约束

- 文件类型：`image/jpeg`、`image/png`、`image/webp`
- 文件大小：不超过 10MB

### 8.3 成功响应

```json
{
	"success": true,
	"data": {
		"name": "苹果",
		"weight": "约200g"
	}
}
```

### 8.4 失败响应

```json
{
	"success": false,
	"error": "错误信息"
}
```

常见状态码：

- `400`：请求参数错误（未上传文件、格式不支持、超出大小限制）
- `500`：模型调用失败、模型返回异常、JSON 解析失败等服务端问题

### 8.5 curl 调用示例

```bash
curl -X POST "http://localhost:3000/api/recognize" \
	-F "image=@/absolute/path/to/your-image.jpg"
```

## 9. 识别流程说明

服务端主要流程如下：

1. 读取 `FormData` 并获取 `image`
2. 校验文件对象、MIME 类型与大小
3. 将图片二进制转换为 Base64 Data URL
4. 调用 `chat.completions.create` 发送图文消息
5. 从模型文本中提取 JSON 并解析
6. 校验 `name` 与 `weight` 字段后返回

模型提示词策略：

- 在 system prompt 中明确要求“严格 JSON 输出”
- 限制响应字段为 `name` 与 `weight`
- 避免返回解释文本，降低后处理复杂度

## 10. 前端交互说明

页面状态流转：

1. 空状态：显示上传拖拽区域
2. 预览状态：展示图片与操作按钮（识别 / 重新上传）
3. 识别中：按钮进入 loading
4. 完成状态：展示识别结果
5. 错误状态：展示中文错误提示

## 11. 安全与工程建议

- API Key 仅放在服务端环境变量，不在前端暴露
- 建议生产环境增加鉴权、限流与日志脱敏
- 建议对上传接口加上请求频控与文件扫描策略
- 建议在 API 层补充请求链路追踪（traceId）

## 12. 常见问题排查

### 12.1 页面识别失败

- 检查 `.env.local` 是否存在且变量名正确
- 检查 `OPENAI_API_KEY` 是否有效、是否有模型权限
- 检查 `OPENAI_BASE_URL` 是否是兼容的接口地址
- 检查 `MODEL_NAME` 是否支持图像输入

### 12.2 返回“模型返回格式异常”

- 说明模型输出未符合 JSON 约束
- 可优化 prompt 约束或切换更稳定的模型

### 12.3 上传后无反应或网络错误

- 检查浏览器 DevTools 的 Network 请求
- 检查本地服务是否正常运行在 3000 端口

## 13. 后续优化方向

- 增加识别历史记录
- 支持批量图片识别
- 结构化输出更多字段（类别、置信度、估算区间）
- 引入单元测试与 API 集成测试
- 增加监控告警与可观测性指标

## 14. 许可证

当前仓库未声明许可证。如需开源发布，请补充 `LICENSE` 文件并在本节更新。
