const express = require('express');
const {z} = require('zod');

const {query, withTransaction} = require('../db');
const {requireAuth} = require('../middleware/auth');
const {HttpError, asyncHandler, sendSuccess} = require('../utils/http');

const router = express.Router();

const updateSessionExerciseSchema = z
  .object({
    customName: z.string().trim().min(1).max(100).optional(),
    targetSets: z.number().int().min(1).max(30).optional(),
  })
  .refine(value => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

const createSetSchema = z.object({
  weight: z.number().min(0).max(500).nullable().optional(),
  reps: z.number().int().min(0).max(100).nullable().optional(),
  rpe: z.number().min(0).max(10).nullable().optional(),
  note: z.string().trim().max(500).nullable().optional(),
  endedAt: z.string().datetime().optional(),
});

const startNextSetSchema = z.object({
  startedAt: z.string().datetime().optional(),
});

const assertOwnedSessionExercise = async ({sessionExerciseId, userId}) => {
  const result = await query(
    `
      SELECT se.id, se.session_id
      FROM session_exercises se
      JOIN workout_sessions ws ON ws.id = se.session_id
      WHERE se.id = $1 AND ws.user_id = $2
      LIMIT 1
    `,
    [sessionExerciseId, userId],
  );

  if (result.rows.length === 0) {
    throw new HttpError(404, 'Session exercise not found');
  }

  return result.rows[0];
};

router.use(requireAuth);

/**
 * 接口: PATCH /session-exercises/:id
 * 作用: 更新动作项配置（customName/targetSets）。
 * 测试用例详情:
 * 1) 成功用例: 更新 customName，期望 200。
 * 2) 成功用例: 更新 targetSets=6，期望 200。
 * 3) 参数用例: 空 payload，期望 400。
 */
router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const {id: userId} = req.user;
    const sessionExerciseId = req.params.id;
    const payload = updateSessionExerciseSchema.parse(req.body);

    await assertOwnedSessionExercise({sessionExerciseId, userId});

    const fields = [];
    const values = [];

    if (typeof payload.customName === 'string') {
      values.push(payload.customName);
      fields.push(`custom_name = $${values.length}`);
    }

    if (typeof payload.targetSets === 'number') {
      values.push(payload.targetSets);
      fields.push(`target_sets = $${values.length}`);
    }

    values.push(sessionExerciseId);

    const result = await query(
      `
        UPDATE session_exercises
        SET ${fields.join(', ')}, updated_at = NOW()
        WHERE id = $${values.length}
        RETURNING id, session_id, exercise_id, custom_name, target_sets, rest_sec_override, sort_order, created_at, updated_at
      `,
      values,
    );

    const row = result.rows[0];
    sendSuccess(res, {
      id: row.id,
      sessionId: row.session_id,
      exerciseId: row.exercise_id,
      customName: row.custom_name,
      targetSets: row.target_sets,
      restSecOverride: row.rest_sec_override,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }),
);

/**
 * 接口: POST /session-exercises/:id/sets
 * 作用: 记录完成一组（写 set_end_at，自动 set_index+1）。
 * 测试用例详情:
 * 1) 成功用例: 传 weight/reps，期望 201 并返回 set_index 递增。
 * 2) 空表现用例: 不传 weight/reps，期望 201（允许补录）。
 * 3) 越权用例: 访问他人 sessionExercise，期望 404。
 */
