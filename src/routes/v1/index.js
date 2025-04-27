import express from "express";
import { userRouter } from "./userRouter";
import { roleRouter } from "./roleRouter";
import { authRouter } from "./authRouter";
import { provinceRouter } from "./provinceRouter";

const Router = express.Router();

// Auth APIs
Router.use('/auth',authRouter);

// User APIs
Router.use('/users',userRouter);

// Role APIs
Router.use('/roles',roleRouter);

// Province APIs
Router.use('/provinces',provinceRouter);


export const APIs_v1 = Router;