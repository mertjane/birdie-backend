import pool from "../config/database.js";

class SwipeService {
  
  async processSwipe(swiperId, swipedId, swipeType) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Basic Checks
      if (swiperId === swipedId) throw new Error("Cannot swipe on yourself");

      // 2. Check Daily Limits
      const today = new Date().toISOString().split('T')[0];
      const limitRes = await client.query(
        `SELECT swipe_count FROM daily_swipe_limits WHERE user_id = $1 AND swipe_date = $2`,
        [swiperId, today]
      );

      let currentCount = 0;
      if (limitRes.rows.length > 0) {
        currentCount = limitRes.rows[0].swipe_count;
        if (currentCount >= 20) throw new Error("Daily swipe limit reached");
      }

      // 3. Get User Names (Needed for Notification Messages)
      // We need the Swiper's name to tell the other person who liked them
      const swiperRes = await client.query('SELECT full_name FROM users WHERE user_id = $1', [swiperId]);
      const swiperName = swiperRes.rows[0].full_name;

      // 4. Record the Swipe
      await client.query(
        `INSERT INTO swipes (swiper_user_id, swiped_user_id, swipe_type)
         VALUES ($1, $2, $3)
         ON CONFLICT (swiper_user_id, swiped_user_id) DO NOTHING`,
        [swiperId, swipedId, swipeType]
      );

      // 5. Update Limit
      await client.query(
        `INSERT INTO daily_swipe_limits (user_id, swipe_date, swipe_count)
         VALUES ($1, $2, 1)
         ON CONFLICT (user_id, swipe_date) 
         DO UPDATE SET swipe_count = daily_swipe_limits.swipe_count + 1`,
        [swiperId, today]
      );

      // 6. LOGIC: Match & Notifications
      let isMatch = false;
      let matchDetails = null;

      if (swipeType === 'LIKE') {
        // Check if the OTHER person already LIKED us
        const checkBack = await client.query(
          `SELECT swipe_id FROM swipes 
           WHERE swiper_user_id = $1 AND swiped_user_id = $2 AND swipe_type = 'LIKE'`,
          [swipedId, swiperId]
        );

        if (checkBack.rows.length > 0) {
          // --- IT IS A MATCH ---
          isMatch = true;

          // A. Create Match Record
          const user1 = swiperId < swipedId ? swiperId : swipedId;
          const user2 = swiperId < swipedId ? swipedId : swiperId;

          const matchRes = await client.query(
            `INSERT INTO matches (user1_id, user2_id)
             VALUES ($1, $2)
             ON CONFLICT (user1_id, user2_id) DO NOTHING
             RETURNING match_id`,
            [user1, user2]
          );
          matchDetails = matchRes.rows[0];

          // B. Get Swiped User's Name (for the Swiper's notification)
          const swipedRes = await client.query('SELECT full_name FROM users WHERE user_id = $1', [swipedId]);
          const swipedName = swipedRes.rows[0].full_name;

          // C. Notification 1: Notify the Swiper (User 4)
          // "You matched with Jessica Jordan!"
          await client.query(
            `INSERT INTO notifications (user_id, related_user_id, notification_type, message)
             VALUES ($1, $2, 'MATCH', $3)`,
            [swiperId, swipedId, `You matched with ${swipedName}!`]
          );

          // D. Notification 2: Notify the Swiped User (User 5)
          // "You matched with Mertcan Kara!"
          await client.query(
            `INSERT INTO notifications (user_id, related_user_id, notification_type, message)
             VALUES ($1, $2, 'MATCH', $3)`,
            [swipedId, swiperId, `You matched with ${swiperName}!`]
          );

        } else {
          // --- NOT A MATCH (YET) ---
          // Just a one-way like. Notify User 5 that User 4 liked them.
          
          await client.query(
            `INSERT INTO notifications (user_id, related_user_id, notification_type, message)
             VALUES ($1, $2, 'LIKE', $3)`,
            [swipedId, swiperId, `${swiperName} liked you!`]
          );
        }
      }

      await client.query('COMMIT');

      return {
        success: true,
        swipedId,
        type: swipeType,
        isMatch,
        matchDetails,
        remainingSwipes: 20 - (currentCount + 1)
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default new SwipeService();