import photoService from "../services/photoService.js";


export class PhotoController {
  /**
   * Get all photos for a user
   * GET /api/photos/user/:userId
   */
  async getUserPhotos(req, res) {
    try {
      const { userId } = req.params;
      
      // Validate userId
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: "User ID is required",
        });
      }

      const parsedUserId = parseInt(userId);
      
      // Check if userId is a valid number
      if (isNaN(parsedUserId) || parsedUserId <= 0) {
        return res.status(400).json({
          success: false,
          error: "Invalid User ID format",
        });
      }

      const photos = await photoService.getUserPhotos(parsedUserId);
      
      // Handle case where no photos exist (return empty array instead of error)
      if (!photos || photos.length === 0) {
        return res.json({
          success: true,
          data: [],
          count: 0,
          message: "No photos found for this user"
        });
      }

      res.json({
        success: true,
        data: photos,
        count: photos.length,
      });
    } catch (error) {
      console.error("Error getting user photos:", error);
      console.error("Error stack:", error.stack); // Add stack trace for debugging
      
      res.status(500).json({
        success: false,
        error: "Failed to retrieve user photos",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  
  /**
   * Get a single photo by ID
   * GET /api/photos/:photoId
   */
  async getPhotoById(req, res) {
    try {
      const { photoId } = req.params;

      if (!photoId) {
        return res.status(400).json({
          success: false,
          error: "Photo ID is required",
        });
      }

      const photo = await photoService.getPhotoById(parseInt(photoId));

      res.json({
        success: true,
        data: photo,
      });
    } catch (error) {
      console.error("Error getting photo:", error);

      if (error.message === "Photo not found") {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get primary photo for a user
   * GET /api/photos/user/:userId/primary
   */
  async getPrimaryPhoto(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: "User ID is required",
        });
      }

      const photo = await photoService.getPrimaryPhoto(parseInt(userId));

      if (!photo) {
        return res.status(404).json({
          success: false,
          message: "No primary photo found for this user",
        });
      }

      res.json({
        success: true,
        data: photo,
      });
    } catch (error) {
      console.error("Error getting primary photo:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Add a new photo for a user
   * POST /api/photos/user/:userId
   * Body: { photo_url, upload_order, is_primary }
   */
  async addPhoto(req, res) {
    try {
      const { userId } = req.params;
      const { base64_image, photo_url, upload_order, is_primary } = req.body;

      // Accept either base64_image or photo_url
      const imageData = base64_image || photo_url;

      if (!userId || !imageData || !upload_order) {
        return res.status(400).json({
          success: false,
          error:
            "User ID, image data (base64_image or photo_url), and upload_order are required",
        });
      }

      const photo = await photoService.addPhoto(
        parseInt(userId),
        imageData,
        parseInt(upload_order),
        is_primary || false
      );

      res.status(201).json({
        success: true,
        message: "Photo uploaded successfully",
        data: photo,
      });
    } catch (error) {
      console.error("Error adding photo:", error);

      if (
        error.message.includes("User not found") ||
        error.message.includes("Upload order") ||
        error.message.includes("already has maximum") ||
        error.message.includes("already exists")
      ) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Update a photo
   * PUT /api/photos/:photoId
   * Body: { photo_url?, is_primary? }
   */
  async updatePhoto(req, res) {
    try {
      const { photoId } = req.params;
      const { photo_url, is_primary } = req.body;

      if (!photoId) {
        return res.status(400).json({
          success: false,
          error: "Photo ID is required",
        });
      }

      if (photo_url === undefined && is_primary === undefined) {
        return res.status(400).json({
          success: false,
          error:
            "At least one field (photo_url or is_primary) must be provided",
        });
      }

      const photo = await photoService.updatePhoto(parseInt(photoId), {
        photoUrl: photo_url,
        isPrimary: is_primary,
      });

      res.json({
        success: true,
        message: "Photo updated successfully",
        data: photo,
      });
    } catch (error) {
      console.error("Error updating photo:", error);

      if (error.message === "Photo not found") {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Set a photo as primary
   * PUT /api/photos/:photoId/primary
   */
  async setPrimaryPhoto(req, res) {
    try {
      const { photoId } = req.params;

      if (!photoId) {
        return res.status(400).json({
          success: false,
          error: "Photo ID is required",
        });
      }

      const photo = await photoService.setPrimaryPhoto(parseInt(photoId));

      res.json({
        success: true,
        message: "Photo set as primary successfully",
        data: photo,
      });
    } catch (error) {
      console.error("Error setting primary photo:", error);

      if (error.message === "Photo not found") {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Reorder photos for a user
   * PUT /api/photos/user/:userId/reorder
   * Body: { photo_orders: { "123": 1, "124": 2, "125": 3 } }
   */
  async reorderPhotos(req, res) {
    try {
      const { userId } = req.params;
      const { photo_orders } = req.body;

      if (!userId || !photo_orders) {
        return res.status(400).json({
          success: false,
          error: "User ID and photo_orders are required",
        });
      }

      const photos = await photoService.reorderPhotos(
        parseInt(userId),
        photo_orders
      );

      res.json({
        success: true,
        message: "Photos reordered successfully",
        data: photos,
      });
    } catch (error) {
      console.error("Error reordering photos:", error);

      if (error.message.includes("do not belong")) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Delete a photo
   * DELETE /api/photos/:photoId
   */
  async deletePhoto(req, res) {
    try {
      const { photoId } = req.params;

      if (!photoId) {
        return res.status(400).json({
          success: false,
          error: "Photo ID is required",
        });
      }

      const result = await photoService.deletePhoto(parseInt(photoId));

      res.json({
        success: true,
        message: result.message,
        deletedPhotoId: result.deletedPhotoId,
      });
    } catch (error) {
      console.error("Error deleting photo:", error);

      if (error.message === "Photo not found") {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Delete all photos for a user
   * DELETE /api/photos/user/:userId
   */
  async deleteAllUserPhotos(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: "User ID is required",
        });
      }

      const result = await photoService.deleteAllUserPhotos(parseInt(userId));

      res.json({
        success: true,
        message: result.message,
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      console.error("Error deleting all user photos:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get photo count for a user
   * GET /api/photos/user/:userId/count
   */
  async getUserPhotoCount(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: "User ID is required",
        });
      }

      const count = await photoService.getUserPhotoCount(parseInt(userId));

      res.json({
        success: true,
        data: { count },
      });
    } catch (error) {
      console.error("Error getting photo count:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}
