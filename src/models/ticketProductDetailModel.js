import Joi from "joi";
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from "../utils/validators";
import { GET_DB } from "../config/mongodb";
import { ObjectId } from "mongodb";

const TICKET_PRODUCT_DETAIL_COLLECTION_NAME = "ticket_product_details";
const TICKET_PRODUCT_DETAIL_COLLECTION_SCHEMA = Joi.object({
    ticketId: Joi.string()
        .required()
        .pattern(OBJECT_ID_RULE)
        .message(OBJECT_ID_RULE_MESSAGE),
    productId: Joi.string()
        .required()
        .pattern(OBJECT_ID_RULE)
        .message(OBJECT_ID_RULE_MESSAGE),
    quantity: Joi.number().required(),
    price: Joi.number().required(),
    createdAt: Joi.date().timestamp("javascript").default(Date.now),
    updatedAt: Joi.date().timestamp("javascript").default(null),
    _deletedAt: Joi.boolean().default(false),
});

const validateBeforeCreateMany = async (dataArray) => {
    return await Promise.all(
        dataArray.map(async (data) => {
            const validatedData = await TICKET_PRODUCT_DETAIL_COLLECTION_SCHEMA.validateAsync(data, {
                abortEarly: false,
            });
            return {
                ...validatedData,
                ticketId: new ObjectId(validatedData.ticketId),
                productId: new ObjectId(validatedData.productId),
            };
        })
    );
};

const insertMany = async (dataArray) => {
    try {
        const validDataArray = await validateBeforeCreateMany(dataArray);
        const ticketDetails = await GET_DB()
            .collection(TICKET_PRODUCT_DETAIL_COLLECTION_NAME)
            .insertMany(validDataArray);
        return ticketDetails;
    } catch (error) {
        throw new Error(error);
    }
};

async function getTicketDetailsWithPriceFromProducts(ticketId, products) {
    try {
        const db = await GET_DB();
        const productsCollection = db.collection("products");

        // Create an array of promises to fetch product information
        const productPromises = products.map(async (productInfo) => {
            const { productId, quantity } = productInfo;
            const product = await productsCollection.findOne({ _id: new ObjectId(productId), _deletedAt: false, status: "active" }); // Assuming 'status: "active"' might apply to products as well, adjust if needed
            return product ? { ticketId: ticketId, productId: productId, price: product.price, quantity: quantity } : null;
        });

        // Wait for all promises to complete
        const ticketDetails = await Promise.all(productPromises);

        // Filter out null results (if a product was not found or not available)
        return ticketDetails.filter(detail => detail !== null);

    } catch (error) {
        console.error("Error querying product information:", error);
        return []; // Return an empty array in case of an error
    }
}

const getTotalPriceTicketDetails = async (filter) => {
    try {
        const results = await GET_DB()
            .collection(TICKET_PRODUCT_DETAIL_COLLECTION_NAME)
            .find(filter).toArray();

        // Calculate the total price by summing the 'price' of each record
        const totalPrice = results.reduce((sum, record) => sum + (record.price * record.quantity), 0);
        return totalPrice;
    } catch (error) {
        throw new Error(error);
    }
};

const deleteMany = async (filter) => {
    try {
        const result = await GET_DB()
            .collection(TICKET_PRODUCT_DETAIL_COLLECTION_NAME)
            .deleteMany(filter);
        return result;
    } catch (error) {
        throw new Error(error);
    }
};

const find = async (filter) => {
    try {
        const results = await GET_DB()
            .collection(TICKET_PRODUCT_DETAIL_COLLECTION_NAME)
            .find(filter).toArray();
        return results;
    } catch (error) {
        throw new Error(error);
    }
};

export const ticketProductDetail = {
    TICKET_PRODUCT_DETAIL_COLLECTION_NAME,
    TICKET_PRODUCT_DETAIL_COLLECTION_SCHEMA,
    getTicketDetailsWithPriceFromProducts,
    insertMany,
    getTotalPriceTicketDetails,
    deleteMany,
    find
}