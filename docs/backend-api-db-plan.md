# AI-Fitness 后端接口与数据库规划（MVP）

## 1. 目标

基于当前前端实现（登录/目标设置/训练记录/休息统计/AI 报告），先落地一套可支撑多用户的数据模型与接口。

优先原则：
- 先保证现有页面都能真实读写后端
- 表结构尽量和前端 `models.ts` 一一对应，降低改造成本
- 先做 MVP 主表，扩展表后置

## 2. MVP 必需表（建议 8 张）

## `users`
用途：账号主表。

核心字段：
- `id` (uuid, pk)
- `email` (varchar, unique, not null)
- `password_hash` (varchar, null)  
- `auth_provider` (varchar, default `email`)  
- `created_at` / `updated_at` (timestamptz)

说明：如果你用 Supabase/Firebase Auth，可用平台用户表替代本表。

## `user_profiles`
用途：用户资料。

核心字段：
- `user_id` (uuid, pk, fk -> users.id)
- `display_name` (varchar)
- `avatar_url` (varchar)
- `created_at` / `updated_at`

## `user_settings`
用途：对应前端 `settingsStore`。

核心字段：
- `user_id` (uuid, pk, fk -> users.id)
- `default_rest_sec` (int, default 90)
- `step_sec` (int, default 15)
- `sound_enabled` (bool, default true)
- `vibration_enabled` (bool, default true)
- `updated_at`

约束建议：
- `default_rest_sec` in [15, 600]
- `step_sec` in [5, 120]

## `user_goals`
用途：对应目标设置（`goalType`、完成状态），并支持后续目标历史。

核心字段：
- `id` (uuid, pk)
- `user_id` (uuid, fk -> users.id)
- `goal_type` (varchar)  
- `is_active` (bool, default true)
- `started_at` / `ended_at` (timestamptz)
- `created_at`

说明：MVP 也可简化为每个用户仅一行当前目标（无历史）。

## `exercises`
用途：动作字典（系统动作 + 用户自定义动作）。

核心字段：
- `id` (uuid, pk)
- `owner_user_id` (uuid, null, fk -> users.id)  
- `name` (varchar, not null)
- `default_rest_sec` (int, default 90)
- `created_at` / `updated_at`

说明：
- `owner_user_id` 为空 = 系统动作
- `owner_user_id` 有值 = 用户私有动作

## `workout_sessions`
用途：对应 `Session`。

核心字段：
- `id` (uuid, pk)
- `user_id` (uuid, fk -> users.id)
- `focus_area` (varchar, null)
- `start_at` (timestamptz, not null)
- `end_at` (timestamptz, null)
- `created_at` / `updated_at`

说明：`end_at is null` 表示进行中。

## `session_exercises`
用途：对应 `SessionExercise`（一节训练中的动作项）。

核心字段：
- `id` (uuid, pk)
- `session_id` (uuid, fk -> workout_sessions.id)
- `exercise_id` (uuid, fk -> exercises.id)
- `custom_name` (varchar, null)
- `target_sets` (int, default 4)
- `rest_sec_override` (int, null)
- `sort_order` (int, not null)
- `created_at` / `updated_at`

约束建议：
- `target_sets` in [1, 30]

## `set_records`
用途：对应 `SetRecord`（每组数据）。

核心字段：
- `id` (uuid, pk)
- `session_exercise_id` (uuid, fk -> session_exercises.id)
- `set_index` (int, not null)
- `weight` (numeric, null)
- `reps` (int, null)
- `rpe` (numeric, null)
- `note` (text, null)
- `set_end_at` (timestamptz, null)
- `next_set_start_at` (timestamptz, null)
- `rest_actual_sec` (int, null)
- `created_at` / `updated_at`

约束建议：
- `rest_actual_sec >= 0`
- `unique(session_exercise_id, set_index)`

## 3. 关系（ER 简化）

- `users 1 - n workout_sessions`
- `workout_sessions 1 - n session_exercises`
- `session_exercises 1 - n set_records`
- `users 1 - n user_goals`
- `users 1 - 1 user_settings`
- `users 1 - n exercises`（用户自定义动作）

## 4. 关键索引建议

- `users(email)` unique
- `workout_sessions(user_id, start_at desc)`
- `workout_sessions(user_id, end_at)`（查进行中 session）
- `session_exercises(session_id, sort_order)`
- `set_records(session_exercise_id, set_index)` unique
- `exercises(owner_user_id, name)`

## 5. 与当前前端字段映射

- `Exercise` -> `exercises`
- `Session` -> `workout_sessions`
- `SessionExercise` -> `session_exercises`
- `SetRecord` -> `set_records`
- `settingsStore` -> `user_settings`
- `onboardingStore.goalSetup` -> `user_goals`

## 6. 接口分组（MVP）

认证与用户：
- `POST /auth/register`
- `POST /auth/login`
- `GET /me`
- `GET /me/settings`
- `PUT /me/settings`
- `GET /me/goal`
- `PUT /me/goal`

训练：
- `POST /sessions`（创建 session）
- `POST /sessions/:id/end`（结束 session）
- `GET /sessions?cursor=...`（历史）
- `GET /sessions/:id`（详情）
- `POST /sessions/:id/exercises`
- `PATCH /session-exercises/:id`（改名称/目标组数）
- `POST /session-exercises/:id/sets`（完成一组）
- `PATCH /set-records/:id`（编辑 weight/reps/rpe/note）
- `POST /session-exercises/:id/start-next-set`（写 `next_set_start_at` + `rest_actual_sec`）

## 7. 实施顺序

1. 建 `users/user_settings/user_goals`，先打通登录和设置。  
2. 建 `exercises/workout_sessions/session_exercises/set_records`，打通训练流程。  
3. 接入历史详情、训练总结、AI 报告接口。  
4. 再做扩展（社交登录、报告缓存、推荐计划等）。

## 8. 可选扩展表（后续）

- `ai_reports`：保存每次生成的报告快照，减少重复计算
- `user_devices`：存 push token，支持远程推送
- `workout_templates` + `template_exercises`：固定训练计划模板
- `body_metrics`：体重/体脂/围度，支持更完整趋势分析

