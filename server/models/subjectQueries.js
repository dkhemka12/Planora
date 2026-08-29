import { query } from '../config/postgres.js';

/**
 * Subject database queries for PostgreSQL
 */
export const SubjectQueries = {
  /**
   * Create a new subject for a user
   * @param {Object} subjectData - { userId, name }
   * @returns {Promise<Object>}
   */
  async create({ userId, name }) {
    const text = `
      INSERT INTO subjects (user_id, name)
      VALUES ($1, $2)
      RETURNING id, user_id, name, created_at;
    `;
    const res = await query(text, [userId, name.trim()]);
    return res.rows[0];
  },

  /**
   * Get all subjects belonging to a specific user
   * @param {number} userId
   * @returns {Promise<Array>}
   */
  async findByUserId(userId) {
    const text = `
      SELECT id, user_id, name, created_at
      FROM subjects
      WHERE user_id = $1
      ORDER BY created_at DESC;
    `;
    const res = await query(text, [userId]);
    return res.rows;
  },

  /**
   * Find a specific subject by its ID
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const text = `
      SELECT id, user_id, name, created_at
      FROM subjects
      WHERE id = $1;
    `;
    const res = await query(text, [id]);
    return res.rows[0] || null;
  },

  /**
   * Update subject name with ownership check
   * @param {number} id
   * @param {number} userId
   * @param {Object} updateData - { name }
   * @returns {Promise<Object|null>}
   */
  async update(id, userId, { name }) {
    const text = `
      UPDATE subjects
      SET name = $1
      WHERE id = $2 AND user_id = $3
      RETURNING id, user_id, name, created_at;
    `;
    const res = await query(text, [name.trim(), id, userId]);
    return res.rows[0] || null;
  },

  /**
   * Delete subject by ID and user ownership
   * @param {number} id
   * @param {number} userId
   * @returns {Promise<boolean>}
   */
  async delete(id, userId) {
    const text = `
      DELETE FROM subjects
      WHERE id = $1 AND user_id = $2
      RETURNING id;
    `;
    const res = await query(text, [id, userId]);
    return (res.rowCount || 0) > 0;
  },

  /**
   * Phase 2 Demonstration: Relational SQL JOIN Query
   * Joins the 'subjects' table with the 'users' table on foreign key subjects.user_id = users.id
   * @param {number} userId
   * @returns {Promise<Array>}
   */
  async getSubjectsWithUserDetails(userId) {
    const text = `
      SELECT 
        s.id AS subject_id,
        s.name AS subject_name,
        s.created_at AS subject_created_at,
        u.id AS user_id,
        u.name AS user_name,
        u.email AS user_email
      FROM subjects s
      INNER JOIN users u ON s.user_id = u.id
      WHERE u.id = $1
      ORDER BY s.created_at DESC;
    `;
    const res = await query(text, [userId]);
    return res.rows;
  },
};
