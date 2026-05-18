import validator from "validator";
import { comparePassword, hashPassword } from "../../utils/argon2.js";
import { signToken } from "../../utils/signJwt.js";
import { generateUUID } from "../../utils/uuid.js";
import type { DriverAuthRepository } from "./driverAuth.repo.js";
import { DriverService } from "../driver/driver.service.js";

export class DriverAuthService {
    constructor(
        private readonly driverAuthRepository: DriverAuthRepository,
        private readonly driverService: DriverService
    ) { }

    async checkDriver(idoperador: number) {
        if (!idoperador || !Number.isFinite(idoperador)) {
            throw new Error("El idoperador no es válido");
        }

        const stchDriver = await this.driverService.findDriverById(idoperador);

        if (!stchDriver) {
            throw new Error("El operador no existe en STCH");
        }

        let localDriver = await this.driverAuthRepository.findByIdOperador(
            idoperador
        );

        if (!localDriver) {
            localDriver = await this.driverAuthRepository.createDriverAuth({
                id: generateUUID(),
                idoperador,
                password: null,
            });
        }

        if (!localDriver) {
            throw new Error("No se pudo crear el registro local del operador");
        }

        /* if (localDriver.isSuspended) { 
            throw new Error("Su cuenta se encuentra suspendida");
        } */

        return {
            existsInStch: true,
            needsPassword: !localDriver.password,
            driver: stchDriver,
        };
    }

    async setPassword(data: {
        idoperador: number;
        password: string;
        confirmPassword: string;
    }) {
        if (!data.idoperador || !Number.isFinite(data.idoperador)) {
            throw new Error("El idoperador no es válido");
        }

        if (!data.password || !validator.isLength(data.password, { min: 8, max: 72 })) {
            throw new Error("La contraseña debe tener entre 8 y 72 caracteres");
        }

        if (data.password !== data.confirmPassword) {
            throw new Error("Las contraseñas no coinciden");
        }

        const stchDriver = await this.driverService.findDriverById(data.idoperador);

        if (!stchDriver) {
            throw new Error("El operador no existe en STCH");
        }

        let localDriver = await this.driverAuthRepository.findByIdOperador(
            data.idoperador
        );

        const passwordHash = await hashPassword(data.password);

        if (!localDriver) {
            localDriver = await this.driverAuthRepository.createDriverAuth({
                id: generateUUID(),
                idoperador: data.idoperador,
                password: passwordHash,
            });
        } else {
            if (localDriver.password) {
                throw new Error("El operador ya tiene contraseña registrada");
            }

            localDriver = await this.driverAuthRepository.updatePassword(
                data.idoperador,
                passwordHash
            );
        }

        if (!localDriver) {
            throw new Error("No se pudo guardar la contraseña");
        }

        return {
            idoperador: localDriver.idoperador,
            passwordCreated: true,
        };
    }

    async login(data: { idoperador: number; password: string }) {
        if (!data.idoperador || !Number.isFinite(data.idoperador)) {
            throw new Error("El idoperador no es válido");
        }

        if (!data.password || validator.isEmpty(data.password.trim())) {
            throw new Error("La contraseña es requerida");
        }

        const localDriver = await this.driverAuthRepository.findByIdOperador(
            data.idoperador
        );

        if (!localDriver) {
            throw new Error("El operador no tiene cuenta registrada");
        }

        if (!localDriver.password) {
            throw new Error("El operador aún no ha creado su contraseña");
        }

        const isPasswordValid = await comparePassword(
            data.password,
            localDriver.password
        );

        if (!isPasswordValid) {
            throw new Error("Contraseña incorrecta");
        }

        const token = signToken({
            sub: localDriver.id,
            type: "driver",
            idoperador: localDriver.idoperador,
        });

        return {
            token,
            driver: {
                id: localDriver.id,
                idoperador: localDriver.idoperador,
            },
        };
    }
}