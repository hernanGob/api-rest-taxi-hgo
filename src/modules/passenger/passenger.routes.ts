import { Router } from "express";
import { PassengerController } from "./passenger.controller.js";

export const PassengerRoutes = (passengerController: PassengerController) => {
    const router = Router();

    router.post('/register', passengerController.register.bind(passengerController));
    router.post('/login', passengerController.login.bind(passengerController));

    return router;
};