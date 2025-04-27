import express from "express";
import { userRouter } from "./userRouter";
import { roleRouter } from "./roleRouter";

const Router = express.Router();

// User APIs
Router.use('/users',userRouter);

// Role APIs
Router.use('/roles',roleRouter);



export const APIs_v1 = Router;