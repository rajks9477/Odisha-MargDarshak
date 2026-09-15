export interface GpsTelemetry {
  latitude: number;
  longitude: number;
  accuracy: number; // in meters
  speed: number; // in km/h
  heading: number; // in degrees (0-360)
  timestamp: number; // epoch ms
  isSimulated?: boolean;
  isStale?: boolean;
}

export type LocationErrorType = 
  | "PERMISSION_DENIED" 
  | "POSITION_UNAVAILABLE" 
  | "TIMEOUT" 
  | "GPS_DISABLED" 
  | "POOR_ACCURACY" 
  | "UNKNOWN";

export interface LocationErrorState {
  type: LocationErrorType;
  message: string;
}

// Simulated GPS path along NH-6 South NER Spine for lab/desktop testing
export const SIMULATED_CORRIDOR_WAYPOINTS: GpsTelemetry[] = [
  { latitude: 26.180, longitude: 91.730, accuracy: 3.5, speed: 45.0, heading: 135, timestamp: Date.now(), isSimulated: true },
  { latitude: 25.900, longitude: 91.880, accuracy: 4.0, speed: 40.0, heading: 140, timestamp: Date.now(), isSimulated: true },
  { latitude: 25.570, longitude: 91.880, accuracy: 4.8, speed: 42.0, heading: 145, timestamp: Date.now(), isSimulated: true },
  { latitude: 25.450, longitude: 92.200, accuracy: 5.2, speed: 38.0, heading: 130, timestamp: Date.now(), isSimulated: true },
  { latitude: 25.105, longitude: 92.365, accuracy: 6.0, speed: 25.0, heading: 120, timestamp: Date.now(), isSimulated: true }, // Sonapur
  { latitude: 24.830, longitude: 92.790, accuracy: 4.2, speed: 50.0, heading: 165, timestamp: Date.now(), isSimulated: true }, // Silchar
  { latitude: 24.500, longitude: 92.750, accuracy: 3.8, speed: 48.0, heading: 175, timestamp: Date.now(), isSimulated: true }, // Vairengte
  { latitude: 23.730, longitude: 92.710, accuracy: 3.2, speed: 30.0, heading: 180, timestamp: Date.now(), isSimulated: true }, // Aizawl
];

export class LocationService {
  private static watchId: number | null = null;
  private static simulationInterval: NodeJS.Timeout | null = null;
  private static simIndex: number = 0;

  /**
   * Request device GPS permission and check capability
   */
  public static async checkPermission(): Promise<"granted" | "denied" | "prompt" | "unsupported"> {
    if (typeof window === "undefined" || !navigator.geolocation) {
      return "unsupported";
    }

    if (navigator.permissions && navigator.permissions.query) {
      try {
        const status = await navigator.permissions.query({ name: "geolocation" });
        return status.state;
      } catch {
        return "prompt";
      }
    }

    return "prompt";
  }

  /**
   * Get single instantaneous device GPS fix
   */
  public static getCurrentPosition(highAccuracy: boolean = true): Promise<GpsTelemetry> {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !navigator.geolocation) {
        reject({ type: "POSITION_UNAVAILABLE", message: "Geolocation not supported by device hardware" });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const speedKmh = pos.coords.speed ? pos.coords.speed * 3.6 : 0.0;
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            speed: speedKmh,
            heading: pos.coords.heading || 0.0,
            timestamp: pos.timestamp,
            isSimulated: false,
          });
        },
        (err) => {
          let errorType: LocationErrorType = "UNKNOWN";
          if (err.code === err.PERMISSION_DENIED) errorType = "PERMISSION_DENIED";
          else if (err.code === err.POSITION_UNAVAILABLE) errorType = "POSITION_UNAVAILABLE";
          else if (err.code === err.TIMEOUT) errorType = "TIMEOUT";

          reject({ type: errorType, message: err.message });
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout: 12000,
          maximumAge: 10000,
        }
      );
    });
  }

  /**
   * Start continuous high-accuracy live GPS stream
   */
  public static startWatching(
    onLocation: (loc: GpsTelemetry) => void,
    onError: (err: LocationErrorState) => void,
    options: { highAccuracy?: boolean; intervalMs?: number } = {}
  ): void {
    if (this.watchId !== null) {
      this.stopWatching();
    }

    if (typeof window === "undefined" || !navigator.geolocation) {
      onError({ type: "POSITION_UNAVAILABLE", message: "GPS hardware telemetry unavailable." });
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const speedKmh = pos.coords.speed ? pos.coords.speed * 3.6 : 0.0;
        onLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: speedKmh,
          heading: pos.coords.heading || 0.0,
          timestamp: pos.timestamp,
          isSimulated: false,
        });
      },
      (err) => {
        let errType: LocationErrorType = "UNKNOWN";
        if (err.code === err.PERMISSION_DENIED) errType = "PERMISSION_DENIED";
        else if (err.code === err.POSITION_UNAVAILABLE) errType = "POSITION_UNAVAILABLE";
        else if (err.code === err.TIMEOUT) errType = "TIMEOUT";

        onError({ type: errType, message: err.message });
      },
      {
        enableHighAccuracy: options.highAccuracy ?? true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );
  }

  /**
   * Stop active GPS watcher
   */
  public static stopWatching(): void {
    if (this.watchId !== null && typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.simulationInterval !== null) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  /**
   * Simulated GPS test drive mode for lab environments
   */
  public static startSimulatedDrive(onLocation: (loc: GpsTelemetry) => void): void {
    this.stopWatching();
    this.simIndex = 0;

    const emitNext = () => {
      const point = SIMULATED_CORRIDOR_WAYPOINTS[this.simIndex];
      onLocation({
        ...point,
        timestamp: Date.now(),
      });
      this.simIndex = (this.simIndex + 1) % SIMULATED_CORRIDOR_WAYPOINTS.length;
    };

    emitNext();
    this.simulationInterval = setInterval(emitNext, 6000);
  }
}
