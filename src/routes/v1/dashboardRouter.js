// routes/dashboardRouter.ts
import express from "express";
import { dashboardController } from "@/controllers/dashboardController";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";

const router = express.Router();

router.use(authenticateToken, roleMiddleware.checkRole("Admin"));

router.get("/get-revenue-by-cinema", dashboardController.getRevenueByCinema);
router.get("/get-revenue-by-movie", dashboardController.getRevenueByMovie);
router.get("/get-total-seat/:cinemaId", dashboardController.getTotalSeat);
router.get("/get-revenue-top-by-cinema", dashboardController.getTop5RevenueCinemas);

export const dashboardRouter = router;
