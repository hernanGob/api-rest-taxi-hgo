import { redisClient } from "../../shared/redis/redis.client.js";


export const findNearbyOperators = async (
    latitude: number,
    longitude: number,
    radius: number
) => {


    const operators =
        await redisClient.geoSearch(
            "taxiHgo:operators",

            {
                longitude,
                latitude,
            },

            {
                radius,
                unit: "km"
            }
        );


    return operators;

};