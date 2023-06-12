import config from 'config';
import {
  CookieOptions,
  Request,
  Response,
  NextFunction,
} from 'express';
import {
  CreateUserInput,
  LoginUserInput,
  VerifyEmailInput,
} from '../schemas/user.schema';
import {
  createUser,
  findUser,
  findUserByEmail,
  findUserById,
  signTokens,
} from '../services/user.services';
import { User } from '../entities/user.entity';
import AppError from '../utils/appError';
import redisClient from '../utils/connectRedis';
import { signJwt, verifyJwt } from '../utils/jwt';
import Email from '../utils/email';
import crypto from 'crypto';

const cookiesOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
};

if (process.env.NODE_ENV === 'production')
  cookiesOptions.secure = true;

const accessTokenCookieOptions = {
  ...cookiesOptions,
  expires: new Date(
    Date.now() +
      config.get<number>('accessTokenExpiresIn') * 60 * 1000
  ),
  maxAge: config.get<number>('accessTokenExpiresIn') * 60 * 1000,
};

const refreshTokenCookieOptions: CookieOptions = {
  ...cookiesOptions,
  expires: new Date(
    Date.now() +
      config.get<number>('refreshTokenExpiresIn') * 60 * 1000
  ),
  maxAge: config.get<number>('refreshTokenExpiresIn') * 60 * 1000,
};

export const registerUserHandler = async (
  req: Request<{}, {}, CreateUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, password, email } = req.body;

    const user = await createUser({
      username,
      email: email.toLowerCase(),
      password,
    });

    const { hashedVerificationCode, verificationCode } =
      User.createVerificationCode();
    user.verificationCode = hashedVerificationCode;
    await user.save();

    //send verification email

    const redirectUrl = `${config.get<string>(
      'origin'
    )}/verifyemail/${verificationCode}`;

    console.log(
      'registerHandler',
      user,
      hashedVerificationCode,
      verificationCode,
      redirectUrl
    );
    try {
      console.log(
        'new Email',
        await new Email(user, redirectUrl).sendVerificationCode()
      );
      await new Email(user, redirectUrl).sendVerificationCode();
      res.status(201).json({
        status: 'success',
        message:
          'An email with a verification code has been sent to your email',
      });
    } catch (error) {
      user.verificationCode = null;
      await user.save();
      return res.status(500).json({
        status: 'error',
        message: `'There was an error sending email, please try again'${error}`,
      });
    }
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({
        status: 'fail',
        message: 'User with that email already exits',
      });
    }
    next(err);
  }
};

export const loginUserHandler = async (
  req: Request<{}, {}, LoginUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('loginUserHandler', req.body);
    const { email, password } = req.body;
    const user = await findUserByEmail({ email });

    //1. Check if user exists and password is valid
    if (
      !user ||
      !(await User.comparePasswords(password, user.password))
    ) {
      return next(new AppError(400, 'Invalid email or password'));
    }

    // 2. Check if the user is verified
    if (!user.verified) {
      return next(new AppError(400, 'You are not verified'));
    }

    // 2. Sign Access and Refresh Tokens
    const { access_token, refresh_token } = await signTokens(user);

    // 3. Add Cookies
    res.cookie(
      'access_token',
      access_token,
      accessTokenCookieOptions
    );
    res.cookie(
      'refresh_token',
      refresh_token,
      refreshTokenCookieOptions
    );
    res.cookie('logged_in', true, {
      ...accessTokenCookieOptions,
      httpOnly: false,
    });

    // 4. Send response
    res.status(200).json({
      status: 'success',
      access_token,
    });
  } catch (err: any) {
    console.log('error on auth controller login handler ', err);
    next(err);
  }
};
export const refreshAccessTokenHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refresh_token = req.cookies.refresh_token;

    const message = 'Could not refresh access token';

    if (!refresh_token) {
      return next(new AppError(403, message));
    }

    // Validate refresh token
    const decoded = verifyJwt<{ sub: string }>(
      refresh_token,
      'refreshTokenPublicKey'
    );

    if (!decoded) {
      return next(new AppError(403, message));
    }

    // Check if user has a valid session
    const session = await redisClient.get(decoded.sub);

    if (!session) {
      return next(new AppError(403, message));
    }

    // Check if user still exist
    const user = await findUserById(JSON.parse(session).id);

    if (!user) {
      return next(new AppError(403, message));
    }

    // Sign new access token
    const access_token = signJwt(
      { sub: user.id },
      'accessTokenPrivateKey',
      {
        expiresIn: `${config.get<number>('accessTokenExpiresIn')}m`,
      }
    );

    // 4. Add Cookies
    res.cookie(
      'access_token',
      access_token,
      accessTokenCookieOptions
    );
    res.cookie('logged_in', true, {
      ...accessTokenCookieOptions,
      httpOnly: false,
    });

    // 5. Send response
    res.status(200).json({
      status: 'success',
      access_token,
    });
  } catch (err: any) {
    next(err);
  }
};
const logout = (res: Response) => {
  res.cookie('access_token', '', { maxAge: -1 });
  res.cookie('refresh_token', '', { maxAge: -1 });
  res.cookie('logged_in', '', { maxAge: -1 });
};

export const logoutHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = res.locals.user;

    await redisClient.del(user.id);
    logout(res);

    res.status(200).json({
      status: 'success',
    });
  } catch (err: any) {
    next(err);
  }
};

export const verifyEmailHandler = async (
  req: Request<VerifyEmailInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const verificationCode = crypto
      .createHash('sha256')
      .update(req.params.verificationCode)
      .digest('hex');
    console.log('verifyEmailHandler', req.params.verificationCode, {
      verificationCode,
    });
    const user = await findUser({ verificationCode });

    if (!user) {
      return next(new AppError(401, 'Could not verify email'));
    }

    user.verified = true;
    user.verificationCode = null;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Eamil verified successfully',
    });
  } catch (err: any) {
    next(err);
  }
};
