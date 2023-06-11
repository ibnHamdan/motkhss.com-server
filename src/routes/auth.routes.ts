import express from 'express';
import {
  loginUserHandler,
  logoutHandler,
  refreshAccessTokenHandler,
  registerUserHandler,
  verifyEmailHandler,
} from '../controllers/auth.controller';
import { deserializeUser } from '../middleware/deserializeUser';
import { requireUser } from '../middleware/requireUser';
import { validate } from '../middleware/validate';
import {
  createUserSchema,
  LoginUserInput,
  loginUserSchema,
  verifyEmailSchema,
} from '../schemas/user.schema';

const router = express.Router();

// Register user
router.post(
  '/register',
  validate(createUserSchema),
  registerUserHandler
);

//login user
router.post('/login', validate(loginUserSchema), loginUserHandler);

// logout user
router.get('/logout', deserializeUser, requireUser, logoutHandler);

// refresh access token
router.get('/refresh', refreshAccessTokenHandler);

router.get(
  '/verifyemail/:verificationCode',
  validate(verifyEmailSchema),
  verifyEmailHandler
);

export default router;
