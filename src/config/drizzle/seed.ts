import { municipality, userRole, } from "./schema.js";
import { generateUUID } from "../../utils/uuid.js";
import pool, { db } from "../db.js";

async function main() {
    const nombresMunicipios = [
        { numero: 1, nombre: 'Acatlán' },
        { numero: 2, nombre: 'Acaxochitlán' },
        { numero: 3, nombre: 'Actopan' },
        { numero: 4, nombre: 'Agua Blanca de Iturbide' },
        { numero: 5, nombre: 'Ajacuba' },
        { numero: 6, nombre: 'Alfajayucan' },
        { numero: 7, nombre: 'Almoloya' },
        { numero: 8, nombre: 'Apan' },
        { numero: 9, nombre: 'El Arenal' },
        { numero: 10, nombre: 'Atitalaquia' },
        { numero: 11, nombre: 'Atlapexco' },
        { numero: 12, nombre: 'Atotonilco el Grande' },
        { numero: 13, nombre: 'Atotonilco de Tula' },
        { numero: 14, nombre: 'Calnali' },
        { numero: 15, nombre: 'Cardonal' },
        { numero: 16, nombre: 'Cuautepec de Hinojosa' },
        { numero: 17, nombre: 'Chapantongo' },
        { numero: 18, nombre: 'Chapulhuacán' },
        { numero: 19, nombre: 'Chilcuautla' },
        { numero: 20, nombre: 'Eloxochitlán' },
        { numero: 21, nombre: 'Emiliano Zapata' },
        { numero: 22, nombre: 'Epazoyucan' },
        { numero: 23, nombre: 'Francisco I. Madero' },
        { numero: 24, nombre: 'Huasca de Ocampo' },
        { numero: 25, nombre: 'Huautla' },
        { numero: 26, nombre: 'Huazalingo' },
        { numero: 27, nombre: 'Huehuetla' },
        { numero: 28, nombre: 'Huejutla de Reyes' },
        { numero: 29, nombre: 'Huichapan' },
        { numero: 30, nombre: 'Ixmiquilpan' },
        { numero: 31, nombre: 'Jacala de Ledezma' },
        { numero: 32, nombre: 'Jaltocán' },
        { numero: 33, nombre: 'Juárez Hidalgo' },
        { numero: 34, nombre: 'Lolotla' },
        { numero: 35, nombre: 'Metepec' },
        { numero: 36, nombre: 'San Agustín Metzquititlán' },
        { numero: 37, nombre: 'Metztitlán' },
        { numero: 38, nombre: 'Mineral del Chico' },
        { numero: 39, nombre: 'Mineral del Monte' },
        { numero: 40, nombre: 'La Misión' },
        { numero: 41, nombre: 'Mixquiahuala de Juárez' },
        { numero: 42, nombre: 'Molango de Escamilla' },
        { numero: 43, nombre: 'Nicolás Flores' },
        { numero: 44, nombre: 'Nopala de Villagrán' },
        { numero: 45, nombre: 'Omitlán de Juárez' },
        { numero: 46, nombre: 'San Felipe Orizatlán' },
        { numero: 47, nombre: 'Pacula' },
        { numero: 48, nombre: 'Pachuca de Soto' },
        { numero: 49, nombre: 'Pisaflores' },
        { numero: 50, nombre: 'Progreso de Obregón' },
        { numero: 51, nombre: 'Mineral de la Reforma' },
        { numero: 52, nombre: 'San Agustín Tlaxiaca' },
        { numero: 53, nombre: 'San Bartolo Tutotepec' },
        { numero: 54, nombre: 'San Salvador' },
        { numero: 55, nombre: 'Santiago de Anaya' },
        { numero: 56, nombre: 'Santiago Tulantepec de Lugo Guerrero' },
        { numero: 57, nombre: 'Singuilucan' },
        { numero: 58, nombre: 'Tasquillo' },
        { numero: 59, nombre: 'Tecozautla' },
        { numero: 60, nombre: 'Tenango de Doria' },
        { numero: 61, nombre: 'Tepeapulco' },
        { numero: 62, nombre: 'Tepehuacán de Guerrero' },
        { numero: 63, nombre: 'Tepeji del Río de Ocampo' },
        { numero: 64, nombre: 'Tepetitlán' },
        { numero: 65, nombre: 'Tetepango' },
        { numero: 66, nombre: 'Villa de Tezontepec' },
        { numero: 67, nombre: 'Tezontepec de Aldama' },
        { numero: 68, nombre: 'Tianguistengo' },
        { numero: 69, nombre: 'Tizayuca' },
        { numero: 70, nombre: 'Tlahuelilpan' },
        { numero: 71, nombre: 'Tlahuiltepa' },
        { numero: 72, nombre: 'Tlanalapa' },
        { numero: 73, nombre: 'Tlanchinol' },
        { numero: 74, nombre: 'Tlaxcoapan' },
        { numero: 75, nombre: 'Tolcayuca' },
        { numero: 76, nombre: 'Tula de Allende' },
        { numero: 77, nombre: 'Tulancingo de Bravo' },
        { numero: 78, nombre: 'Xochiatipan' },
        { numero: 79, nombre: 'Xochicoatlán' },
        { numero: 80, nombre: 'Yahualica' },
        { numero: 81, nombre: 'Zacualtipán de Ángeles' },
        { numero: 82, nombre: 'Zapotlán de Juárez' },
        { numero: 83, nombre: 'Zempoala' },
        { numero: 84, nombre: 'Zimapán' }
    ];

    const roles = [
        {
            code: "super_admin",
            name: 'Super Administrador'
        },
        {
            code: "admin",
            name: 'Administrador'
        }
    ];

    /* const services_type = [
        { id: 1, name: "Esencial", increasePercentage: "0" },
        { id: 2, name: "Selecto", increasePercentage: "10" },
        { id: 3, name: "Prime", increasePercentage: "20" }
    ]; */

    await db.insert(userRole)
        .values(
            roles.map(r => ({
                id: generateUUID(),
                role: r.name,
                code: r.code
            }))
        ).onConflictDoNothing({ target: userRole.role });

    await db.insert(municipality)
        .values(
            nombresMunicipios.map(r => ({
                id: generateUUID(),
                name: r.nombre,
                number: r.numero
            }))
        ).onConflictDoNothing({ target: municipality.name });

    /* await db.insert(serviceType)
        .values(
            services_type.map(r => ({
                id: r.id,
                name: r.name,
                increasePercentage: r.increasePercentage
            }))
        ).onConflictDoNothing({ target: serviceType.name }); */

    console.log("✅ Roles insertados");
    console.log("✅ Tipos servicio insertados");
    /* console.log("✅ Municipios insertados"); */
}

main()
    .catch((err) => {
        console.error("❌ Error en seed:", err);
        process.exit(1);
    })
    .finally(async () => {
        await pool.end(); // 🔑 cierra el pool
    });
