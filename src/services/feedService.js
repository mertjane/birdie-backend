import pool from "../config/database.js";

class FeedService {
  /**
   * Get potential matches for a user based on preferences
   */
  async getFeed(currentUserId) {
    try {
      // 1. Get current user's details
      const userRes = await pool.query(
        `SELECT gender, relationship_preference, looking_for, preferred_age_min, preferred_age_max, latitude, longitude 
         FROM users WHERE user_id = $1`,
        [currentUserId]
      );

      if (userRes.rows.length === 0) throw new Error("User not found");
      const currentUser = userRes.rows[0];

      // 2. Calculate Target Gender based on logic
      let targetGender = 'EVERYONE'; // Default for Bisexual/Other

      if (currentUser.relationship_preference === 'Straight') {
        // If Male Straight -> Wants Female
        // If Female Straight -> Wants Male
        targetGender = currentUser.gender === 'Male' ? 'Female' : 'Male';
      } else if (currentUser.relationship_preference === 'Gay') {
        // Wants same gender
        targetGender = currentUser.gender;
      } else if (currentUser.relationship_preference === 'Lesbian') {
        // Wants same gender
        targetGender = currentUser.gender;
      }
      // If 'Bisexual', targetGender remains 'EVERYONE'

      console.log(`User ${currentUserId} is ${currentUser.gender} (${currentUser.relationship_preference}). Looking for: ${targetGender}`);

      // 3. Build the query
      const query = `
        SELECT 
          u.user_id,
          u.full_name,
          u.age,
          u.horoscope,
          u.gender,
          u.location_postcode,
          u.looking_for,
          u.onboarding_step,
          
          -- Get Primary Photo
          (SELECT photo_url FROM user_photos p 
           WHERE p.user_id = u.user_id AND p.is_primary = true LIMIT 1) as photo_url,

          -- Get Interests (as a JSON array)
          (SELECT json_agg(interest_name) FROM user_interests i 
           WHERE i.user_id = u.user_id) as interests

        FROM users u
        WHERE u.user_id != $1
        AND u.is_active = true
        AND u.onboarding_step = 3
        
        -- Filter: Age Range
        AND u.age BETWEEN $2 AND $3
        
        -- Filter: Gender Matching
        -- If target is 'EVERYONE', this condition is skipped (TRUE OR ...)
        -- If target is specific (e.g., 'Female'), it checks u.gender = 'Female'
        AND ($4 = 'EVERYONE' OR u.gender = $4)

        -- Filter: Exclude people I have already swiped
        AND NOT EXISTS (
          SELECT 1 FROM swipes s 
          WHERE s.swiper_user_id = $1 AND s.swiped_user_id = u.user_id
        )

        LIMIT 10;
      `;

      const params = [
        currentUserId,
        currentUser.preferred_age_min,
        currentUser.preferred_age_max,
        targetGender // We pass the CALCULATED gender here, not the preference string
      ];

      const result = await pool.query(query, params);
      return result.rows;

    } catch (error) {
      console.error("Error generating feed:", error);
      throw error;
    }
  }
}

export default new FeedService();