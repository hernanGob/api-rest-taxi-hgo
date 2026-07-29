export interface FarePricing {
    baseFare: string | number;
    perMinute: string | number;
    perKm: string | number;
}

const SERVICE_INCREASE_PERCENTAGE: Record<
    number,
    number
> = {
    1: 0,  // Esencial
    2: 10, // Selecto
    3: 20, // Prime
};

export function getServiceIncreasePercentage(
    serviceTypeId: number
): number {
    const percentage =
        SERVICE_INCREASE_PERCENTAGE[
        serviceTypeId
        ];

    if (
        typeof percentage !==
        "number"
    ) {
        throw new Error(
            "El tipo de servicio no tiene un porcentaje configurado"
        );
    }

    return percentage;
}

export function calculateFare(params: {
    pricing: FarePricing;
    distanceKm: number;
    durationMin: number;
    increasePercentage: number;
}): number {
    const baseFare =
        Number(
            params.pricing.baseFare
        );

    const perMinute =
        Number(
            params.pricing.perMinute
        );

    const perKm =
        Number(
            params.pricing.perKm
        );

    if (
        !Number.isFinite(baseFare) ||
        !Number.isFinite(perMinute) ||
        !Number.isFinite(perKm) ||
        !Number.isFinite(params.distanceKm) ||
        !Number.isFinite(params.durationMin) ||
        !Number.isFinite(
            params.increasePercentage
        )
    ) {
        throw new Error(
            "No se pudo calcular la tarifa"
        );
    }

    const subtotal =
        baseFare +
        perMinute *
        params.durationMin +
        perKm *
        params.distanceKm;

    return Math.ceil(
        subtotal *
        (
            1 +
            params.increasePercentage /
            100
        )
    );
}