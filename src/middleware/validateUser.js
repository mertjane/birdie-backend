import { body, validationResult } from "express-validator";

// Validation rules for creating user
const validateCreateUser = [
  body("firebase_uid")
    .notEmpty()
    .withMessage("Firebase UID is required")
    .isString()
    .withMessage("Firebase UID must be a string"),

  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be a valid email"),

  body("full_name")
    .notEmpty()
    .withMessage("Full name is required")
    .isString()
    .withMessage("Full name must be a string")
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage("Full name must be between 2 and 255 characters"),

  // Optional fields
  body("age")
    .optional()
    .isInt({ min: 18, max: 120 })
    .withMessage("Age must be between 18 and 120"),

  body("gender")
    .optional()
    .isIn(["Male", "Female", "Non-binary", "Other"])
    .withMessage("Invalid gender value"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }
    next();
  },
];

// Validation rules for updating user
const validateUpdateUser = [
  body("firebase_uid").not().exists().withMessage("Cannot update Firebase UID"),
  body("user_id").not().exists().withMessage("Cannot update user ID"),
  body("created_at").not().exists().withMessage("Cannot update created_at"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }
    next();
  },
];

export { validateCreateUser, validateUpdateUser };
