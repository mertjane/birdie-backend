import userInterestService from "../services/userInterestService.js";

export class UserInterestsController {
  // Get all interests for a user
  async getUserInterests(req, res) {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const interests = await userInterestService.getUserInterests(parseInt(userId));
      res.json({ 
        success: true, 
        data: interests 
      });
    } catch (error) {
      console.error('Error getting user interests:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Add a single interest to a user
  async addUserInterest(req, res) {
    try {
      const { userId } = req.params;
      const { interest_name } = req.body;
      
      if (!userId || !interest_name) {
        return res.status(400).json({ 
          error: 'User ID and interest_name are required' 
        });
      }

      const interest = await userInterestService.addUserInterest(
        parseInt(userId), 
        interest_name
      );
      
      res.status(201).json({ 
        success: true, 
        message: 'Interest added successfully',
        data: interest 
      });
    } catch (error) {
      console.error('Error adding user interest:', error);
      
      if (error.message.includes('already has') || 
          error.message.includes('Invalid interest name') ||
          error.message.includes('User not found')) {
        return res.status(400).json({ 
          success: false, 
          error: error.message 
        });
      }
      
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Add multiple interests to a user
  async addMultipleUserInterests(req, res) {
    try {
      const { userId } = req.params;
      const { interests } = req.body;
      
      if (!userId || !interests || !Array.isArray(interests)) {
        return res.status(400).json({ 
          error: 'User ID and interests array are required' 
        });
      }

      const addedInterests = await userInterestService.addMultipleUserInterests(
        parseInt(userId), 
        interests
      );
      
      res.status(201).json({ 
        success: true, 
        message: `${addedInterests.length} interest(s) added successfully`,
        data: addedInterests 
      });
    } catch (error) {
      console.error('Error adding multiple user interests:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Remove a specific interest from a user
  async removeUserInterest(req, res) {
    try {
      const { userId, interestName } = req.params;
      
      if (!userId || !interestName) {
        return res.status(400).json({ 
          error: 'User ID and interest name are required' 
        });
      }

      const result = await userInterestService.removeUserInterest(
        parseInt(userId), 
        interestName
      );
      
      res.json({ 
        success: true, 
        message: result.message 
      });
    } catch (error) {
      console.error('Error removing user interest:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({ 
          success: false, 
          error: error.message 
        });
      }
      
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Remove all interests for a user
  async removeAllUserInterests(req, res) {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const result = await userInterestService.removeAllUserInterests(parseInt(userId));
      
      res.json({ 
        success: true, 
        message: result.message,
        removedCount: result.removedCount 
      });
    } catch (error) {
      console.error('Error removing all user interests:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Update user interests (replace all)
  async updateUserInterests(req, res) {
    try {
      const { userId } = req.params;
      const { interests } = req.body;
      
      if (!userId || !interests || !Array.isArray(interests)) {
        return res.status(400).json({ 
          error: 'User ID and interests array are required' 
        });
      }

      const updatedInterests = await userInterestService.updateUserInterests(
        parseInt(userId), 
        interests
      );
      
      res.json({ 
        success: true, 
        message: 'Interests updated successfully',
        data: updatedInterests 
      });
    } catch (error) {
      console.error('Error updating user interests:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Get available interest options
  async getAvailableInterests(req, res) {
    try {
      const interests = userInterestService.getAvailableInterests();
      res.json({ 
        success: true, 
        data: interests 
      });
    } catch (error) {
      console.error('Error getting available interests:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
}