import { Router } from "express";
import type { TripController } from "./trip.controller.js";
import { authenticatePassenger } from "../../middleware/passengerMiddleware.js";
import { authenticateTokenWeb } from "../../middleware/authMiddlewareAdmin.js";

export const TripRoutes = (tripController: TripController) => {
    const router = Router();

    router.get("/allTrips", authenticateTokenWeb, tripController.showTripsForDashboard.bind(tripController));

    router.post(
        "/request",
        tripController.createTrip.bind(tripController)
    );

    router.get(
        "/driver/requested",
        tripController.listRequestedTripsForDriver.bind(tripController)
    );

    router.patch(
        "/:id/accept",
        tripController.acceptTrip.bind(tripController)
    );

    router.patch(
        "/:id/start",
        tripController.startTrip.bind(tripController)
    );

    router.patch(
        "/:id/complete",
        tripController.completeTrip.bind(tripController)
    );

    router.get(
        "/:id",
        tripController.getTripById.bind(tripController)
    );

    router.get(
        "/passenger/:passengerId",
        tripController.listTripsByPassenger.bind(tripController)
    );

    router.get(
        "/history/passenger/:passengerId",
        authenticatePassenger,
        tripController.listTripHistoryByPassenger.bind(tripController)
    );

    router.post("/:id/rate", authenticatePassenger, tripController.rateTrip.bind(tripController));

    return router;
};