router.post(
  '/:id/sets',
  asyncHandler(async (req, res) => {
    const {id: userId} = req.user;
    const sessionExerciseId = req.params.id;
    const payload = createSetSchema.parse(req.body || {});

    const inserted = await withTransaction(async client => {
      const owner = await client.query(
        `
          SELECT se.id
          FROM session_exercises se
          JOIN workout_sessions ws ON ws.id = se.session_id
          WHERE se.id = $1 AND ws.user_id = $2
          LIMIT 1
        `,
        [sessionExerciseId, userId],
      );

      if (owner.rows.length === 0) {
        throw new HttpError(404, 'Session exercise not found');
      }

      const setIndexResult = await client.query(
        'SELECT COALESCE(MAX(set_index), 0) AS max_index FROM set_records WHERE session_exercise_id = $1',
        [sessionExerciseId],
      );

      const setIndex = Number(setIndexResult.rows[0].max_index) + 1;

      const result = await client.query(
        `
          INSERT INTO set_records (
            session_exercise_id,
            set_index,
            weight,
            reps,
            rpe,
            note,
            set_end_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, session_exercise_id, set_index, weight, reps, rpe, note, set_end_at, next_set_start_at, rest_actual_sec, created_at, updated_at
        `,
        [
          sessionExerciseId,
          setIndex,
          payload.weight ?? null,
          payload.reps ?? null,
          payload.rpe ?? null,
          payload.note ?? null,
          payload.endedAt || new Date().toISOString(),
        ],
      );

      return result.rows[0];
    });

    sendSuccess(
      res,
      {
        id: inserted.id,
        sessionExerciseId: inserted.session_exercise_id,
        index: inserted.set_index,
        weight: inserted.weight === null ? null : Number(inserted.weight),
        reps: inserted.reps,
        rpe: inserted.rpe === null ? null : Number(inserted.rpe),
        note: inserted.note,
        setEndAt: inserted.set_end_at,
        nextSetStartAt: inserted.next_set_start_at,
        restActualSec: inserted.rest_actual_sec,
        createdAt: inserted.created_at,
        updatedAt: inserted.updated_at,
      },
      201,
    );
  }),
);

/**
 * 接口: POST /session-exercises/:id/start-next-set
 * 作用: 标记下一组开始时间并计算上一组实际休息秒数。
 * 测试用例详情:
 * 1) 成功用例: 有待闭环 set（set_end_at 有值, next_set_start_at 为空），期望 200。
 * 2) 无可更新用例: 所有 set 都已闭环，期望 409。
 * 3) 时间边界: startedAt 早于 set_end_at，restActualSec 应被钳制为 0。
 */
router.post(
  '/:id/start-next-set',
  asyncHandler(async (req, res) => {
    const {id: userId} = req.user;
    const sessionExerciseId = req.params.id;
    const payload = startNextSetSchema.parse(req.body || {});

    const updated = await withTransaction(async client => {
      const owner = await client.query(
        `
          SELECT se.id
          FROM session_exercises se
          JOIN workout_sessions ws ON ws.id = se.session_id
          WHERE se.id = $1 AND ws.user_id = $2
          LIMIT 1
        `,
        [sessionExerciseId, userId],
      );

      if (owner.rows.length === 0) {
        throw new HttpError(404, 'Session exercise not found');
      }

      const targetSet = await client.query(
        `
          SELECT id, set_end_at
          FROM set_records
          WHERE session_exercise_id = $1
            AND set_end_at IS NOT NULL
            AND next_set_start_at IS NULL
          ORDER BY set_index DESC
          LIMIT 1
        `,
        [sessionExerciseId],
      );

      if (targetSet.rows.length === 0) {
        throw new HttpError(409, 'No set pending rest completion');
      }

      const setRow = targetSet.rows[0];
      const startedAtIso = payload.startedAt || new Date().toISOString();
      const restSec = Math.max(
        0,
        Math.round((new Date(startedAtIso).getTime() - new Date(setRow.set_end_at).getTime()) / 1000),
      );

      const result = await client.query(
        `
          UPDATE set_records
          SET next_set_start_at = $1,
              rest_actual_sec = $2,
              updated_at = NOW()
          WHERE id = $3
          RETURNING id, session_exercise_id, set_index, weight, reps, rpe, note, set_end_at, next_set_start_at, rest_actual_sec, created_at, updated_at
        `,
        [startedAtIso, restSec, setRow.id],
      );

      return result.rows[0];
    });

    sendSuccess(res, {
      id: updated.id,
      sessionExerciseId: updated.session_exercise_id,
      index: updated.set_index,
      weight: updated.weight === null ? null : Number(updated.weight),
      reps: updated.reps,
      rpe: updated.rpe === null ? null : Number(updated.rpe),
      note: updated.note,
      setEndAt: updated.set_end_at,
      nextSetStartAt: updated.next_set_start_at,
      restActualSec: updated.rest_actual_sec,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    });
  }),
);

module.exports = {
  sessionExercisesRouter: router,
};
