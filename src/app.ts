require('dotenv').config();
import express, { Response, Request, NextFunction } from 'express';
import config from 'config';
import validateEnv from './utils/validateEnv';
import { AppDataSource } from './utils/data-source';
import redisClient from './utils/connectRedis';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import cors from 'cors';
import AppError from './utils/appError';
import authRouter from './routes/auth.routes';
import userRouter from './routes/user.routes';

import nodemailer from 'nodemailer';

AppDataSource.initialize()
  .then(async () => {
    // Validate ENV
    validateEnv();
    // create express app
    const app = express();

    const path = __dirname + '/views/';
    app.set('views', `${__dirname}/views/`);
    console.log(`${__dirname}`);
    app.use(express.static(path));
    app.get('/', (req, res) => {
      res.sendFile(path + 'index.html');
    });

    // MIDDLEWARE

    // 1. Body parser
    app.use(express.json({ limit: '10kb' }));

    // 2. Logger
    if (process.env.NODE_ENV === 'development')
      app.use(morgan('dev'));

    // 3. Cookie Parser
    app.use(cookieParser());

    // 4. Cors
    app.use(
      cors({
        origin: config.get<string>('origin'),
        credentials: true,
      })
    );
    // ROUTES
    app.use('/api/auth', authRouter);
    app.use('/api/users', userRouter);

    // HEALTH CHECKER
    app.get('/api/healthchecker', async (_, res: Response) => {
      const message = await redisClient.get('try');
      res.status(200).json({
        status: 'success',
        message,
      });
    });

    // UNHANDLED ROUTE
    app.all(
      '*',
      (req: Request, res: Response, next: NextFunction) => {
        next(new AppError(404, `Route ${req.originalUrl} not found`));
      }
    );

    // (async function () {
    //   const credentials = await nodemailer.createTestAccount();
    //   console.log(credentials);
    // })();

    // GLOBAL ERROR HANDLER
    app.use(
      (
        error: AppError,
        req: Request,
        res: Response,
        next: NextFunction
      ) => {
        error.status = error.status || 'error';
        error.statusCode = error.statusCode || 500;

        res.status(error.statusCode).json({
          status: error.status,
          message: error.message,
        });
      }
    );

    // start express server
    const port = config.get<number>('port');
    app.listen(port);

    console.log(`Server started on port: ${port}`);
  })
  .catch((error) => console.log(error));
