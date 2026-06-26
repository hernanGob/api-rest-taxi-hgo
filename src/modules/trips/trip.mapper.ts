import { config } from "../../config/config.js";
import type { TripRow, TripPoint, TripForApp } from "./trip.types.js";

const GOOGLE_API_KEY = config.API_KEY_GOOGLE;

async function getAddressFromCoordinates(point: TripPoint): Promise<string> {
  if (!point) return "Ubicación desconocida";

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${point.lat},${point.lng}&key=${GOOGLE_API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === "OK" && data.results.length > 0) {
      return data.results[0].formatted_address || point.address || "Ubicación desconocida";
    }
  } catch (err) {
    console.error("Error en geocoding:", err);
  }
  return point.address || "Ubicación desconocida";
}

export async function mapTripForApp(row: TripRow): Promise<TripForApp> {
  const originPoint: TripPoint = {
    lat: row.origin.lat,
    lng: row.origin.lng,
    address: await getAddressFromCoordinates(row.origin),
  };

  const destPoint: TripPoint = {
    lat: row.destination.lat,
    lng: row.destination.lng,
    address: row.destination_address ?? row.destination.address ?? "Ubicación desconocida",
  };

  const time = row.duration_minutes > 0 ? `${row.duration_minutes} min` : "N/A";
  const fare = row.fare ? `$${parseFloat(row.fare).toFixed(2)}` : "$0.00";
  const date = row.completed_at
    ? new Date(row.completed_at).toLocaleString("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Pendiente";

  const place = (destPoint.address || "Ubicación desconocida")
    .split(",")
    .slice(-2)
    .join(", ")
    .trim();

  return {
    id: row.id,
    origin: originPoint,
    destination: destPoint,
    time,
    fare,
    rating: row.passenger_rating || 0,
    comments: row.passenger_comment || "",
    driverName: "",
    vehicle: "",
    plate: "",
    date,
    place,
  };
}