import pool from "../config/database.js";

class NotificationService {
  
  /**
   * Get all notifications for a user
   */
  async getUserNotifications(userId) {
    try {
      const query = `
        SELECT 
          n.notification_id,
          n.notification_type,
          n.message,
          n.is_read,
          n.created_at,
          n.related_user_id,
          
          -- Get the related user's photo to show next to the notification
          (SELECT photo_url FROM user_photos p 
           WHERE p.user_id = n.related_user_id AND p.is_primary = true LIMIT 1) as related_user_photo
           
        FROM notifications n
        WHERE n.user_id = $1
        ORDER BY n.created_at DESC
      `;
      
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId) {
    try {
      await pool.query(
        `UPDATE notifications SET is_read = true WHERE notification_id = $1`,
        [notificationId]
      );
      return { success: true };
    } catch (error) {
      console.error("Error updating notification:", error);
      throw error;
    }
  }
}

export default new NotificationService();