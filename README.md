# 室友账单 AA 制系统 - 完整部署指南

##  前置准备

### 1. 必需账号
- GitHub 账号
- Google Cloud 账号（用于 OAuth）
- Vercel 账号
- Neon 账号（PostgreSQL 数据库）

##  详细部署步骤

### 步骤 1: 设置 Google OAuth

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

### 步骤 2: 设置 Neon 数据库

1. 访问 [Neon](https://neon.tech/)
2. 注册并创建新项目
3. 选择免费套餐
4. 复制数据库连接字符串（格式类似）:
   ```
   postgresql://username:password@host/database?sslmode=require
   ```

### 步骤 3: 配置环境变量

修改 `.env.local` 文件：

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

### 步骤 4: 初始化 Prisma

生成 Prisma Client 并迁移数据库:
```bash
npx prisma generate
npx prisma db push
```


### 步骤 5: 部署到 Vercel

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

##  测试功能

### 本地测试
```bash
npm run dev
```
访问 http://localhost:3000



##  常见问题解决

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
