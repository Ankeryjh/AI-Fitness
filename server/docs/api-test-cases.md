# API 手工测试用例（Node 后端）

Base URL: `http://localhost:3001`

## 0. 预置变量

```bash
BASE_URL="http://localhost:3001"
TOKEN=""
SESSION_ID=""
SESSION_EXERCISE_ID=""
SET_ID=""
```

## 1. 认证

### 1.1 注册 `POST /auth/register`

```bash
curl -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "12345678",
    "displayName": "Demo"
  }'
```

预期：`201`，返回 `data.token`。

### 1.2 登录 `POST /auth/login`

```bash
curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"12345678"}'
```

预期：`200`，返回 `data.token`。

## 2. 用户

### 2.1 获取 me `GET /me`

```bash
curl "$BASE_URL/me" -H "Authorization: Bearer $TOKEN"
```

### 2.2 获取设置 `GET /me/settings`

```bash
curl "$BASE_URL/me/settings" -H "Authorization: Bearer $TOKEN"
```

### 2.3 更新设置 `PUT /me/settings`

```bash
curl -X PUT "$BASE_URL/me/settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"defaultRestSec":120,"stepSec":15,"soundEnabled":true,"vibrationEnabled":true}'
```

### 2.4 获取目标 `GET /me/goal`

```bash
curl "$BASE_URL/me/goal" -H "Authorization: Bearer $TOKEN"
```

### 2.5 更新目标 `PUT /me/goal`

```bash
curl -X PUT "$BASE_URL/me/goal" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"goalType":"chest"}'
```

## 3. 训练 Session

### 3.1 创建 session `POST /sessions`

```bash
curl -X POST "$BASE_URL/sessions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"focusArea":"chest"}'
```

预期：`201`，记录返回 id 到 `SESSION_ID`。

### 3.2 给 session 添加动作 `POST /sessions/:id/exercises`

```bash
curl -X POST "$BASE_URL/sessions/$SESSION_ID/exercises" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exerciseName":"杠铃卧推",
    "defaultRestSec":90,
    "restSecOverride":90,
    "targetSets":4
  }'
```

预期：`201`，记录返回 id 到 `SESSION_EXERCISE_ID`。

### 3.3 查询 session 列表 `GET /sessions`

```bash
curl "$BASE_URL/sessions?limit=20" -H "Authorization: Bearer $TOKEN"
```

### 3.4 查询单个 session `GET /sessions/:id`

```bash
curl "$BASE_URL/sessions/$SESSION_ID" -H "Authorization: Bearer $TOKEN"
```

### 3.5 结束 session `POST /sessions/:id/end`

```bash
curl -X POST "$BASE_URL/sessions/$SESSION_ID/end" \
  -H "Authorization: Bearer $TOKEN"
```

## 4. 动作与组数据

### 4.1 更新动作项 `PATCH /session-exercises/:id`

```bash
curl -X PATCH "$BASE_URL/session-exercises/$SESSION_EXERCISE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customName":"杠铃卧推主动作","targetSets":5}'
```

### 4.2 完成一组 `POST /session-exercises/:id/sets`

```bash
curl -X POST "$BASE_URL/session-exercises/$SESSION_EXERCISE_ID/sets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"weight":60,"reps":10,"rpe":7.5,"note":"状态良好"}'
```

预期：`201`，记录返回 id 到 `SET_ID`。

### 4.3 开始下一组（回填实际休息）`POST /session-exercises/:id/start-next-set`

```bash
curl -X POST "$BASE_URL/session-exercises/$SESSION_EXERCISE_ID/start-next-set" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 4.4 编辑组记录 `PATCH /set-records/:id`

```bash
curl -X PATCH "$BASE_URL/set-records/$SET_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"weight":62.5,"reps":9,"note":"补录"}'
```

## 5. 失败场景回归

- 不带 `Authorization` 访问 `/me`，应返回 `401`
- `PUT /me/goal` 传 `{"goalType":"invalid"}`，应返回 `400`
- `POST /session-exercises/:id/start-next-set` 在没有待更新 set 时应返回 `409`
- `GET /sessions?limit=999`，应返回 `400`
