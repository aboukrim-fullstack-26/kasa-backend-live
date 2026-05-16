/**
 * @module services/messagesService
 * @description CRUD pour la messagerie entre utilisateurs.
 */

async function getConversations(db, userId) {
  const rows = await db.allAsync(`
    SELECT
      m.id, m.sender_id, m.receiver_id, m.content, m.is_read, m.created_at, m.property_id,
      CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END AS other_id,
      u.name AS other_name, u.picture AS other_picture, u.role AS other_role
    FROM messages m
    JOIN users u ON u.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
    WHERE m.sender_id = ? OR m.receiver_id = ?
    ORDER BY m.created_at DESC
  `, [userId, userId, userId, userId]);

  // Group by other_id to get conversations
  const convMap = new Map();
  for (const row of rows) {
    if (!convMap.has(row.other_id)) {
      convMap.set(row.other_id, {
        other_id: row.other_id,
        other_name: row.other_name,
        other_picture: row.other_picture,
        other_role: row.other_role,
        last_message: row.content,
        last_time: row.created_at,
        property_id: row.property_id,
        unread: 0,
      });
    }
    if (row.receiver_id === userId && !row.is_read) {
      convMap.get(row.other_id).unread++;
    }
  }
  return Array.from(convMap.values());
}

async function getMessages(db, userId, otherId) {
  const rows = await db.allAsync(`
    SELECT m.*, s.name AS sender_name, s.picture AS sender_picture
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    JOIN users s ON s.id = m.sender_id
    WHERE (m.sender_id = ? AND m.receiver_id = ?)
       OR (m.sender_id = ? AND m.receiver_id = ?)
    ORDER BY m.created_at ASC
  `, [userId, otherId, otherId, userId]);

  // Mark received messages as read
  await db.runAsync(
    'UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0',
    [otherId, userId]
  );

  return rows;
}

async function sendMessage(db, senderId, receiverId, content, propertyId = null) {
  if (!content || !content.trim()) {
    const err = new Error('content is required'); err.status = 400; throw err;
  }
  // Verify receiver exists
  const receiver = await db.getAsync('SELECT id FROM users WHERE id = ?', [receiverId]);
  if (!receiver) {
    const err = new Error('Receiver not found'); err.status = 404; throw err;
  }
  const result = await db.runAsync(
    'INSERT INTO messages(sender_id, receiver_id, content, property_id) VALUES (?,?,?,?)',
    [senderId, receiverId, content.trim(), propertyId]
  );
  return db.getAsync('SELECT * FROM messages WHERE id = ?', [result.lastID]);
}

module.exports = { getConversations, getMessages, sendMessage };
