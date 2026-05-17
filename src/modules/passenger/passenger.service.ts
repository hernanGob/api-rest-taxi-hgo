import { comparePassword, hashPassword } from "../../utils/argon2.js";
import { signToken } from "../../utils/signJwt.js";
import type { EmergencyContactDto } from "../emergencyContact/emergencyContact.types.js";
import type { PassengerRepository } from "./passenger.repo.js";
import type { PassengerDto } from "./passenger.types.js";
import validator from 'validator';


export class PassengerService {
    constructor(
        private readonly passengerRepository: PassengerRepository
    ) { }

    async register(data: PassengerDto, dataEmergencyContact: EmergencyContactDto | null, addEmergencyContact: Boolean) {
        if (!data) {
            throw new Error("Datos faltantes");
        }

        if (!validator.isEmail(data.email.trim().toLowerCase())) {
            throw new Error("El correo electrónico no tiene un formato válido");
        }

        const resultPassenger = await this.passengerRepository.findPassengerByEmail(data.email);
        if(resultPassenger){
            throw new Error("El usuario ya esta registrado");
        }

        if (!validator.isMobilePhone(data.phone, 'es-MX')) {
            throw new Error("El número de teléfono no tiene un formato válido");
        }

        if (!validator.isDate(data.dateOfBirth)) {
            throw new Error("La fecha de nacimiento no tiene un formato válido");
        }

        const dataPassenger: PassengerDto = {
            ...data,
            password: await hashPassword(data.password),
            email: data.email.trim().toLowerCase(),
        }

        const result = await this.passengerRepository.createPassenger(dataPassenger, dataEmergencyContact, addEmergencyContact);

        if (!result) {
            throw new Error("Error al registrar los datos ingresados");
        }

        return result;
    }

    async login(email: string, password: string) {
        if (!email || !password) {
            throw new Error("Correo electrónico y contraseña son obligatorios");
        }

        if (!validator.isEmail(email.trim().toLowerCase())) {
            throw new Error("El correo electrónico no tiene un formato válido");
        }

        const resultPassenger = await this.passengerRepository.findPassengerByEmail(email);

        if (!resultPassenger) {
            throw new Error("El usuario no se encuentra registrado");
        }

        if (!resultPassenger.password) {
            throw new Error("El usuario no tiene contraseña registrada");
        }

        const isPasswordValid = await comparePassword(
            password,
            resultPassenger.password
        );

        if (!isPasswordValid) {
            throw new Error("Contraseña incorrecta");
        }

        const token = signToken({
            sub: resultPassenger.id
        });

        return token;
    }
}