// controllers/dashboardController.ts
import { dashboardService } from "../services/dashboardService";

const getRevenueByCinema = async (req, res, next) => {
    try {
        const revenueData = await dashboardService.getRevenueByCinema();
        return res.status(200).json({
            status: "success",
            message: "Lấy doanh thu theo rạp thành công",
            data: revenueData
        });
    } catch (error) {
        next(error);
    }
}

const getRevenueByMovie = async (req, res, next) => {
    try {
        const revenueData = await dashboardService.getRevenueByMovie();
        return res.status(200).json({
            status: "success",
            message: "Lấy doanh thu theo phim thành công",
            data: revenueData
        });
    } catch (error) {
        next(error);
    }
}


const getTotalSeat = async (req, res, next) => {
    try {
        const cinemaId = req.params.cinemaId;
        const revenueData = await dashboardService.getTotalSeat(cinemaId);
        return res.status(200).json({
            status: "success",
            message: "Lấy tổng số vé bán ra thành công",
            data: revenueData
        });
    } catch (error) {
        next(error);
    }
}

const getTop5RevenueCinemas = async (req, res, next) => {
    try {
        const revenueData = await dashboardService.getTop5RevenueCinemas();
        return res.status(200).json({
            status: "success",
            message: "Doanh thu các cụm rạp cao nhất",
            data: revenueData
        });
    } catch (error) {
        next(error);
    }
}


export const dashboardController = {
    getRevenueByCinema,
    getRevenueByMovie,
    getTotalSeat,
    getTop5RevenueCinemas
};
