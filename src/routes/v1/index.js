import express from "express";
import { userRouter } from "./userRouter";
import { roleRouter } from "./roleRouter";
import { authRouter } from "./authRouter";
import { provinceRouter } from "./provinceRouter";
import { cinemaRouter } from "./cinemaRouter";

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
Router.use('/provinces',cinemaRouter);


export const APIs_v1 = Router;