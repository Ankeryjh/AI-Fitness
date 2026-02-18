const express = require('express');
const {z} = require('zod');

const {query, withTransaction} = require('../db');
const {requireAuth} = require('../middleware/auth');
const {HttpError, asyncHandler, sendSuccess} = require('../utils/http');

const router = express.Router();

const goalTypeEnum = z.enum(['chest', 'back', 'legs', 'shoulders', 'arms', 'core']);

const updateSettingsSchema = z
  .object({
    defaultRestSec: z.number().int().min(15).max(600).optional(),
    stepSec: z.number().int().min(5).max(120).optional(),
    soundEnabled: z.boolean().optional(),
    vibrationEnabled: z.boolean().optional(),
  })
  .refine(value => Object.keys(value).length > 0, {
    message: 'At least one settings field is required',
  });

const updateGoalSchema = z.object({
  goalType: goalTypeEnum,
});

router.use(requireAuth);

/**
 * 接口: GET /me
 * 作用: 获取当前登录用户基础信息（账号 + profile + 当前 active goal）。
 * 测试用例详情:
 * 1) 成功用例: 带有效 Bearer Token，期望 200。
 * 2) 未授权: 缺少 Token，期望 401。
 * 3) 无效 Token: 过期或篡改，期望 401。
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const {id: userId} = req.user;

    const [userResult, goalResult] = await Promise.all([
      query(
        `
          SELECT
            u.id,
            u.email,
            u.auth_provider,
            u.created_at,
            p.display_name,
            p.avatar_url
          FROM users u
          LEFT JOIN user_profiles p ON p.user_id = u.id
          WHERE u.id = $1
          LIMIT 1
        `,
        [userId],
      ),
      query(
        `
          SELECT goal_type, started_at, ended_at, created_at
          FROM user_goals
          WHERE user_id = $1 AND is_active = true
          ORDER BY created_at DESC
          LIMIT 1
        `,
        [userId],
      ),
    ]);

    if (userResult.rows.length === 0) {
      throw new HttpError(404, 'User not found');
    }

    const user = userResult.rows[0];
    const goal = goalResult.rows[0] || null;

    sendSuccess(res, {
      id: user.id,
      email: user.email,
      authProvider: user.auth_provider,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
      activeGoal: goal
        ? {
            goalType: goal.goal_type,
            startedAt: goal.started_at,
            endedAt: goal.ended_at,
            createdAt: goal.created_at,
          }
        : null,
    });
  }),
);

/**
 * 接口: GET /me/settings
 * 作用: 获取当前用户设置（休息时长、步长、声音、震动）。
 * 测试用例详情:
 * 1) 成功用例: 有 token，期望 200 且返回 settings。
 * 2) 新用户兜底: settings 不存在时自动插入默认值后返回。
 * 3) 未授权: 无 token，期望 401。
 */
router.get(
  '/settings',
  asyncHandler(async (req, res) => {
    const {id: userId} = req.user;

    let result = await query(
      `
        SELECT user_id, default_rest_sec, step_sec, sound_enabled, vibration_enabled, updated_at
        FROM user_settings
        WHERE user_id = $1
        LIMIT 1
      `,
      [userId],
    );

    if (result.rows.length === 0) {
      await query('INSERT INTO user_settings (user_id) VALUES ($1)', [userId]);
      result = await query(
        `
          SELECT user_id, default_rest_sec, step_sec, sound_enabled, vibration_enabled, updated_at
          FROM user_settings
          WHERE user_id = $1
          LIMIT 1
        `,
        [userId],
      );
    }

    const settings = result.rows[0];
    sendSuccess(res, {
      userId: settings.user_id,
      defaultRestSec: settings.default_rest_sec,
      stepSec: settings.step_sec,
      soundEnabled: settings.sound_enabled,
      vibrationEnabled: settings.vibration_enabled,
      updatedAt: settings.updated_at,
    });
  }),
);

/**
 * 接口: PUT /me/settings
 * 作用: 更新当前用户设置。
 * 测试用例详情:
 * 1) 成功用例: 更新单字段 defaultRestSec，期望 200。
 * 2) 边界用例: stepSec=3（小于最小值）期望 400。
 * 3) 空 payload: 不传任何字段，期望 400。
 */
