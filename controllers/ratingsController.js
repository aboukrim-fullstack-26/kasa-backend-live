const { listRatingsForProperty, addRating } = require('../services/ratingsService');

function statusFromError(e) { return (e && e.status) ? e.status : 500; }

async function listForProperty(req, res) {
  const db = req.app.locals.db;
  try {
    const ratings = await listRatingsForProperty(db, req.params.id);
    res.json(ratings);
  } catch (e) { res.status(statusFromError(e)).json({ error: e.message }); }
}

async function add(req, res) {
  const db = req.app.locals.db;
  try {
    // user_id depuis le JWT (req.user) ou depuis le body
    const user_id = req.user?.id || req.body?.user_id;
    const { score, value, comment } = req.body || {};
    const result = await addRating(db, req.params.id, { user_id, score: score || value, comment });
    res.status(201).json(result);
  } catch (e) { res.status(statusFromError(e)).json({ error: e.message }); }
}

module.exports = { listForProperty, add };
