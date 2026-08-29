import { query } from '../config/postgres.js';

/**
 * User database queries for PostgreSQL
 */
export const UserQueries = {
  /**
   * Create a new user
   * @param {Object} userData - { name, email, password }
   * @returns {Promise<Object>} Created user record (without password)
   */
  async create({ name, email, password }) {
    const text = `
      INSERT INTO users (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, created_at;
    `;
    const res = await query(text, [name, email.toLowerCase().trim(), password]);
    return res.rows[0];
  },

  /**
   * Find user by email
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    const text = `
      SELECT id, name, email, password, created_at
      FROM users
      WHERE email = $1;
    `;
    const res = await query(text, [email.toLowerCase().trim()]);
    return res.rows[0] || null;
  },

  /**
   * Find user by ID
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const text = `
      SELECT id, name, email, created_at
      FROM users
      WHERE id = $1;
    `;
    const res = await query(text, [id]);
    return res.rows[0] || null;
  },

  /**
   * Delete user by ID (cascades to subjects)
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async deleteById(id) {
    const text = `
      DELETE FROM users
      WHERE id = $1
      RETURNING id;
    `;
    const res = await query(text, [id]);
    return (res.rowCount || 0) > 0;
  },
};
