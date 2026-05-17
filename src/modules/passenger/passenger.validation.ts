import validator from "validator";

export function validatePassengerRegisterBody(body: any) {
    const errors: string[] = [];
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

    if (!body.phone || typeof body.phone !== "string") {
        errors.push("El teléfono es requerido");
    } else if (!validator.isMobilePhone(body.phone.trim(), "es-MX")) {
        errors.push("El teléfono no tiene un formato válido");
    }

    if (!body.email || typeof body.email !== "string") {
        errors.push("El correo electrónico es requerido");
    } else if (!validator.isEmail(body.email.trim())) {
        errors.push("El correo electrónico no tiene un formato válido");
    }

    if (!body.password || typeof body.password !== "string") {
        errors.push("La contraseña es requerida");
    } else if (!validator.isLength(body.password, { min: 8, max: 72 })) {
        errors.push("La contraseña debe tener entre 8 y 72 caracteres");
    }

    if (!body.dateOfBirth || typeof body.dateOfBirth !== "string") {
        errors.push("La fecha de nacimiento es requerida");
    } else if (!validator.isDate(body.dateOfBirth, { format: "YYYY-MM-DD", strictMode: true })) {
        errors.push("La fecha de nacimiento debe tener formato YYYY-MM-DD");
    }

    if (body.addEmergencyContact !== undefined && typeof body.addEmergencyContact !== "boolean") {
        errors.push("El campo addEmergencyContact debe ser true o false");
    }

    if (body.addEmergencyContact === true) {
        const emergencyContact = body.emergencyContact;

        if (!emergencyContact || typeof emergencyContact !== "object") {
            errors.push("Los datos del contacto de emergencia son requeridos");
        } else {
            if (
                !emergencyContact.name ||
                typeof emergencyContact.name !== "string" ||
                validator.isEmpty(emergencyContact.name.trim())
            ) {
                errors.push("El nombre del contacto de emergencia es requerido");
            }

            if (
                !emergencyContact.paternalSurname ||
                typeof emergencyContact.paternalSurname !== "string" ||
                validator.isEmpty(emergencyContact.paternalSurname.trim())
            ) {
                errors.push("El apellido paterno del contacto de emergencia es requerido");
            }

            if (
                !emergencyContact.maternalSurname ||
                typeof emergencyContact.maternalSurname !== "string" ||
                validator.isEmpty(emergencyContact.maternalSurname.trim())
            ) {
                errors.push("El apellido materno del contacto de emergencia es requerido");
            }

            if (!emergencyContact.phone || typeof emergencyContact.phone !== "string") {
                errors.push("El teléfono del contacto de emergencia es requerido");
            } else if (!validator.isMobilePhone(emergencyContact.phone.trim(), "es-MX")) {
                errors.push("El teléfono del contacto de emergencia no tiene un formato válido");
            }

            if (!emergencyContact.email || typeof emergencyContact.email !== "string") {
                errors.push("El correo electrónico del contacto de emergencia es requerido");
            } else if (!validator.isEmail(emergencyContact.email.trim())) {
                errors.push("El correo electrónico del contacto de emergencia no tiene un formato válido");
            }
        }
    }

    return errors;
}

export function validatePassengerLoginBody(body: any) {
    const errors: string[] = [];

    if (!body.email || typeof body.email !== "string") {
        errors.push("El correo electrónico es requerido");
    } else if (!validator.isEmail(body.email.trim())) {
        errors.push("El correo electrónico no tiene un formato válido");
    }

    if (!body.password || typeof body.password !== "string") {
        errors.push("La contraseña es requerida");
    } else if (validator.isEmpty(body.password.trim())) {
        errors.push("La contraseña no puede estar vacía");
    }

    return errors;
}