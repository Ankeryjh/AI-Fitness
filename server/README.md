# AI-Fitness Node Backend

## 1. 安装

```bash
cd server
npm install
```

## 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`：
- `DATABASE_URL`
- `JWT_SECRET`
- `PORT`

## 3. 建表 + 种子数据

```bash
npm run migrate
```

> 该命令会执行 `sql/001_init.sql`：创建表、索引、触发器，并初始化默认动作。

## 4. 启动服务

```bash
npm run dev
```

健康检查：

```bash
curl http://localhost:3001/health
```

## 5. 接口测试

测试用例文档：`docs/api-test-cases.md`

所有业务接口代码都已在路由文件中添加注释：
- 接口作用
- 测试用例详情（成功/失败/边界）

## 6. 路由总览

- `POST /auth/register`
- `POST /auth/login`
- `GET /me`
- `GET /me/settings`
- `PUT /me/settings`
- `GET /me/goal`
- `PUT /me/goal`
- `POST /sessions`
- `POST /sessions/:id/end`
- `GET /sessions`
- `GET /sessions/:id`
- `POST /sessions/:id/exercises`
- `PATCH /session-exercises/:id`
- `POST /session-exercises/:id/sets`
- `POST /session-exercises/:id/start-next-set`
- `PATCH /set-records/:id`
