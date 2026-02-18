const express = require('express');
const {z} = require('zod');

const {query, withTransaction} = require('../db');
const {requireAuth} = require('../middleware/auth');
const {HttpError, asyncHandler, sendSuccess} = require('../utils/http');
const {hydrateSessions, loadSessionById} = require('../utils/sessionRepo');

const router = express.Router();

const createSessionSchema = z.object({
  focusArea: z.string().trim().min(1).max(32).optional(),
});

const listSessionsQuerySchema = z.object({
  cursor: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

const addSessionExerciseSchema = z.object({
  exerciseName: z.string().trim().min(1).max(100),
  defaultRestSec: z.number().int().min(15).max(600),
  restSecOverride: z.number().int().min(15).max(600).nullable().optional(),
  targetSets: z.number().int().min(1).max(30).optional(),
  customName: z.string().trim().min(1).max(100).optional(),
});

router.use(requireAuth);

/**
 * 接口: POST /sessions
 * 作用: 创建一条训练 session（对应前端 createSession）。
 * 测试用例详情:
 * 1) 成功用例: body 传 focusArea=chest，期望 201。
 * 2) 空 body 用例: 不传 focusArea，期望 201 且字段为 null。
 * 3) 参数用例: focusArea 超长，期望 400。
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const {id: userId} = req.user;
    const payload = createSessionSchema.parse(req.body || {});

    const result = await query(
      `
        INSERT INTO workout_sessions (user_id, focus_area, start_at)
        VALUES ($1, $2, NOW())
        RETURNING id, user_id, focus_area, start_at, end_at, created_at, updated_at
      `,
      [userId, payload.focusArea || null],
    );

    const session = result.rows[0];
    sendSuccess(
      res,
      {
        id: session.id,
        userId: session.user_id,
        focusArea: session.focus_area,
        startAt: session.start_at,
        endAt: session.end_at,
        createdAt: session.created_at,
        updatedAt: session.updated_at,
        items: [],
      },
      201,
    );
  }),
);

/**
 * 接口: POST /sessions/:id/end
 * 作用: 结束训练 session，写入 end_at。
 * 测试用例详情:
 * 1) 成功用例: session 属于当前用户且未结束，期望 200。
 * 2) 幂等用例: 已结束 session 再次调用，期望 200（返回原 end_at）。
 * 3) 鉴权用例: 访问他人 session，期望 404。
 */
router.post(
  '/:id/end',
  asyncHandler(async (req, res) => {
    const {id: userId} = req.user;
    const sessionId = req.params.id;

    const exists = await query(
      'SELECT id, end_at FROM workout_sessions WHERE id = $1 AND user_id = $2 LIMIT 1',
      [sessionId, userId],
    );

    if (exists.rows.length === 0) {
      throw new HttpError(404, 'Session not found');
    }

    const updated = await query(
      `
        UPDATE workout_sessions
        SET end_at = COALESCE(end_at, NOW()), updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING id, user_id, focus_area, start_at, end_at, created_at, updated_at
      `,
      [sessionId, userId],
    );

    const session = updated.rows[0];
    sendSuccess(res, {
      id: session.id,
      userId: session.user_id,
      focusArea: session.focus_area,
      startAt: session.start_at,
      endAt: session.end_at,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
    });
  }),
);

/**
 * 接口: GET /sessions?cursor=...&limit=...
 * 作用: 分页获取当前用户历史 session 列表（含 items + sets）。
 * 测试用例详情:
 * 1) 成功用例: 不传参数，期望 200 + 默认 20 条以内。
 * 2) 分页用例: 传 cursor=上页 nextCursor，期望返回更早记录。
 * 3) 参数用例: limit=100（超上限），期望 400。
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const {id: userId} = req.user;
    const queryInput = listSessionsQuerySchema.parse(req.query);
    const limit = queryInput.limit || 20;

    const result = await query(
      `
        SELECT id, user_id, focus_area, start_at, end_at, created_at, updated_at
        FROM workout_sessions
        WHERE user_id = $1
          AND ($2::timestamptz IS NULL OR start_at < $2::timestamptz)
        ORDER BY start_at DESC, id DESC
        LIMIT $3
      `,
      [userId, queryInput.cursor || null, limit],
    );

    const sessions = await hydrateSessions(result.rows);
    const last = result.rows[result.rows.length - 1];

    sendSuccess(res, {
      list: sessions,
      nextCursor: last ? new Date(last.start_at).toISOString() : null,
    });
  }),
);

/**
 * 接口: GET /sessions/:id
 * 作用: 获取单条 session 详情（含动作与组数据）。
 * 测试用例详情:
 * 1) 成功用例: 查询本人 sessionId，期望 200。
 * 2) 不存在用例: 传不存在 id，期望 404。
 * 3) 越权用例: 传他人 id，期望 404。
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const {id: userId} = req.user;
    const session = await loadSessionById({sessionId: req.params.id, userId});

    if (!session) {
      throw new HttpError(404, 'Session not found');
    }

    sendSuccess(res, session);
  }),
);

/**
 * 接口: POST /sessions/:id/exercises
 * 作用: 向 session 新增动作项；若动作字典不存在则自动创建用户动作。
 * 测试用例详情:
 * 1) 成功用例: 新增“杠铃卧推”，期望 201，返回 sessionExercise。
 * 2) 字典复用: 同名动作已存在，期望复用 exercise_id。
 * 3) 参数用例: targetSets=40（超限），期望 400。
 */
router.post(
  '/:id/exercises',
  asyncHandler(async (req, res) => {
    const {id: userId} = req.user;
    const sessionId = req.params.id;
    const payload = addSessionExerciseSchema.parse(req.body);

    const created = await withTransaction(async client => {
      const sessionResult = await client.query(
        'SELECT id FROM workout_sessions WHERE id = $1 AND user_id = $2 LIMIT 1',
        [sessionId, userId],
      );

      if (sessionResult.rows.length === 0) {
        throw new HttpError(404, 'Session not found');
      }

      const exerciseName = payload.exerciseName.trim();

      const matchedExercise = await client.query(
        `
          SELECT id, name, default_rest_sec
          FROM exercises
          WHERE lower(name) = lower($1)
            AND (owner_user_id = $2 OR owner_user_id IS NULL)
          ORDER BY
            CASE WHEN owner_user_id = $2 THEN 0 ELSE 1 END,
            created_at ASC
          LIMIT 1
        `,
        [exerciseName, userId],
      );

      let exercise = matchedExercise.rows[0];

      if (!exercise) {
        const insertExercise = await client.query(
          `
            INSERT INTO exercises (owner_user_id, name, default_rest_sec)
            VALUES ($1, $2, $3)
            RETURNING id, name, default_rest_sec
          `,
          [userId, exerciseName, payload.defaultRestSec],
        );
        exercise = insertExercise.rows[0];
      }

      const sortResult = await client.query(
        'SELECT COALESCE(MAX(sort_order), 0) AS max_order FROM session_exercises WHERE session_id = $1',
        [sessionId],
      );

      const sortOrder = Number(sortResult.rows[0].max_order) + 1;

      const insertItem = await client.query(
        `
          INSERT INTO session_exercises (
            session_id,
            exercise_id,
            custom_name,
            target_sets,
            rest_sec_override,
            sort_order
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, session_id, exercise_id, custom_name, target_sets, rest_sec_override, sort_order, created_at, updated_at
        `,
        [
          sessionId,
          exercise.id,
          payload.customName || null,
          payload.targetSets || 4,
          payload.restSecOverride ?? null,
          sortOrder,
        ],
      );

      return {
        item: insertItem.rows[0],
        exercise,
      };
    });

    sendSuccess(
      res,
      {
        id: created.item.id,
        sessionId: created.item.session_id,
        exerciseId: created.item.exercise_id,
        exerciseName: created.exercise.name,
        defaultRestSec: created.exercise.default_rest_sec,
        customName: created.item.custom_name,
        targetSets: created.item.target_sets,
        restSecOverride: created.item.rest_sec_override,
        sortOrder: created.item.sort_order,
        createdAt: created.item.created_at,
        updatedAt: created.item.updated_at,
        sets: [],
      },
      201,
    );
  }),
);

module.exports = {
  sessionsRouter: router,
};
