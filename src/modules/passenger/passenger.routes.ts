import { Router } from "express";
import { PassengerController } from "./passenger.controller.js";
import { authenticatePassenger } from "../../middleware/passengerMiddleware.js";

export const PassengerRoutes = (passengerController: PassengerController) => {
    const router = Router();

    router.post('/register', passengerController.register.bind(passengerController));
    router.post('/login', passengerController.login.bind(passengerController));
    router.get('/session', authenticatePassenger, passengerController.session.bind(passengerController));

    return router;
};