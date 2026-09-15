import { MapApi } from "../api/mapApi";
import {
  MapIncidentItem,
  MapRoadItem,
  MapInfrastructureItem,
  MapVehicleItem,
  MapLayerConfigItem,
} from "../types/mapTypes";

export interface IMapProvider {
  name: string;
  defaultCenter: [number, number]; // [lat, lng]
  defaultZoom: number;
  minZoom: number;
  maxZoom: number;
  tileUrl: string;
  attribution: string;
}

export const OPENSTREETMAP_PROVIDER: IMapProvider = {
  name: "OpenStreetMap Carto NER",
  defaultCenter: [25.570, 91.880], // Sonapur / Shillong corridor hub
  defaultZoom: 10,
  minZoom: 6,
  maxZoom: 18,
  tileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors • NER-MargDarshak GIS',
};

export const SATELLITE_HYBRID_PROVIDER: IMapProvider = {
  name: "Esri World Imagery (Mountain Relief)",
  defaultCenter: [25.570, 91.880],
  defaultZoom: 10,
  minZoom: 6,
  maxZoom: 18,
  tileUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
};

export class MapService {
  private static activeProvider: IMapProvider = OPENSTREETMAP_PROVIDER;

  public static setProvider(provider: IMapProvider) {
    this.activeProvider = provider;
  }

  public static getProvider(): IMapProvider {
    return this.activeProvider;
  }

  public static async loadInitialMapLayers(): Promise<{
    incidents: MapIncidentItem[];
    roads: MapRoadItem[];
    infrastructure: MapInfrastructureItem[];
    layers: MapLayerConfigItem[];
  }> {
    const [incidents, roads, infrastructure, layers] = await Promise.all([
      MapApi.getIncidents({ format: "json" }),
      MapApi.getRoads({ format: "json" }),
      MapApi.getInfrastructure(),
      MapApi.getLayers(),
    ]);

    return {
      incidents: Array.isArray(incidents) ? incidents : [],
      roads: Array.isArray(roads) ? roads : [],
      infrastructure: Array.isArray(infrastructure) ? infrastructure : [],
      layers: Array.isArray(layers) ? layers : [],
    };
  }
}
