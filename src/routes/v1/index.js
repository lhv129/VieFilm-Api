import express from "express";
import { userRouter } from "./userRouter";
import { roleRouter } from "./roleRouter";
import { authRouter } from "./authRouter";
import { provinceRouter } from "./provinceRouter";
import { cinemaRouter } from "./cinemaRouter";
import { screenRouter } from "./screenRouter";
import { seatRouter } from "./seatRouter";
import { MovieRouter } from "./movieRouter";
import { showtimeRouter } from "./showtimeRouter";
import { paymentMethodRouter } from "./paymentMethodRouter";
import { productRouter } from "./productRouter";
import { ticketRouter } from "./ticketRouter";
import { promoRouter } from "./promoRouter";
import { cronRouter } from "./cronRouter";
import { dashboardRouter } from "./dashboardRouter";

const Router = express.Router();

// Dashboard APIs
Router.use('/dashboard', dashboardRouter);

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

// Seat APIs
Router.use('/seats',seatRouter);

// Movies APIs
Router.use('/movies',MovieRouter);

// ShowTimes APIs
Router.use('/showtimes',showtimeRouter);

// PaymentMethods APIs
Router.use('/payment-methods',paymentMethodRouter);

// Products APIs
Router.use('/products', productRouter);

// Tickets APIs
Router.use('/tickets', ticketRouter);

// PaymentMethods APIs
Router.use('/promo', promoRouter);

// Cron APIs
Router.use('/cron',cronRouter);


export const APIs_v1 = Router;