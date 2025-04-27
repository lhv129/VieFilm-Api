import express from "express";
import { userRouter } from "./userRouter";
import { roleRouter } from "./roleRouter";
import { authRouter } from "./authRouter";
import { provinceRouter } from "./provinceRouter";
import { cinemaRouter } from "./cinemaRouter";
import { screenRouter } from "./screenRouter";

const Router = express.Router();

// Auth APIs
Router.use('/auth',authRouter);

// User APIs
Router.use('/users',userRouter);

// Role APIs
Router.use('/roles',roleRouter);

// Province APIs
Router.use('/provinces',provinceRouter);

// Cinema APIs
Router.use('/cinemas',cinemaRouter);

// Screen APIs
Router.use('/screens',screenRouter);


export const APIs_v1 = Router;