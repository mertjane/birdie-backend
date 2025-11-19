import pool from "../config/database.js";

class UserInterestService {
  // Get all interests for a user
  async getUserInterests(userId) {
    try {
      const query = `
        SELECT interest_id, user_id, interest_name, created_at 
        FROM user_interests 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error getting user interests: ${error.message}`);
    }
  }

  // Add a new interest for a user
  async addUserInterest(userId, interestName) {
    try {
      const query = `
        INSERT INTO user_interests (user_id, interest_name) 
        VALUES ($1, $2) 
        RETURNING interest_id, user_id, interest_name, created_at
      `;
      const result = await pool.query(query, [userId, interestName]);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('User already has this interest');
      } else if (error.code === '23514') { // Check violation
        throw new Error('Invalid interest name');
      } else if (error.code === '23503') { // Foreign key violation
        throw new Error('User not found');
      }
      throw new Error(`Error adding user interest: ${error.message}`);
    }
  }

  // Add multiple interests for a user
  async addMultipleUserInterests(userId, interestNames) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const results = [];
      for (const interestName of interestNames) {
        try {
          const query = `
            INSERT INTO user_interests (user_id, interest_name) 
            VALUES ($1, $2) 
            ON CONFLICT (user_id, interest_name) DO NOTHING
            RETURNING interest_id, user_id, interest_name, created_at
          `;
          const result = await client.query(query, [userId, interestName]);
          if (result.rows[0]) {
            results.push(result.rows[0]);
          }
        } catch (error) {
          // Skip invalid interests and continue with others
          console.warn(`Skipping invalid interest ${interestName}: ${error.message}`);
        }
      }
      
      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Error adding multiple user interests: ${error.message}`);
    } finally {
      client.release();
    }
  }

  // Remove a specific interest from a user
  async removeUserInterest(userId, interestName) {
    try {
      const query = `
        DELETE FROM user_interests 
        WHERE user_id = $1 AND interest_name = $2 
        RETURNING interest_id
      `;
      const result = await pool.query(query, [userId, interestName]);
      
      if (result.rowCount === 0) {
        throw new Error('Interest not found for this user');
      }
      
      return { message: 'Interest removed successfully' };
    } catch (error) {
      throw new Error(`Error removing user interest: ${error.message}`);
    }
  }

  // Remove all interests for a user
  async removeAllUserInterests(userId) {
    try {
      const query = `
        DELETE FROM user_interests 
        WHERE user_id = $1 
        RETURNING interest_id
      `;
      const result = await pool.query(query, [userId]);
      return { 
        message: 'All interests removed successfully', 
        removedCount: result.rowCount 
      };
    } catch (error) {
      throw new Error(`Error removing all user interests: ${error.message}`);
    }
  }

  // Update user interests (replace all existing interests with new ones)
  async updateUserInterests(userId, newInterestNames) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Remove all existing interests
      await client.query('DELETE FROM user_interests WHERE user_id = $1', [userId]);
      
      // Add new interests
      const addedInterests = [];
      for (const interestName of newInterestNames) {
        try {
          const query = `
            INSERT INTO user_interests (user_id, interest_name) 
            VALUES ($1, $2) 
            RETURNING interest_id, user_id, interest_name, created_at
          `;
          const result = await client.query(query, [userId, interestName]);
          addedInterests.push(result.rows[0]);
        } catch (error) {
          // Skip invalid interests but continue with others
          console.warn(`Skipping invalid interest ${interestName}: ${error.message}`);
        }
      }
      
      await client.query('COMMIT');
      return addedInterests;
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Error updating user interests: ${error.message}`);
    } finally {
      client.release();
    }
  }

  // Get available interest options
  getAvailableInterests() {
    return [
      'Music', 'Fitness', 'Travel', 'Cooking', 
      'Movies', 'Art', 'Fashion', 'Gaming'
    ];
  }

  // Check if interest exists for user
  async hasInterest(userId, interestName) {
    try {
      const query = `
        SELECT interest_id 
        FROM user_interests 
        WHERE user_id = $1 AND interest_name = $2
      `;
      const result = await pool.query(query, [userId, interestName]);
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Error checking user interest: ${error.message}`);
    }
  }
}

export default new UserInterestService();