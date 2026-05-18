import validator from "validator";

export function validateCreateTripBody(body: any) {
    const errors: string[] = [];

    if (!body.passengerId || !validator.isUUID(String(body.passengerId))) {
        errors.push("El passengerId no es válido");
    }

    if (!body.origin || typeof body.origin !== "object") {
        errors.push("El origen es requerido");
    } else {
        if (!Number.isFinite(Number(body.origin.lat))) {
            errors.push("La latitud del origen no es válida");
        }

        if (!Number.isFinite(Number(body.origin.lng))) {
            errors.push("La longitud del origen no es válida");
        }
    }

    if (!body.destination || typeof body.destination !== "object") {
        errors.push("El destino es requerido");
    } else {
        if (!Number.isFinite(Number(body.destination.lat))) {
            errors.push("La latitud del destino no es válida");
        }

        if (!Number.isFinite(Number(body.destination.lng))) {
            errors.push("La longitud del destino no es válida");
        }
    }

    if (
        !body.destinationAddress ||
        typeof body.destinationAddress !== "string" ||
        validator.isEmpty(body.destinationAddress.trim())
    ) {
        errors.push("La dirección del destino es requerida");
    }

    if (!Number.isFinite(Number(body.distanceKm)) || Number(body.distanceKm) <= 0) {
        errors.push("La distancia debe ser mayor a 0");
    }

    if (!Number.isFinite(Number(body.fare)) || Number(body.fare) <= 0) {
        errors.push("La tarifa debe ser mayor a 0");
    }

    if (!Number.isInteger(Number(body.serviceTypeId))) {
        errors.push("El serviceTypeId no es válido");
    }

    if (
        body.pricingConfigId !== undefined &&
        body.pricingConfigId !== null &&
        body.pricingConfigId !== "" &&
        !validator.isUUID(String(body.pricingConfigId))
    ) {
        errors.push("El pricingConfigId no es válido");
    }

    return errors;
}