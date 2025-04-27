import { MongoClient, ServerApiVersion } from "mongodb";
import { env } from "../config/environment";

const MONGODB_URI = env.MONGODB_URI;
const DATABASE_NAME = env.DATABASE_NAME;

// Khởi tạo một đối tượng vieFilmDatabaseInstance ban đầu là null (vì chưa connect)
let vieFilmDatabaseInstance = null;

// Khởi tạo một đối tượng mongoClientInstance để connect tới MongoDB
const mongoClientInstance = new MongoClient(MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Kết nối tới database
export const CONNECT_DB = async () => {
  // Gọi kết nối tới MongoDB Atlas với URI đã khai báo trong thân của mongoClientInstance
  await mongoClientInstance.connect();

  // Kết nối thành công thì lấy ra database theo tên và gán ngược lại vào biến vieFilmDatabaseInstance
  vieFilmDatabaseInstance = mongoClientInstance.db(DATABASE_NAME);
};

export const GET_DB = () => {
  if (!vieFilmDatabaseInstance)
    throw new Error("Hãy kết nối tới database đầu tiên!");
  return vieFilmDatabaseInstance;
};

// Đóng khi cần
export const CLOSE_DB = async () => {
  await mongoClientInstance.close();
};
