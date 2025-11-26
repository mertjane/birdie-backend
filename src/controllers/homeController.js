import feedService from "../services/feedService.js";
import swipeService from "../services/SwipeService.js";
import notificationService from "../services/notificationService.js";


class HomeController {
  
  // GET /api/home/feed
  async getFeed(req, res) {
    try {
      // Assuming you have middleware that puts the logged-in user's ID in req.user.userId
      // For testing without auth middleware, pass userId in query param or header
      const userId = req.user ? req.user.userId : req.query.userId; 

      if (!userId) return res.status(400).json({ error: "User ID required" });

      const feed = await feedService.getFeed(parseInt(userId));
      
      res.json({
        success: true,
        count: feed.length,
        data: feed
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // POST /api/home/swipe
  async swipeUser(req, res) {
    try {
      const swiperId = req.user ? req.user.userId : req.body.swiperId; // The logged in user
      const { swipedId, swipeType } = req.body; // Target user and type ('LIKE' or 'UNLIKE')

      if (!swiperId || !swipedId || !swipeType) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const result = await swipeService.processSwipe(
        parseInt(swiperId), 
        parseInt(swipedId), 
        swipeType
      );

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      if (error.message === "Daily swipe limit reached") {
        return res.status(403).json({ success: false, error: error.message });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  }


  async getNotifications(req, res) {
    try {
      const userId = req.user ? req.user.userId : req.query.userId;
      if (!userId) return res.status(400).json({ error: "User ID required" });

      const notifications = await notificationService.getUserNotifications(parseInt(userId));
      
      res.json({
        success: true,
        count: notifications.length,
        data: notifications
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export default new HomeController();