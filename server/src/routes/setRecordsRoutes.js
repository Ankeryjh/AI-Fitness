const express = require('express');
const {z} = require('zod');

const {query} = require('../db');
const {requireAuth} = require('../middleware/auth');
const {HttpError, asyncHandler, sendSuccess} = require('../utils/http');

const router = express.Router();

const updateSetSchema = z
  .object({
    weight: z.number().min(0).max(500).nullable().optional(),
    reps: z.number().int().min(0).max(100).nullable().optional(),
    rpe: z.number().min(0).max(10).nullable().optional(),
    note: z.string().trim().max(500).nullable().optional(),
  })
  .refine(value => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

router.use(requireAuth);

/**
 * 接口: PATCH /set-records/:id
 * 作用: 编辑单组记录（weight/reps/rpe/note），用于休息页补录。
 * 测试用例详情:
 * 1) 成功用例: 更新 reps=10，期望 200。
 * 2) 越权用例: 更新他人 set id，期望 404。
 * 3) 参数用例: body 为空，期望 400。
 */
router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const {id: userId} = req.user;
    const setId = req.params.id;
    const payload = updateSetSchema.parse(req.body);

    const ownership = await query(
      `
        SELECT sr.id
        FROM set_records sr
        JOIN session_exercises se ON se.id = sr.session_exercise_id
        JOIN workout_sessions ws ON ws.id = se.session_id
        WHERE sr.id = $1 AND ws.user_id = $2
        LIMIT 1
      `,
      [setId, userId],
    );

    if (ownership.rows.length === 0) {
      throw new HttpError(404, 'Set record not found');
    }

    const fields = [];
    const values = [];

    if (payload.weight !== undefined) {
      values.push(payload.weight);
      fields.push(`weight = $${values.length}`);
    }
    if (payload.reps !== undefined) {
      values.push(payload.reps);
      fields.push(`reps = $${values.length}`);
    }
    if (payload.rpe !== undefined) {
      values.push(payload.rpe);
      fields.push(`rpe = $${values.length}`);
    }
    if (payload.note !== undefined) {
      values.push(payload.note);
      fields.push(`note = $${values.length}`);
    }

    values.push(setId);

    const result = await query(
      `
        UPDATE set_records
        SET ${fields.join(', ')}, updated_at = NOW()
        WHERE id = $${values.length}
        RETURNING id, session_exercise_id, set_index, weight, reps, rpe, note, set_end_at, next_set_start_at, rest_actual_sec, created_at, updated_at
      `,
      values,
    );

    const row = result.rows[0];
    sendSuccess(res, {
      id: row.id,
      sessionExerciseId: row.session_exercise_id,
      index: row.set_index,
      weight: row.weight === null ? null : Number(row.weight),
      reps: row.reps,
      rpe: row.rpe === null ? null : Number(row.rpe),
      note: row.note,
      setEndAt: row.set_end_at,
      nextSetStartAt: row.next_set_start_at,
      restActualSec: row.rest_actual_sec,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }),
);

module.exports = {
  setRecordsRouter: router,
};
