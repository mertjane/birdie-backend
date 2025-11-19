import cloudinary from "../config/cloudinary.js";
import pool from "../config/database.js";

class PhotoService {
  /**
   * Upload image to Cloudinary and return URL
   */
  async uploadImageToCloudinary(base64Image, userId) {
    try {
      const result = await cloudinary.uploader.upload(base64Image, {
        folder: `birdie/users/${userId}`,
        resource_type: 'image',
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto' }
        ]
      });
      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload image');
    }
  }

  /**
   * Get all photos for a user
   */
  async getUserPhotos(userId) {
    try {
      const query = `
        SELECT 
          photo_id,
          user_id,
          photo_url,
          upload_order,
          is_primary,
          uploaded_at
        FROM user_photos 
        WHERE user_id = $1 
        ORDER BY is_primary DESC, upload_order ASC
      `;
      
      const result = await pool.query(query, [userId]);
      return result.rows || [];
    } catch (error) {
      console.error('Error fetching user photos:', error);
      throw new Error(`Failed to fetch photos for user ${userId}: ${error.message}`);
    }
  }

  /**
   * Get a single photo by ID
   */
  async getPhotoById(photoId) {
    try {
      const query = `
        SELECT 
          photo_id,
          user_id,
          photo_url,
          upload_order,
          is_primary,
          uploaded_at
        FROM user_photos 
        WHERE photo_id = $1
      `;
      
      const result = await pool.query(query, [photoId]);
      
      if (result.rows.length === 0) {
        throw new Error('Photo not found');
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching photo by ID:', error);
      throw error;
    }
  }

  /**
   * Add a new photo for a user (with Cloudinary upload)
   */
  async addPhoto(userId, base64Image, uploadOrder, isPrimary = false) {
    // Verify user exists
    const userCheck = await pool.query(
      "SELECT user_id FROM users WHERE user_id = $1",
      [userId]
    );
    if (userCheck.rows.length === 0) {
      throw new Error("User not found");
    }

    // Upload to Cloudinary
    const photoUrl = await this.uploadImageToCloudinary(base64Image, userId);

    // Check if upload_order is valid (1-6)
    if (uploadOrder < 1 || uploadOrder > 6) {
      throw new Error("Upload order must be between 1 and 6");
    }

    // Check if user already has 6 photos
    const photoCount = await pool.query(
      "SELECT COUNT(*) as count FROM user_photos WHERE user_id = $1",
      [userId]
    );
    if (parseInt(photoCount.rows[0].count) >= 6) {
      throw new Error("User already has maximum of 6 photos");
    }

    // Check if upload_order already exists for this user
    const orderCheck = await pool.query(
      "SELECT photo_id FROM user_photos WHERE user_id = $1 AND upload_order = $2",
      [userId, uploadOrder]
    );
    if (orderCheck.rows.length > 0) {
      throw new Error(`Photo at position ${uploadOrder} already exists`);
    }

    // If setting as primary, unset other primary photos
    if (isPrimary) {
      await pool.query(
        "UPDATE user_photos SET is_primary = false WHERE user_id = $1",
        [userId]
      );
    }

    // Insert new photo
    const query = `
      INSERT INTO user_photos (user_id, photo_url, upload_order, is_primary)
      VALUES ($1, $2, $3, $4)
      RETURNING 
        photo_id,
        user_id,
        photo_url,
        is_primary,
        upload_order,
        uploaded_at
    `;
    const result = await pool.query(query, [userId, photoUrl, uploadOrder, isPrimary]);
    return result.rows[0];
  }

  /**
   * Delete a photo (also delete from Cloudinary)
   */
  async deletePhoto(photoId) {
    const photo = await this.getPhotoById(photoId);

    // Extract public_id from Cloudinary URL
    const urlParts = photo.photo_url.split('/');
    const publicIdWithExt = urlParts.slice(-3).join('/'); // e.g., "birdie/users/4/abc123.jpg"
    const publicId = publicIdWithExt.split('.')[0]; // Remove extension

    try {
      // Delete from Cloudinary
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Error deleting from Cloudinary:', error);
      // Continue with database deletion even if Cloudinary fails
    }

    const query = "DELETE FROM user_photos WHERE photo_id = $1";
    await pool.query(query, [photoId]);

    return {
      message: "Photo deleted successfully",
      deletedPhotoId: photoId,
      uploadOrder: photo.upload_order,
    };
  }
}

export default new PhotoService();