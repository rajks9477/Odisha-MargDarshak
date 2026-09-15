import { Trip, TripRouteGeometry, TripProgress, TripEvent } from '../types/tripTypes';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const tripsApi = {
  async getCurrentTrip(): Promise<Trip | null> {
    const res = await fetch(`${API_BASE}/driver/trips/current`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch current trip: ${res.statusText}`);
    }
    return res.json();
  },

  async getTrips(status?: string): Promise<Trip[]> {
    const url = new URL(`${API_BASE}/driver/trips`);
    if (status) url.searchParams.set('status', status);
    const res = await fetch(url.toString(), {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch trips: ${res.statusText}`);
    return res.json();
  },

  async getTripHistory(): Promise<Trip[]> {
    const res = await fetch(`${API_BASE}/driver/trips/history`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch trip history: ${res.statusText}`);
    return res.json();
  },

  async getTripDetails(tripId: string): Promise<Trip> {
    const res = await fetch(`${API_BASE}/driver/trips/${tripId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch trip details: ${res.statusText}`);
    return res.json();
  },

  async getTripRoute(tripId: string): Promise<TripRouteGeometry> {
    const res = await fetch(`${API_BASE}/driver/trips/${tripId}/route`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch trip route: ${res.statusText}`);
    return res.json();
  },

  async getTripProgress(tripId: string): Promise<TripProgress> {
    const res = await fetch(`${API_BASE}/driver/trips/${tripId}/progress`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch trip progress: ${res.statusText}`);
    return res.json();
  },

  async getTripEvents(tripId: string): Promise<TripEvent[]> {
    const res = await fetch(`${API_BASE}/driver/trips/${tripId}/events`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch trip events: ${res.statusText}`);
    return res.json();
  },

  async acceptTrip(tripId: string, notes?: string): Promise<Trip> {
    const res = await fetch(`${API_BASE}/driver/trips/${tripId}/accept`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ notes }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Failed to accept trip');
    }
    return res.json();
  },

  async startTrip(tripId: string, startLat?: number, startLng?: number, notes?: string): Promise<Trip> {
    const res = await fetch(`${API_BASE}/driver/trips/${tripId}/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        start_latitude: startLat,
        start_longitude: startLng,
        notes: notes || 'Driver safety check complete',
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Failed to start trip');
    }
    return res.json();
  },

  async pauseTrip(tripId: string, reason: string, lat?: number, lng?: number): Promise<Trip> {
    const res = await fetch(`${API_BASE}/driver/trips/${tripId}/pause`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        reason,
        latitude: lat,
        longitude: lng,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Failed to pause trip');
    }
    return res.json();
  },

  async resumeTrip(tripId: string, lat?: number, lng?: number): Promise<Trip> {
    const res = await fetch(`${API_BASE}/driver/trips/${tripId}/resume`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        latitude: lat,
        longitude: lng,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Failed to resume trip');
    }
    return res.json();
  },

  async completeTrip(tripId: string, endLat?: number, endLng?: number, notes?: string, finalDistanceKm?: number): Promise<Trip> {
    const res = await fetch(`${API_BASE}/driver/trips/${tripId}/complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        end_latitude: endLat,
        end_longitude: endLng,
        notes: notes || 'Trip delivered successfully',
        final_distance_km: finalDistanceKm,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Failed to complete trip');
    }
    return res.json();
  },
};
