import express from 'express'
import exitHook from "async-exit-hook"
import { CONNECT_DB, CLOSE_DB } from "./config/mongodb";
import { env } from "./config/environment";
import { APIs_v1 } from "./routes/v1/index";
import { errorHandlingMiddleware } from "./middlewares/errorHandlingMiddleware";  

const START_SERVER = () => {
  const app = express();
  // Cho phép sử dụng req.body json
  app.use(express.json());

  // Sử dụng APIs v1
  app.use('/v1', APIs_v1);

  app.use(errorHandlingMiddleware);

  app.listen(env.APP_PORT, () => {
    console.log(
      `3.Xin chào ${env.APP}, Back-end Server Api đang được chạy tại ${env.APP_PORT}`
    );
  });

  exitHook(() => {
    console.log("4.Back-end Server Api đã dừng");
    CLOSE_DB();
  });
};

// Chỉ khi kết nối tới database thì mới start server backend api
// Cách viết function IIFE
(async () => {
  try {
    console.log("1.Đang kết nối tới MongoDB Cloud Atlas");
    await CONNECT_DB();
    console.log("2.Kết nối thành công tới MongoDB Cloud Atlas");

    START_SERVER();
  } catch (error) {
    console.error(error);
    process.exit(0);
  }
})();