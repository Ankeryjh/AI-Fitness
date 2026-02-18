# AI-Fitness 启动与后端汇总（当前状态）

## 1. 已完成配置

- 后端已配置为 PostgreSQL：`server/.env`
- 连接信息：`postgresql://postgres:weibo.123@localhost:5432/ai_fitness`
- PostgreSQL 本地服务已启动并完成建表
- 已执行迁移：`server/sql/001_init.sql`

## 2. 启动方式

## 前端启动（React Native）

在项目根目录：

```bash
npm install
npm run start
```

平台运行：

```bash
npm run ios
npm run android
```

## 后端启动（Node + Express）

方式 A（推荐，根目录快捷命令）：

```bash
npm run server:migrate
npm run server:dev
```

方式 B（进入 server 目录）：

```bash
cd server
npm install
npm run migrate
npm run dev
```

后端默认地址：`http://127.0.0.1:3001`

健康检查：

```bash
curl http://127.0.0.1:3001/health
```

## 3. 后端接口功能汇总

认证与用户：

- `POST /auth/register`：注册账号，初始化 `user_profiles`、`user_settings`
- `POST /auth/login`：邮箱密码登录，返回 JWT
- `GET /me`：获取当前用户资料与当前目标
- `GET /me/settings`：获取设置（默认休息、步长、声音、震动）
- `PUT /me/settings`：更新设置
- `GET /me/goal`：获取当前激活目标
- `PUT /me/goal`：更新目标（旧目标置为非激活）

训练流程：

- `POST /sessions`：创建训练 session
- `POST /sessions/:id/end`：结束训练 session
- `GET /sessions`：分页查询历史 session（含动作和组数据）
- `GET /sessions/:id`：查询单次训练详情
- `POST /sessions/:id/exercises`：给 session 增加动作（可自动创建用户动作字典）
- `PATCH /session-exercises/:id`：更新动作项（名称、目标组数）
- `POST /session-exercises/:id/sets`：记录完成一组
- `POST /session-exercises/:id/start-next-set`：写下一组开始时间并计算实际休息秒数
- `PATCH /set-records/:id`：编辑单组记录（weight/reps/rpe/note）

## 4. 表结构设计（8 张）

## `users`

- 用户主表
- 字段：`id`、`email`(unique)、`password_hash`、`auth_provider`、`created_at`、`updated_at`

## `user_profiles`

- 用户扩展资料
- 字段：`user_id`(PK/FK)、`display_name`、`avatar_url`、`created_at`、`updated_at`

## `user_settings`

- 用户训练设置
- 字段：`user_id`(PK/FK)、`default_rest_sec`、`step_sec`、`sound_enabled`、`vibration_enabled`、`created_at`、`updated_at`

## `user_goals`

- 用户目标历史
- 字段：`id`、`user_id`、`goal_type`、`is_active`、`started_at`、`ended_at`、`created_at`、`updated_at`

## `exercises`

- 动作字典（系统动作 + 用户动作）
- 字段：`id`、`owner_user_id`(可空)、`name`、`default_rest_sec`、`created_at`、`updated_at`

## `workout_sessions`

- 训练主记录
- 字段：`id`、`user_id`、`focus_area`、`start_at`、`end_at`、`created_at`、`updated_at`

## `session_exercises`

- 每次训练下的动作项
- 字段：`id`、`session_id`、`exercise_id`、`custom_name`、`target_sets`、`rest_sec_override`、`sort_order`、`created_at`、`updated_at`

## `set_records`

- 每组训练记录
- 字段：`id`、`session_exercise_id`、`set_index`、`weight`、`reps`、`rpe`、`note`、`set_end_at`、`next_set_start_at`、`rest_actual_sec`、`created_at`、`updated_at`

## 5. 已完成联调结果

本地已完成一轮接口全链路联调（成功）：

- 注册 -> 登录 -> 获取用户 -> 更新设置 -> 更新目标
- 创建 session -> 新增动作 -> 更新动作 -> 新增组 -> 开始下一组 -> 更新组 -> 查询详情/列表 -> 结束训练
- 负例验证：
  - 未授权访问 `GET /me` 返回 `401`
  - 非法目标 `PUT /me/goal` 返回 `400`

联调脚本执行时返回的 `ok` 均为 `true`，核心链路可用。
