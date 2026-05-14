import argon2 from "argon2";

export const hashPassword = async (password: string): Promise<string> => {
    try {
        return await argon2.hash(password, {
            type: argon2.argon2id,
        });
    } catch (error) {
        console.error("Error al hashear la contraseña:", error);
        throw new Error("No se pudo encriptar la contraseña");
    }
};

export const comparePassword = async (
    password: string,
    dbPass: string
): Promise<boolean> => {
    try {
        return await argon2.verify(dbPass, password);
    } catch (error) {
        console.error("Error al comparar la contraseña:", error);
        return false;
    }
};