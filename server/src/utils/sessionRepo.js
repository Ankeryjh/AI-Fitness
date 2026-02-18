const {query} = require('../db');

const hydrateSessions = async sessions => {
  if (sessions.length === 0) {
    return [];
  }

  const sessionIds = sessions.map(item => item.id);
  const placeholders = sessionIds.map((_, index) => `$${index + 1}`).join(', ');

  const itemsResult = await query(
    `
      SELECT
        se.id,
        se.session_id,
        se.exercise_id,
        se.custom_name,
        se.target_sets,
        se.rest_sec_override,
        se.sort_order,
        ex.name AS exercise_name,
        ex.default_rest_sec
      FROM session_exercises se
      JOIN exercises ex ON ex.id = se.exercise_id
      WHERE se.session_id IN (${placeholders})
      ORDER BY se.sort_order ASC
    `,
    sessionIds,
  );

  const itemIds = itemsResult.rows.map(row => row.id);
  const setsByItemId = new Map();

  if (itemIds.length > 0) {
    const setPlaceholders = itemIds.map((_, index) => `$${index + 1}`).join(', ');
    const setsResult = await query(
      `
        SELECT
          id,
          session_exercise_id,
          set_index,
          weight,
          reps,
          rpe,
          note,
          set_end_at,
          next_set_start_at,
          rest_actual_sec,
          created_at,
          updated_at
        FROM set_records
        WHERE session_exercise_id IN (${setPlaceholders})
        ORDER BY set_index ASC
      `,
      itemIds,
    );

    for (const row of setsResult.rows) {
      const group = setsByItemId.get(row.session_exercise_id) || [];
      group.push({
        id: row.id,
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
      setsByItemId.set(row.session_exercise_id, group);
    }
  }

  const itemsBySessionId = new Map();

  for (const row of itemsResult.rows) {
    const group = itemsBySessionId.get(row.session_id) || [];
    group.push({
      id: row.id,
      sessionId: row.session_id,
      exerciseId: row.exercise_id,
      exerciseName: row.exercise_name,
      defaultRestSec: row.default_rest_sec,
      customName: row.custom_name,
      targetSets: row.target_sets,
      restSecOverride: row.rest_sec_override,
      sortOrder: row.sort_order,
      sets: setsByItemId.get(row.id) || [],
    });
    itemsBySessionId.set(row.session_id, group);
  }

  return sessions.map(session => ({
    id: session.id,
    userId: session.user_id,
    focusArea: session.focus_area,
    startAt: session.start_at,
    endAt: session.end_at,
    createdAt: session.created_at,
    updatedAt: session.updated_at,
    items: itemsBySessionId.get(session.id) || [],
  }));
};

const loadSessionById = async ({sessionId, userId}) => {
  const result = await query(
    `
      SELECT
        id,
        user_id,
        focus_area,
        start_at,
        end_at,
        created_at,
        updated_at
      FROM workout_sessions
      WHERE id = $1 AND user_id = $2
      LIMIT 1
    `,
    [sessionId, userId],
  );

  if (result.rows.length === 0) {
    return null;
  }

  const [session] = await hydrateSessions(result.rows);
  return session;
};

module.exports = {
  hydrateSessions,
  loadSessionById,
};
