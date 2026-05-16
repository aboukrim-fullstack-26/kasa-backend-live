const { getConversations, getMessages, sendMessage } = require('../services/messagesService');

async function listConversations(req, res) {
  const db = req.app.locals.db;
  try {
    const conversations = await getConversations(db, req.user.id);
    res.json(conversations);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

async function listMessages(req, res) {
  const db = req.app.locals.db;
  try {
    const messages = await getMessages(db, req.user.id, Number(req.params.userId));
    res.json(messages);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

async function send(req, res) {
  const db = req.app.locals.db;
  try {
    const { receiver_id, content, property_id } = req.body || {};
    const msg = await sendMessage(db, req.user.id, Number(receiver_id), content, property_id || null);
    res.status(201).json(msg);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

module.exports = { listConversations, listMessages, send };
