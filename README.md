# 地理词简写查询系统

一个基于 Next.js 和 MongoDB 的地理专业术语简写查询系统。

## 功能特点

- 🔍 智能搜索地理词简写
- ➕ 用户可添加新的简写词条
- 🛠️ 完整的管理后台
- 📱 响应式设计
- 🔒 安全的数据库连接

## 环境配置

1. 复制环境变量文件：
\`\`\`bash
cp .env.example .env.local
\`\`\`

2. 在 `.env.local` 中配置你的 MongoDB 连接字符串：
\`\`\`env
MONGODB_URI=your-mongodb-connection-string
\`\`\`

## 安装和运行

1. 安装依赖：
\`\`\`bash
npm install
\`\`\`

2. 启动开发服务器：
\`\`\`bash
npm run dev
\`\`\`

3. 打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 安全注意事项

- ✅ 数据库连接字符串存储在环境变量中
- ✅ `.env.local` 文件已添加到 `.gitignore`
- ✅ 所有数据库操作仅在服务端执行
- ✅ API 路由有适当的错误处理

## 部署

部署到 Vercel 时，请在项目设置中添加环境变量：
- `MONGODB_URI`: 你的 MongoDB 连接字符串

## 技术栈

- Next.js 14 (App Router)
- MongoDB + Mongoose
- TypeScript
- Tailwind CSS
- shadcn/ui
