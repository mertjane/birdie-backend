import userService from "../services/userService.js"; 
import pool from "../config/database.js"; 

export class UserController {

  // Create user
  async createUser(req, res) {
    try {
      console.log('Creating user:', req.body.email);

      // Check if user already exists
      const existingUser = await userService.getUserByFirebaseUid(req.body.firebase_uid);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User already exists'
        });
      }

      const user = await userService.createUser(req.body);
      
      console.log('User created successfully:', user.user_id);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user
      });

    } catch (error) {
      console.error('Error creating user:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to create user',
        error: error.message
      });
    }
  }

  // Get user by Firebase UID
  async getUserByFirebaseUid(req, res) {
    try {
      const { firebase_uid } = req.params;
      console.log('Fetching user:', firebase_uid);

      const user = await userService.getUserByFirebaseUid(firebase_uid);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      console.log('✅ User found:', user.email);

      res.status(200).json({
        success: true,
        data: user
      });

    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user',
        error: error.message
      });
    }
  }

  // Update user
  async updateUser(req, res) {
    try {
      const { firebase_uid } = req.params;
      console.log('Updating user:', firebase_uid);

      const user = await userService.updateUser(firebase_uid, req.body);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      console.log('✅ User updated successfully');

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: user
      });

    } catch (error) {
      console.error('❌ Error updating user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user',
        error: error.message
      });
    }
  }

  // Delete user (soft delete)
  async deleteUser(req, res) {
    try {
      const { firebase_uid } = req.params;
      console.log('🗑️ Deleting user:', firebase_uid);

      const user = await userService.deleteUser(firebase_uid);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      console.log('✅ User deleted successfully');

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
        data: user
      });

    } catch (error) {
      console.error('❌ Error deleting user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: error.message
      });
    }
  }

  // Get all users
  async getAllUsers(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;

      console.log('📋 Fetching all users');

      const users = await userService.getAllUsers(limit, offset);

      res.status(200).json({
        success: true,
        count: users.length,
        data: users
      });

    } catch (error) {
      console.error('❌ Error fetching users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: error.message
      });
    }
  }

  // Health check
  async healthCheck(req, res) {
    try {
      const result = await pool.query('SELECT NOW()');
      
      res.status(200).json({
        success: true,
        message: 'Database connection healthy',
        timestamp: result.rows[0].now
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Database connection failed',
        error: error.message
      });
    }
  }
}