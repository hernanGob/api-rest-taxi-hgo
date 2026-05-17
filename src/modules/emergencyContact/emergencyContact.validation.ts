import validator from "validator";

export function validateEmergencyContactBody(body: any, requireId = false) {
    const errors: string[] = [];

    if (requireId) {
        if (!body.id || typeof body.id !== "string" || !validator.isUUID(body.id)) {
            errors.push("El id no es válido");
        }
    }

    if (!body.name || typeof body.name !== "string" || validator.isEmpty(body.name.trim())) {
        errors.push("El nombre es requerido");
    }

    if (
        !body.paternalSurname ||
        typeof body.paternalSurname !== "string" ||
        validator.isEmpty(body.paternalSurname.trim())
    ) {
        errors.push("El apellido paterno es requerido");
    }

    if (
        !body.maternalSurname ||
        typeof body.maternalSurname !== "string" ||
        validator.isEmpty(body.maternalSurname.trim())
    ) {
        errors.push("El apellido materno es requerido");
    }

    if (!body.email || typeof body.email !== "string") {
        errors.push("El correo electrónico es requerido");
    } else if (!validator.isEmail(body.email.trim())) {
        errors.push("El correo electrónico no es válido");
    }

    if (!body.phone || typeof body.phone !== "string") {
        errors.push("El teléfono es requerido");
    } else if (!validator.isMobilePhone(body.phone.trim(), "es-MX")) {
        errors.push("El teléfono no es válido");
    }

    return errors;
}

export function validateUUID(id: unknown) {
    return typeof id === "string" && validator.isUUID(id);
}

export function validateEmailParam(email: unknown) {
    return typeof email === "string" && validator.isEmail(email.trim());
}