const express = require('express');

const {authRouter} = require('./routes/authRoutes');
const {meRouter} = require('./routes/meRoutes');
const {sessionsRouter} = require('./routes/sessionsRoutes');
const {sessionExercisesRouter} = require('./routes/sessionExercisesRoutes');
const {setRecordsRouter} = require('./routes/setRecordsRoutes');
const {notFoundHandler, errorHandler} = require('./middleware/error');

const app = express();

app.use(express.json({limit: '1mb'}));

app.get('/health', (_req, res) => {
  res.json({ok: true, data: {status: 'up'}});
});

app.use('/auth', authRouter);
app.use('/me', meRouter);
app.use('/sessions', sessionsRouter);
app.use('/session-exercises', sessionExercisesRouter);
app.use('/set-records', setRecordsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = {
  app,
};
