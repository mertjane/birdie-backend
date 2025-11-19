import express from "express";
import { UserInterestsController } from "../controllers/userInterestController.js";

const router = express.Router();
const userInterestsController = new UserInterestsController();

// Get all interests for a user
router.get("/:userId", userInterestsController.getUserInterests.bind(userInterestsController));

// Add a single interest to a user
router.post("/:userId", userInterestsController.addUserInterest.bind(userInterestsController));

// Add multiple interests to a user
router.post("/:userId/multiple", userInterestsController.addMultipleUserInterests.bind(userInterestsController));

// Remove a specific interest from a user
router.delete("/:userId/:interestName", userInterestsController.removeUserInterest.bind(userInterestsController));

// Remove all interests for a user
router.delete("/:userId", userInterestsController.removeAllUserInterests.bind(userInterestsController));

// Update user interests (replace all)
router.put("/:userId", userInterestsController.updateUserInterests.bind(userInterestsController));

// Get available interest options
router.get("/options/available", userInterestsController.getAvailableInterests.bind(userInterestsController));

export default router;