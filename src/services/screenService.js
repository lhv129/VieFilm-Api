import { slugify } from "../utils/formatters";
import { screenModel } from "../models/screenModel";
import ApiError from "../utils/ApiError";
import { StatusCodes } from "http-status-codes";
import { cinemaModel } from "../models/cinemaModel";

const getAll = async () => {
    try {
        const screens = await screenModel.getAll();
        return screens;
    } catch (error) {
        throw error;
    }
};

const create = async (reqBody) => {
    try {
        const cinema = await cinemaModel.findOneById(reqBody.cinemaId);
        //Xử lý luôn slug
        const data = {
            ...reqBody,
            screenCode: slugify(cinema._id + '-' + reqBody.name)
        };
        const existingScreen = await screenModel.findOne({ screenCode: data.screenCode });
        if (existingScreen) {
            throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, `${data.name} đã có trong rạp ${cinema.name}, vui lòng kiểm tra lại`);
        }

        // Nếu chưa tồn tại thì thêm mới
        const screen = await screenModel.create(data);
        //Lấy bản ghi sau khi thêm
        const getScreen = await screenModel.findOneById(
            screen.insertedId.toString()
        );

        return getScreen;
    } catch (error) {
        throw error;
    }
};

const getDetails = async (id) => {
    try {
        const screen = await screenModel.getDetails(id);
        if (!screen) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Phòng chiếu không tồn tại");
        }
        return screen;
    } catch (error) {
        throw error;
    }
};

const update = async (data) => {
    try {
        const { cinemaId, screenId, name } = data;
        const screen = await screenModel.findOneById(screenId);

        if (!screen) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Phòng chiếu không tồn tại");
        }
        //Kiểm tra Screen đó có trong rạp đó không
        if (screen.cinemaId.toString() !== cinemaId) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Phòng chiếu không thuộc rạp này");
        }

        // Nếu có tồn tại thì cập nhật
        let newScreen = {
            ...data,
            screenCode: slugify(screen.cinemaId + '-' + name),
            updatedAt: Date.now()
        };

        // Cập nhật
        newScreen = await screenModel.update(screenId, newScreen);

        //Lấy bản ghi sau khi cập nhật
        const getNewScreen = await screenModel.findOneById(screen._id.toString());

        return getNewScreen;

    } catch (error) {
        throw error;
    }
};

const getDelete = async (data) => {
    try {
        const { cinemaId, screenId } = data;
        const screen = await screenModel.findOneById(screenId);
        if (!screen) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Phòng chiếu không tồn tại");
        }

        //Kiểm tra Screen đó có trong rạp đó không
        if (screen.cinemaId.toString() !== cinemaId) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Phòng chiếu không thuộc rạp này");
        }
        await screenModel.getDelete(screenId);

        return [];
    } catch (error) {
        throw error;
    }
};

const getAllByCinema = async (cinemaId) => {
    try {
        const cinema = await cinemaModel.findOneById(cinemaId);
        if (!cinema) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Rạp phim không tồn tại")
        }

        const screens = await screenModel.getAllByCinema(cinemaId);
        return screens;
    } catch (error) {
        throw error;
    }
}

export const screenService = {
    getAll,
    create,
    getDetails,
    update,
    getDelete,
    getAllByCinema
};
