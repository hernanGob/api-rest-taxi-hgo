import validator from "validator";
import { comparePassword } from "../../utils/argon2.js";
import { signToken } from "../../utils/signJwt.js";
import { UserRepository } from "./admin.repo.js";
import type { UserLoginDto } from "./admin.types.js";

export class UserService {
    constructor(private readonly userRepository: UserRepository) { }

    async login(data: UserLoginDto) {
        if (!data.email || !data.password) {
            throw new Error("Correo electrónico y contraseña son obligatorios");
        }

        const email = data.email.trim().toLowerCase();

        if (!validator.isEmail(email)) {
            throw new Error("El correo electrónico no tiene un formato válido");
        }

        const user = await this.userRepository.findByEmail(email);

        if (!user) {
            throw new Error("El usuario no se encuentra registrado");
        }

        if (!user.passwordHash) {
            throw new Error("El usuario no tiene contraseña registrada");
        }

        const isPasswordValid = await comparePassword(data.password, user.passwordHash);

        if (!isPasswordValid) {
            throw new Error("Contraseña incorrecta");
        }

        const token = signToken({
            sub: user.id,
            rol: user.userRole,
        });

        return {
            token,
            user: {
                id: user.id,
                name: user.name,
                paternalSurname: user.paternalSurname,
                maternalSurname: user.maternalSurname,
                phone: user.phone,
                email: user.email,
                userRoleId: user.userRoleId,
            },
        };
    }
}