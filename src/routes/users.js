import express from "express";
import { UserController } from "../controllers/userController.js";
import { validateCreateUser, validateUpdateUser } from "../middleware/validateUser.js";


const router = express.Router();
const userController = new UserController(); 

// Health check
router.get('/health/check', userController.healthCheck);

// Create user
router.post('/', validateCreateUser, userController.createUser);

// Get user by Firebase UID
router.get('/:firebase_uid', userController.getUserByFirebaseUid);

// Update user
router.put('/:firebase_uid', validateUpdateUser, userController.updateUser);

// Delete user (soft delete)
router.delete('/:firebase_uid', userController.deleteUser);

// Get all users (for admin/testing)
router.get('/', userController.getAllUsers);


export default router;