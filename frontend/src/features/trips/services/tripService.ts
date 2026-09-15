import { Trip, TripStatus, OfflineTripAction } from '../types/tripTypes';
import { tripsApi } from '../api/tripsApi';

const OFFLINE_TRIP_KEY = 'ner_offline_active_trip';
const OFFLINE_QUEUE_KEY = 'ner_offline_trip_actions_queue';

export class TripService {
  private static instance: TripService;

  private constructor() {}

  public static getInstance(): TripService {
    if (!TripService.instance) {
      TripService.instance = new TripService();
    }
    return TripService.instance;
  }

  public async fetchCurrentTrip(): Promise<Trip | null> {
    try {
      const trip = await tripsApi.getCurrentTrip();
      if (trip && typeof window !== 'undefined') {
        localStorage.setItem(OFFLINE_TRIP_KEY, JSON.stringify(trip));
      }
      return trip;
    } catch (err) {
      console.warn('Network unavailable, falling back to cached trip:', err);
      return this.getCachedTrip();
    }
  }

  public getCachedTrip(): Trip | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(OFFLINE_TRIP_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public async queueOfflineAction(
    tripId: string,
    actionType: 'START' | 'PAUSE' | 'RESUME' | 'COMPLETE',
    payload?: any
  ): Promise<OfflineTripAction> {
    const action: OfflineTripAction = {
      local_action_id: `ACT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      trip_id: tripId,
      action_type: actionType,
      payload,
      created_at: new Date().toISOString(),
      sync_status: 'PENDING',
    };

    if (typeof window !== 'undefined') {
      const queue = this.getOfflineQueue();
      queue.push(action);
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    }
    return action;
  }

  public getOfflineQueue(): OfflineTripAction[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public async syncOfflineActions(): Promise<number> {
    const queue = this.getOfflineQueue();
    if (queue.length === 0) return 0;

    let syncedCount = 0;
    const remaining: OfflineTripAction[] = [];

    for (const action of queue) {
      try {
        if (action.action_type === 'START') {
          await tripsApi.startTrip(action.trip_id, action.payload?.lat, action.payload?.lng, action.payload?.notes);
        } else if (action.action_type === 'PAUSE') {
          await tripsApi.pauseTrip(action.trip_id, action.payload?.reason || 'Offline pause', action.payload?.lat, action.payload?.lng);
        } else if (action.action_type === 'RESUME') {
          await tripsApi.resumeTrip(action.trip_id, action.payload?.lat, action.payload?.lng);
        } else if (action.action_type === 'COMPLETE') {
          await tripsApi.completeTrip(action.trip_id, action.payload?.lat, action.payload?.lng, action.payload?.notes, action.payload?.finalDistanceKm);
        }
        syncedCount++;
      } catch (err) {
        console.error('Failed to sync offline action:', action, err);
        remaining.push(action);
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
    }
    return syncedCount;
  }
}

export const tripService = TripService.getInstance();
