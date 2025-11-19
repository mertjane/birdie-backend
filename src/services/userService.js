import pool from "../config/database.js";



class UserService {
  // Create new user
  async createUser(userData) {
    const {
      firebase_uid,
      email,
      full_name,
      date_of_birth,
      age,
      horoscope,
      gender,
      location_postcode,
      latitude,
      longitude,
      relationship_preference,
      looking_for,
      preferred_age_min,
      preferred_age_max,
    } = userData;

    const query = `
      INSERT INTO users (
        firebase_uid, email, full_name, date_of_birth, age, horoscope, 
        gender, location_postcode, latitude, longitude, 
        relationship_preference, looking_for, preferred_age_min, preferred_age_max
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING user_id, firebase_uid, email, full_name, created_at
    `;

    const values = [
      firebase_uid,
      email,
      full_name,
      date_of_birth || null,
      age || null,
      horoscope || null,
      gender || null,
      location_postcode || null,
      latitude || null,
      longitude || null,
      relationship_preference || null,
      looking_for || null,
      preferred_age_min || null,
      preferred_age_max || null,
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get user by Firebase UID
  async getUserByFirebaseUid(firebase_uid) {
    const query = "SELECT * FROM users WHERE firebase_uid = $1";
    
    try {
      const result = await pool.query(query, [firebase_uid]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Get user by email
  async getUserByEmail(email) {
    const query = "SELECT * FROM users WHERE email = $1";
    
    try {
      const result = await pool.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Update user
  async updateUser(firebase_uid, updates) {
    // Remove firebase_uid and user_id from updates to prevent modification
    delete updates.firebase_uid;
    delete updates.user_id;
    delete updates.created_at;

    if (Object.keys(updates).length === 0) {
      throw new Error("No valid fields to update");
    }

    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(", ");

    const query = `
      UPDATE users 
      SET ${setClause}, updated_at = NOW()
      WHERE firebase_uid = $1
      RETURNING *
    `;

    const values = [firebase_uid, ...Object.values(updates)];

    try {
      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Delete user (soft delete by setting is_active = false)
  async deleteUser(firebase_uid) {
    const query = `
      UPDATE users 
      SET is_active = false, updated_at = NOW()
      WHERE firebase_uid = $1
      RETURNING user_id, firebase_uid, email
    `;

    try {
      const result = await pool.query(query, [firebase_uid]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Check if user exists
  async userExists(firebase_uid) {
    const query = "SELECT EXISTS(SELECT 1 FROM users WHERE firebase_uid = $1)";
    
    try {
      const result = await pool.query(query, [firebase_uid]);
      return result.rows[0].exists;
    } catch (error) {
      throw error;
    }
  }

  // Get all active users (for admin or testing)
  async getAllUsers(limit = 100, offset = 0) {
    const query = `
      SELECT user_id, firebase_uid, email, full_name, gender, age, created_at 
      FROM users 
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    try {
      const result = await pool.query(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

export default new UserService();