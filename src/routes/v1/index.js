import express from "express";
import { userRouter } from "./userRouter";
import { roleRouter } from "./roleRouter";
import { authRouter } from "./authRouter";

const Router = express.Router();

// Auth APIs
Router.use('/auth',authRouter);

// User APIs
Router.use('/users',userRouter);

// Role APIs
Router.use('/roles',roleRouter);



export const APIs_v1 = Router;