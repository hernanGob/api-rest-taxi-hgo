import { Router } from "express";
import type { ConcessionaireController } from "./concessionaire.controller.js";
import { authenticateTokenWeb } from "../../middleware/authMiddlewareAdmin.js";

export const ConcessionaireRoutes = (
    concessionaireController: ConcessionaireController
) => {
    const router = Router();

    router.get(
        "/all",
        authenticateTokenWeb,
        concessionaireController.listConcessionaires
    );

    return router;
};