router.put(
  '/settings',
  asyncHandler(async (req, res) => {
    const {id: userId} = req.user;
    const payload = updateSettingsSchema.parse(req.body);

    await query(
      `
        INSERT INTO user_settings (user_id)
        VALUES ($1)
        ON CONFLICT (user_id) DO NOTHING
      `,
      [userId],
    );

    const fields = [];
    const values = [];

    if (typeof payload.defaultRestSec === 'number') {
      values.push(payload.defaultRestSec);
      fields.push(`default_rest_sec = $${values.length}`);
    }
    if (typeof payload.stepSec === 'number') {
      values.push(payload.stepSec);
      fields.push(`step_sec = $${values.length}`);
    }
    if (typeof payload.soundEnabled === 'boolean') {
      values.push(payload.soundEnabled);
      fields.push(`sound_enabled = $${values.length}`);
    }
    if (typeof payload.vibrationEnabled === 'boolean') {
      values.push(payload.vibrationEnabled);
      fields.push(`vibration_enabled = $${values.length}`);
    }

    values.push(userId);

    const result = await query(
      `
        UPDATE user_settings
        SET ${fields.join(', ')}, updated_at = NOW()
        WHERE user_id = $${values.length}
        RETURNING user_id, default_rest_sec, step_sec, sound_enabled, vibration_enabled, updated_at
      `,
      values,
    );

    const settings = result.rows[0];
    sendSuccess(res, {
      userId: settings.user_id,
      defaultRestSec: settings.default_rest_sec,
      stepSec: settings.step_sec,
      soundEnabled: settings.sound_enabled,
      vibrationEnabled: settings.vibration_enabled,
      updatedAt: settings.updated_at,
    });
  }),
);

/**
 * 接口: GET /me/goal
 * 作用: 获取当前用户激活中的训练目标。
 * 测试用例详情:
 * 1) 成功用例: 存在 active goal，期望 200 + goal。
 * 2) 空数据用例: 未设置目标，期望 200 + goal=null。
 * 3) 未授权: 无 token，期望 401。
 */
router.get(
  '/goal',
  asyncHandler(async (req, res) => {
    const {id: userId} = req.user;

    const result = await query(
      `
        SELECT id, goal_type, is_active, started_at, ended_at, created_at
        FROM user_goals
        WHERE user_id = $1 AND is_active = true
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [userId],
    );

    if (result.rows.length === 0) {
      sendSuccess(res, {goal: null});
      return;
    }

    const row = result.rows[0];
    sendSuccess(res, {
      goal: {
        id: row.id,
        goalType: row.goal_type,
        isActive: row.is_active,
        startedAt: row.started_at,
        endedAt: row.ended_at,
        createdAt: row.created_at,
      },
    });
  }),
);

/**
 * 接口: PUT /me/goal
 * 作用: 更新用户当前训练目标（关闭旧目标并激活新目标）。
 * 测试用例详情:
 * 1) 成功用例: 从 chest 切换到 back，期望 200，旧目标 ended_at 被写入。
 * 2) 幂等用例: 连续两次设置同一 goalType，均返回 200。
 * 3) 参数用例: goalType=foo，期望 400。
 */
router.put(
  '/goal',
  asyncHandler(async (req, res) => {
    const {id: userId} = req.user;
    const payload = updateGoalSchema.parse(req.body);

    const inserted = await withTransaction(async client => {
      await client.query(
        `
          UPDATE user_goals
          SET is_active = false, ended_at = NOW(), updated_at = NOW()
          WHERE user_id = $1 AND is_active = true
        `,
        [userId],
      );

      const createResult = await client.query(
        `
          INSERT INTO user_goals (user_id, goal_type, is_active, started_at)
          VALUES ($1, $2, true, NOW())
          RETURNING id, goal_type, is_active, started_at, ended_at, created_at
        `,
        [userId, payload.goalType],
      );

      return createResult.rows[0];
    });

    sendSuccess(res, {
      goal: {
        id: inserted.id,
        goalType: inserted.goal_type,
        isActive: inserted.is_active,
        startedAt: inserted.started_at,
        endedAt: inserted.ended_at,
        createdAt: inserted.created_at,
      },
    });
  }),
);

module.exports = {
  meRouter: router,
};
