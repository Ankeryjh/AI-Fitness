const express = require('express');
const bcrypt = require('bcryptjs');
const {z} = require('zod');

const {query, withTransaction} = require('../db');
const {HttpError, asyncHandler, sendSuccess} = require('../utils/http');
const {signToken} = require('../utils/auth');

const router = express.Router();

const registerSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6).max(72),
  displayName: z.string().trim().min(1).max(50).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(72),
});

/**
 * 接口: POST /auth/register
 * 作用: 注册新用户并初始化 profile/settings。
 * 测试用例详情:
 * 1) 成功用例: 传入合法 email+password+displayName，期望 201，返回 token 与 user。
 * 2) 冲突用例: 重复注册同一 email，期望 409。
 * 3) 参数用例: password 长度 < 6，期望 400。
 */
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const payload = registerSchema.parse(req.body);
    const email = payload.email.trim().toLowerCase();

    const existsResult = await query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email]);
    if (existsResult.rows.length > 0) {
      throw new HttpError(409, 'Email already registered');
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);

    const user = await withTransaction(async client => {
      const userResult = await client.query(
        `
          INSERT INTO users (email, password_hash, auth_provider)
          VALUES ($1, $2, 'email')
          RETURNING id, email, created_at
        `,
        [email, passwordHash],
      );

      const inserted = userResult.rows[0];
      await client.query(
        `
          INSERT INTO user_profiles (user_id, display_name)
          VALUES ($1, $2)
        `,
        [inserted.id, payload.displayName || null],
      );

      await client.query(
        `
          INSERT INTO user_settings (user_id)
          VALUES ($1)
        `,
        [inserted.id],
      );

      return inserted;
    });

    const token = signToken(user);

    sendSuccess(
      res,
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.created_at,
        },
      },
      201,
    );
  }),
);

/**
 * 接口: POST /auth/login
 * 作用: 使用邮箱密码登录，返回 JWT。
 * 测试用例详情:
 * 1) 成功用例: 正确 email+password，期望 200，返回 token。
 * 2) 账号不存在: email 未注册，期望 401。
 * 3) 密码错误: 密码不匹配，期望 401。
 */
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const payload = loginSchema.parse(req.body);
    const email = payload.email.trim().toLowerCase();

    const result = await query(
      `
        SELECT id, email, password_hash, created_at
        FROM users
        WHERE email = $1
        LIMIT 1
      `,
      [email],
    );

    if (result.rows.length === 0) {
      throw new HttpError(401, 'Invalid email or password');
    }

    const user = result.rows[0];
    if (!user.password_hash) {
      throw new HttpError(401, 'Password login not available for this account');
    }

    const matched = await bcrypt.compare(payload.password, user.password_hash);
    if (!matched) {
      throw new HttpError(401, 'Invalid email or password');
    }

    const token = signToken(user);

    sendSuccess(res, {
      token,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
      },
    });
  }),
);

module.exports = {
  authRouter: router,
};
