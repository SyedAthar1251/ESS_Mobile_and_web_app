import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

export async function requestLocationPermissions(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    const status = await Geolocation.checkPermissions();
    if (status.location !== "granted") {
      await Geolocation.requestPermissions();
    }
  } catch (err) {
    console.error("Location permission request failed:", err);
  }
}
