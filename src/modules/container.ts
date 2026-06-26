import pool from "../config/db.js";
import { UserController } from "./admin/admin.controller.js";
import { UserRepository } from "./admin/admin.repo.js";
import { UserRoutes } from "./admin/admin.routes.js";
import { UserService } from "./admin/admin.service.js";
import { ConcessionaireController } from "./concessionaire/concessionaire.controller.js";
import { ConcessionaireRoutes } from "./concessionaire/concessionaire.routes.js";
import { ConcessionaireService } from "./concessionaire/concessionaire.service.js";
import { DriverController } from "./driver/driver.controller.js";
import { DriverRoutes } from "./driver/driver.routes.js";
import { DriverService } from "./driver/driver.service.js";
import { DriverAuthController } from "./driverAuth/driverAuth.controller.js";
import { DriverAuthRepository } from "./driverAuth/driverAuth.repo.js";
import { DriverAuthRoutes } from "./driverAuth/driverAuth.routes.js";
import { DriverAuthService } from "./driverAuth/driverAuth.service.js";
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
import { ServiceTypeController } from "./serviceType/serviceType.controller.js";
import { ServiceTypeRepository } from "./serviceType/serviceType.repo.js";
import { ServiceTypeRoutes } from "./serviceType/serviceType.routes.js";
import { ServiceTypeService } from "./serviceType/serviceType.service.js";
import { StchAuthService } from "./stch/stchAuth.service.js";
import { SupportChatController } from "./supportChat/supportChat.controller.js";
import { SupportChatRepository } from "./supportChat/supportChat.repo.js";
import { SupportChatRoutes } from "./supportChat/supportChat.routes.js";
import { SupportChatService } from "./supportChat/supportChat.service.js";
import { TripController } from "./trips/trip.controller.js";
import { TripRepository } from "./trips/trip.repo.js";
import { TripRoutes } from "./trips/trip.routes.js";
import { TripService } from "./trips/trip.service.js";
import { ZoneController } from "./zone/zone.controller.js";
import { ZoneRepository } from "./zone/zone.repo.js";
import { ZoneRoutes } from "./zone/zone.routes.js";
import { ZoneService } from "./zone/zone.service.js";

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

    const zoneRepository = new ZoneRepository(pool);
    const zoneService = new ZoneService(zoneRepository);
    const zoneController = new ZoneController(zoneService);
    const zoneRoutes = ZoneRoutes(zoneController);

    const driverAuthRepository = new DriverAuthRepository(pool);
    const driverAuthService = new DriverAuthService(
        driverAuthRepository,
        driverService
    );
    const driverAuthController = new DriverAuthController(driverAuthService);
    const driverAuthRoutes = DriverAuthRoutes(driverAuthController);


    const concessionaireService = new ConcessionaireService(stchAuthService);
    const concessionaireController = new ConcessionaireController(
        concessionaireService
    );
    const concessionaireRoutes = ConcessionaireRoutes(concessionaireController);

    const tripRepository = new TripRepository(pool);
    const tripService = new TripService(tripRepository, geoService);
    const tripController = new TripController(tripService);
    const tripRoutes = TripRoutes(tripController);

    const serviceTypeRepository = new ServiceTypeRepository(pool);
    const serviceTypeService = new ServiceTypeService(serviceTypeRepository);
    const serviceTypeController = new ServiceTypeController(serviceTypeService);
    const serviceTypeRoutes = ServiceTypeRoutes(serviceTypeController);

    const supportChatRepository = new SupportChatRepository(pool);
    const supportChatService = new SupportChatService(supportChatRepository);
    const supportChatController = new SupportChatController(supportChatService);
    const supportChatRoutes = SupportChatRoutes(supportChatController);

    return {
        passengerRoutes,
        pricingRoutes,
        geoRoutes,
        driverRoutes,
        userRoutes,
        zoneRoutes,
        driverAuthRoutes,
        concessionaireRoutes,
        tripRoutes,
        serviceTypeRoutes,
        supportChatRoutes,
    }
}