import pool from "../config/db.js";
import { UserController } from "./admin/admin.controller.js";
import { UserRepository } from "./admin/admin.repo.js";
import { UserRoutes } from "./admin/admin.routes.js";
import { UserService } from "./admin/admin.service.js";
import { DriverController } from "./driver/driver.controller.js";
import { DriverRoutes } from "./driver/driver.routes.js";
import { DriverService } from "./driver/driver.service.js";
import { GeoController } from "./geo/geo.controller.js";
import { GeoRepository } from "./geo/geo.repo.js";
import { GeoRoutes } from "./geo/geo.routes.js";
import { GeoService } from "./geo/geo.service.js";
import { PassengerController } from "./passenger/passenger.controller.js";
import { PassengerRepository } from "./passenger/passenger.repo.js";
import { PassengerRoutes } from "./passenger/passenger.routes.js";
import { PassengerService } from "./passenger/passenger.service.js";
import { PricingController } from "./pricing/pricing.controller.js";
import { PricingRepository } from "./pricing/pricing.repo.js";
import { PricingRoutes } from "./pricing/pricing.routes.js";
import { PricingService } from "./pricing/pricing.service.js";
import { StchAuthService } from "./stch/stchAuth.service.js";

export const buildContainer = () => {
    const passengerRepository = new PassengerRepository(pool);
    const passengerService = new PassengerService(passengerRepository);
    const passengerController = new PassengerController(passengerService);
    const passengerRoutes = PassengerRoutes(passengerController);

    const pricingRepository = new PricingRepository(pool);
    const pricingService = new PricingService(pricingRepository);
    const pricingController = new PricingController(pricingService);
    const pricingRoutes = PricingRoutes(pricingController);

    const geoRepository = new GeoRepository(pool);
    const geoService = new GeoService(geoRepository);
    const geoController = new GeoController(geoService);
    const geoRoutes = GeoRoutes(geoController);

    const stchAuthService = new StchAuthService();
    const driverService = new DriverService(stchAuthService);
    const driverController = new DriverController(driverService);
    const driverRoutes = DriverRoutes(driverController);

    const userRepository = new UserRepository(pool);
    const userService = new UserService(userRepository);
    const userController = new UserController(userService);
    const userRoutes = UserRoutes(userController);

    return {
        passengerRoutes,
        pricingRoutes,
        geoRoutes,
        driverRoutes,
        userRoutes,
    }
}