# AI Fitness Rest Timer (React Native + TypeScript)

组间休息计时与训练记录应用（白底黑字极简 UI）。

## 功能覆盖（MVP）

- Session 创建/结束
- Session 内添加多个动作
- 每组记录：`weight/reps`（已预留 `rpe/note` 字段）
- Rest Focus 两击闭环
  - `Complete Set`：写入 `setEndAt` 并开始休息倒计时
  - `Start Next Set`：写入 `nextSetStartAt` 并计算/落库 `restActualSec`
- Timer 状态机：`IDLE | RESTING | PAUSED | DONE`
  - 时间戳驱动，不依赖前台计数器
  - 支持 `+step`、Pause/Resume、DONE 超时 `+Xs`
- 本地通知（Notifee TimestampTrigger）
  - 开始休息时 schedule
  - 提前开始下一组 cancel
  - `+step` 与 Pause/Resume 时会重排通知时间
  - Android channel 自动创建
- 历史记录
  - 按时间列出 Session
  - Session 详情展示动作分组、每组重量次数、实际休息
- 设置
  - 默认休息秒数
  - 时间步长（默认 15s）
  - 声音/震动开关

## 技术栈

- React Native + TypeScript
- React Navigation (native stack)
- Zustand（`sessionStore/restStore/settingsStore`）
- react-native-mmkv（JSON 持久化）
- @notifee/react-native（本地通知）
- react-native-svg（圆环进度）
- react-native-reanimated（按钮/计时动效）

## 工程结构

```txt
src/
  app/
    navigation/
      RootNavigator.tsx
    screens/
      HomeScreen.tsx
      SessionScreen.tsx
      RestFocusScreen.tsx
      HistoryDetailScreen.tsx
    components/
      PrimaryButton.tsx
      SecondaryButton.tsx
      TimerRing.tsx
      SetLogRow.tsx
      ExerciseCardRow.tsx
    store/
      restStore.ts
      sessionStore.ts
      settingsStore.ts
    services/
      notifications.ts
      storage.ts
      format.ts
      id.ts
    theme/
      tokens.ts
    types/
      models.ts
```

## 安装依赖

如果你当前仓库还没有 `ios/` 与 `android/`（例如从空仓库直接复制本项目源码），先生成原生壳：

```bash
npx @react-native-community/cli@latest init AIFitness --directory . --skip-install
```

然后安装依赖：

```bash
npm install
```

## 运行（iOS / Android）

```bash
# iOS
cd ios && pod install && cd ..
npm run ios

# Android
npm run android
```

```bash
# Metro
npm run start
```

## 通知与权限说明

### 1) 运行时权限

- App 启动时调用 `notifee.requestPermission()`（已在 `App.tsx` -> `ensureNotificationSetup` 中触发）。

### 2) Android Manifest（必须）

在 `android/app/src/main/AndroidManifest.xml` 中确保包含：

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
```

说明：
- `POST_NOTIFICATIONS`：Android 13+ 通知权限。
- `VIBRATE`：震动提醒。
- `SCHEDULE_EXACT_ALARM`：使用 AlarmManager 精准触发时间戳通知时需要。

### 3) Android Channel

- 已在 `src/app/services/notifications.ts` 中创建：
  - id: `rest-timer-channel`
  - name: `Rest Timer`
  - importance: `HIGH`

### 4) iOS

- 本地通知通过 `notifee.requestPermission()` 请求系统授权。
- 如需更复杂后台行为，再按需增加 Capabilities（当前 MVP 不依赖远程推送）。

## 关键实现

- Timer 真相字段（`src/app/store/restStore.ts`）：
  - `restState`
  - `restDurationSec`
  - `restStartAtMs`
  - `restTargetAtMs`
  - `pauseAccumulatedMs`
  - `pausedAtMs`
  - `notificationId`
- 实际剩余：`remainingMs = restTargetAtMs + pauseAccumulatedMs - now`
- 数据落库：
  - `Complete Set` 写 `setEndAt`
  - `Start Next Set` 写 `nextSetStartAt` 与 `restActualSec`

## 备注

当前仓库在此环境下无法联网安装 npm 依赖，因此未执行本地编译/运行验证；代码已按 RN 0.79 + TS 结构组织。
