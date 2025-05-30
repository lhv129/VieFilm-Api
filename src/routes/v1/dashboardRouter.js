// routes/dashboardRouter.ts
import express from "express";
import { dashboardController } from "../../controllers/dashboardController";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";

const router = express.Router();

router.use(authenticateToken, roleMiddleware.checkRole('Admin', 'Staff'));

router.post("/get-revenue-by-cinema", dashboardController.getRevenueByCinema);
router.post("/get-revenue-by-movie", dashboardController.getRevenueByMovie);
router.post("/get-total-seat", dashboardController.getTotalSeat);
router.post("/get-revenue-top-by-cinema", dashboardController.getTop5RevenueCinemas);

export const dashboardRouter = router;
