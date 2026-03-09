# ZHAO Plateforme 2026

ZHAO Plateforme 2026 是一个门店运营平台，包含后台 API、员工培训与公告系统、商品与供应商管理、订单流程和门店资料管理。

仓库当前是一个前后端分离的项目：

- `backend/`: NestJS + Prisma + MySQL
- `frontend/`: Expo Router + React Native Web
- `docker-compose.yml`: 本地 MySQL
- `docker-compose.prod.yml`: 生产环境后端容器编排
- `.gitlab-ci.yml`: GitLab 构建与部署流水线

## 主要功能

- 用户登录、注册、密码重置
- 员工角色、等级、岗位和培训权限管理
- 培训文档、公告发布、阅读追踪
- 公告标签索引与按员工等级可见范围控制
- 商品、供应商与图片管理
- 采购下单、订单历史、订单 PDF
- 门店资料与日常表格入口
- 媒体上传和文件公开访问

## 技术栈

- Backend: NestJS 11, Prisma 6, MySQL 8
- Frontend: Expo 54, React 19, React Native Web
- Auth: JWT
- Storage: 本地文件系统目录映射
- Deploy: Docker + GitLab CI/CD

## 目录结构

```text
.
├── backend/
│   ├── prisma/
│   └── src/
│       ├── auth/
│       ├── news/
│       ├── orders/
│       ├── products/
│       ├── restaurants/
│       ├── suppliers/
│       ├── uploads/
│       └── users/
├── frontend/
│   ├── app/
│   └── src/
│       ├── components/
│       ├── locales/
│       ├── services/
│       └── types/
├── docker-compose.yml
├── docker-compose.prod.yml
└── README.md
```

## 环境要求

- Node.js 20+
- npm 10+
- MySQL 8
- Docker / Docker Compose（本地起数据库时需要）

## 本地开发

### 1. 安装依赖

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 2. 配置环境变量

复制本地环境样例：

```bash
cp .env.example .env
```

`.env.example` 里的关键变量：

- `PORT`: 后端端口，默认 `3000`
- `API_PREFIX`: 反向代理前缀，本地一般留空
- `DATABASE_URL`: Prisma 连接串
- `JWT_SECRET`: JWT 密钥
- `CORS_ORIGIN`: 允许的前端来源
- `STORAGE_ROOT_PATH`: 上传文件物理目录
- `PUBLIC_API_BASE_URL`: 生成公开文件地址时使用
- `APP_WEB_URL`: 前端地址
- `MAIL_*`: 密码找回邮件配置
- `ADMIN_EMAILS`: 初始化管理员邮箱列表
- `ADMIN_DEFAULT_PASSWORD`: 初始化管理员默认密码

### 3. 启动数据库

如果本地直接使用 Docker MySQL：

```bash
npm run db:up
```

默认会把 MySQL 暴露到 `127.0.0.1:3307`。

如果你连的是远程 MySQL，也可以像下面这样走 SSH 隧道：

```bash
ssh -N -L 3307:127.0.0.1:3306 user@your-server
```

### 4. 生成 Prisma Client 并迁移数据库

```bash
npm run prisma:generate
npm run prisma:migrate
```

如需执行生产迁移：

```bash
npm run prisma:migrate:deploy
```

如需初始化管理员或测试数据：

```bash
npm run prisma:seed
```

### 5. 启动后端

```bash
npm run start:dev
```

接口文档默认在：

```text
http://localhost:3000/docs
```

### 6. 启动前端

```bash
npm --prefix frontend run web
```

也可以按平台启动：

```bash
npm --prefix frontend run android
npm --prefix frontend run ios
```

## 常用命令

### 根目录

```bash
npm run db:up
npm run db:down
npm run prisma:generate
npm run prisma:migrate
npm run prisma:migrate:deploy
npm run prisma:seed
npm run start:dev
npm run test
```

### Backend

```bash
npm --prefix backend run build
npm --prefix backend run lint
npm --prefix backend run test
npm --prefix backend run test:e2e
```

### Frontend

```bash
npm --prefix frontend run web
npm --prefix frontend run build
npm --prefix frontend run typecheck
```

## 上传与文件访问

上传模块支持图片、视频和常见办公文档。

认证接口：

- `POST /uploads/single`
- `POST /uploads/multiple`

公开访问：

- `GET /uploads/:category/:fileName`

说明：

- 文件保存路径由 `STORAGE_ROOT_PATH` 控制
- 对外生成的完整 URL 由 `PUBLIC_API_BASE_URL` 控制
- 如果反向代理保留了前缀路径，例如 `/backend2`，需要同步设置 `API_PREFIX` 和 `PUBLIC_API_BASE_URL`

示例：

- `API_PREFIX="backend2"`
- `PUBLIC_API_BASE_URL="https://api.example.com/backend2"`

这样后端会暴露为：

- `/backend2/auth/*`
- `/backend2/uploads/*`

## 生产部署

生产配置示例见：

- `.env.production.example`
- `docker-compose.prod.yml`
- `.gitlab-ci.yml`

当前 GitLab CI/CD 流程大致是：

1. 构建后端 Docker 镜像
2. 推送镜像到 GitLab Registry
3. SSH 到服务器
4. 执行 Prisma 生产迁移
5. 执行 seed
6. 使用 `docker compose` 更新后端服务

生产环境需要准备至少这些变量：

- `SERVER_IP`
- `SSH_PRIVATE_KEY`
- `ADMIN_EMAILS`
- `ADMIN_DEFAULT_PASSWORD`

## 开发建议

- 先改 Prisma schema，再执行 `npm run prisma:generate`
- 前端接口类型变更后，同步更新 `frontend/src/services/*`
- 提交前至少跑一遍：

```bash
npm --prefix backend run build
npm --prefix frontend run typecheck
```

## 备注

- 当前仓库根目录脚本主要代理到 `backend/`
- 前端是独立 Expo 项目，需要单独安装和启动
- README 以当前仓库代码结构为准，不再沿用 Nest 默认模板
