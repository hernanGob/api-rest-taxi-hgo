import { redisClient } from "./redis.client.js";
import { REDIS_PREFIX } from "./redis.constants.js";


const PREFIX = REDIS_PREFIX;


export const setRedis = async (
    key: string,
    value: unknown,
    expirationSeconds = 60
) => {

    await redisClient.set(
        `${PREFIX}:${key}`,
        JSON.stringify(value),
        {
            EX: expirationSeconds,
        }
    );

};


export const getRedis = async <T = unknown>(
    key: string
): Promise<T | null> => {

    const value = await redisClient.get(
        `${PREFIX}:${key}`
    );


    if (!value) {
        return null;
    }


    return JSON.parse(value) as T;

};


export const deleteRedis = async (
    key: string
) => {
    await redisClient.del(
        `${PREFIX}:${key}`
    );
};

type GeoLocation = {
    longitude: number;
    latitude: number;
    member: string;
};

export const geoAdd = async (
    key: string,
    value: GeoLocation,
) => {

    await redisClient.geoAdd(
        `${PREFIX}:${key}`,
        value
    );

};

type GeoSearchParams = {
    longitude: number;
    latitude: number;
    radius: number;
};

export const searchGeo = async (
    key: string,
    params: GeoSearchParams
) => {

    return await redisClient.geoSearch(
        `${PREFIX}:${key}`,

        {
            longitude: params.longitude,
            latitude: params.latitude,
        },

        {
            radius: params.radius,
            unit: "km",
        }
    );

};
