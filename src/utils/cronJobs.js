import cron from 'node-cron';
import { GET_DB } from '../config/mongodb.js';

/**
 * Logic dọn dẹp vé hết hạn (có thể gọi ở mọi nơi như API hoặc cron).
 */
export const cleanupExpiredTickets = async () => {
    const db = GET_DB();
    const now = new Date();

    const expiredTickets = await db.collection('tickets').find({
        expireAt: { $lt: now },
        status: 'hold'
    }).project({ _id: 1 }).toArray();

    if (expiredTickets.length === 0) return { deletedCount: 0 };

    const expiredTicketIds = expiredTickets.map(t => t._id);

    await db.collection('ticket_details').deleteMany({
        ticketId: { $in: expiredTicketIds }
    });

    await db.collection('ticket_product_details').deleteMany({
        ticketId: { $in: expiredTicketIds }
    });

    const deleteTicketsResult = await db.collection('tickets').deleteMany({
        _id: { $in: expiredTicketIds }
    });

    return { deletedCount: deleteTicketsResult.deletedCount };
};

// export const scheduleCleanupTickets = () => {
//     cron.schedule('* * * * *', async () => {
//         try {
//             const db = GET_DB();
//             const now = new Date();

//             const expiredTickets = await db.collection('tickets').find({
//                 expireAt: { $lt: now },
//                 status: "hold"
//             }).project({ _id: 1 }).toArray();

//             if (expiredTickets.length === 0) return;

//             const expiredTicketIds = expiredTickets.map(t => t._id);

//             const deleteDetailsResult = await db.collection('ticket_details').deleteMany({
//                 ticketId: { $in: expiredTicketIds }
//             });

//             const deleteProductDetailsResult = await db.collection('ticket_product_details').deleteMany({
//                 ticketId: { $in: expiredTicketIds }
//             });

//             const deleteTicketsResult = await db.collection('tickets').deleteMany({
//                 _id: { $in: expiredTicketIds }
//             });

//             console.log(`🗑️ Đã xóa ${deleteTicketsResult.deletedCount} vé hết hạn`);
//         } catch (err) {
//             console.error('❌ Cron job lỗi:', err);
//         }
//     });
// };
