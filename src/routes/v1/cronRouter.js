import express from 'express';
import { cleanupExpiredTickets } from '../../utils/cronJobs.js';

const Router = express.Router();

Router.get('/cleanup-tickets', async (req, res) => {
    try {
        const result = await cleanupExpiredTickets();
        res.status(200).json({
            message: `Đã xóa ${result.deletedCount} vé hết hạn`
        });
    } catch (error) {
        console.error('❌ Cron API Error:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra trong quá trình cleanup' });
    }
});

export const cronRouter = Router;
