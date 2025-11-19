import express from "express";
import { PhotoController } from "../controllers/photosController.js";

const router = express.Router();
const photoController = new PhotoController();

// Get all photos for a user
router.get("/user/:userId", photoController.getUserPhotos);

// Get photo count for a user
router.get("/user/:userId/count", photoController.getUserPhotoCount);

// Get primary photo for a user
router.get("/user/:userId/primary", photoController.getPrimaryPhoto);

// Get a single photo by ID
router.get("/:photoId", photoController.getPhotoById);

// Add a new photo for a user
router.post("/user/:userId", photoController.addPhoto);

// Update a photo
router.put("/:photoId", photoController.updatePhoto);

// Set a photo as primary
router.put("/:photoId/primary", photoController.setPrimaryPhoto);

// Reorder photos for a user
router.put("/user/:userId/reorder", photoController.reorderPhotos);

// Delete a photo
router.delete("/:photoId", photoController.deletePhoto);

// Delete all photos for a user
router.delete("/user/:userId", photoController.deleteAllUserPhotos);

export default router;