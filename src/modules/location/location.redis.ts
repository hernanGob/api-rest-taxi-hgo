import { redisClient } from "../../shared/redis/redis.client.js";
import type { OperatorLocation } from "./location.types.js";

const OPERATOR_GEO_KEY =
    "operators";


export const saveOperatorLocation = async (
    data: OperatorLocation
) => {

    await redisClient.geoAdd(
        `taxiHgo:${OPERATOR_GEO_KEY}`,
        {
            longitude: data.longitude,
            latitude: data.latitude,
            member: String(data.operatorId)
        }
    );
};

