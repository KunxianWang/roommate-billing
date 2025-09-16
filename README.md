# 室友账单 AA 制系统 - 完整部署指南

##  前置准备

### 1. 必需账号
- GitHub 账号
- Google Cloud 账号（用于 OAuth）
- Vercel 账号
- Neon 账号（PostgreSQL 数据库）

##  详细部署步骤

### 步骤 1: 创建项目

```bash
# 创建 Next.js 项目
npx create-next-app@latest roommate-billing --typescript --tailwind --eslint --app

# 进入项目目录
cd roommate-billing

# 安装依赖
npm install next-auth @auth/prisma-adapter prisma @prisma/client
npm install --save-dev @types/node
```

### 步骤 2: 设置 Google OAuth

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google+ API:
   - 导航到 "API 和服务" → "库"
   - 搜索 "Google+ API" 并启用
4. 创建 OAuth 2.0 凭据:
   - 导航到 "API 和服务" → "凭据"
   - 点击 "创建凭据" → "OAuth 客户端 ID"
   - 应用类型选择 "Web 应用"
   - 添加授权重定向 URI:
     - 开发环境: `http://localhost:3000/api/auth/callback/google`
     - 生产环境: `https://your-app.vercel.app/api/auth/callback/google`
   - 保存客户端 ID 和客户端密钥

### 步骤 3: 设置 Neon 数据库

1. 访问 [Neon](https://neon.tech/)
2. 注册并创建新项目
3. 选择免费套餐
4. 复制数据库连接字符串（格式类似）:
   ```
   postgresql://username:password@host/database?sslmode=require
   ```

### 步骤 4: 配置环境变量

创建 `.env.local` 文件：

```env
# 数据库配置
DATABASE_URL="你的Neon数据库连接字符串"

# NextAuth 配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="使用 openssl rand -base64 32 生成的密钥"

# Google OAuth
GOOGLE_CLIENT_ID="你的Google客户端ID"
GOOGLE_CLIENT_SECRET="你的Google客户端密钥"

# Cron Job 安全密钥
CRON_SECRET="自定义的强密码"
```

生成 NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

### 步骤 5: 初始化 Prisma

1. 初始化 Prisma:
```bash
npx prisma init
```

2. 将前面提供的 schema 复制到 `prisma/schema.prisma`

3. 修改 Settlement 模型（添加到 schema.prisma）:
```prisma
model Settlement {
  id          String   @id @default(cuid())
  fromUserId  String
  fromUser    User     @relation("SettlementFrom", fields: [fromUserId], references: [id])
  toUserId    String
  toUser      User     @relation("SettlementTo", fields: [toUserId], references: [id])
  amount      Float
  createdAt   DateTime @default(now())
  completed   Boolean  @default(false)
  completedAt DateTime?
}
```

同时在 User 模型中添加:
```prisma
model User {
  // ... 其他字段
  
  settlementsFrom Settlement[] @relation("SettlementFrom")
  settlementsTo   Settlement[] @relation("SettlementTo")
}
```

4. 生成 Prisma Client 并迁移数据库:
```bash
npx prisma generate
npx prisma db push
```

### 步骤 6: 创建项目文件结构

```
roommate-billing/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   ├── expenses/
│   │   │   └── route.ts
│   │   ├── dashboard/
│   │   │   └── route.ts
│   │   ├── settle/
│   │   │   └── route.ts
│   │   └── users/
│   │       └── route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── Dashboard.tsx
│   ├── ExpenseForm.tsx
│   ├── ExpenseList.tsx
│   ├── LoginButton.tsx
│   └── SessionProvider.tsx
├── lib/
│   └── prisma.ts
├── prisma/
│   └── schema.prisma
├── .env.local
├── vercel.json
└── package.json
```

### 步骤 7: 配置 Vercel Cron Job

创建 `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/settle",
      "schedule": "0 0 * * 1"
    }
  ]
}
```

### 步骤 8: 部署到 Vercel

1. 推送代码到 GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/roommate-billing.git
git push -u origin main
```

2. 在 Vercel 部署:
   - 访问 [Vercel](https://vercel.com/)
   - 点击 "New Project"
   - 导入 GitHub 仓库
   - 配置环境变量（从 .env.local 复制所有变量）
   - 点击 "Deploy"

3. 部署后更新设置:
   - 获取 Vercel 分配的域名
   - 更新 Google OAuth 重定向 URI
   - 在 Vercel 环境变量中更新 NEXTAUTH_URL

### 步骤 9: 修复 NextAuth 配置

更新 `app/api/auth/[...nextauth]/route.ts` 中的 authOptions:

```typescript
import { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user && token?.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
  },
}

const handler = NextAuth(authOptions)
```

然后在需要获取 session 的 API 路由中:
```typescript
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getServerSession } from "next-auth"

const session = await getServerSession(authOptions)
```

##  测试功能

### 1. 本地测试
```bash
npm run dev
```
访问 http://localhost:3000

### 2. 功能测试清单
- [ ] Google 登录功能
- [ ] 添加开销
- [ ] 选择分摊人员
- [ ] 查看仪表盘
- [ ] 查看开销列表
- [ ] 筛选已结算/未结算

### 3. Cron Job 测试
可以手动触发结算 API:
```bash
curl -X POST https://your-app.vercel.app/api/settle \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## 🔧 常见问题解决

### 1. Prisma 客户端错误
```bash
npx prisma generate
```

### 2. 数据库连接失败
- 检查 DATABASE_URL 格式
- 确保包含 `?sslmode=require`

### 3. Google 登录失败
- 检查重定向 URI 配置
- 确保 Google+ API 已启用

### 4. Vercel 部署失败
- 检查所有环境变量是否正确设置
- 查看 Vercel 构建日志


如有问题，请参考文档或提交 Issue。
