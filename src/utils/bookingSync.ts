import { collection, getDocs, doc } from 'firebase/firestore';
import { db, safeSetDoc } from '../firebase';
import { Booking } from '../types';
import { getBookings, saveBookings } from '../data';

/**
 * Sorts bookings in descending chronological order (newest check-ins and created dates first)
 */
export const sortBookingsDescending = (bookingsList: Booking[]): Booking[] => {
  const getTime = (b: any): number => {
    if (!b) return 0;
    const val = b.createdAt || b.dateCreated || b.checkInDate;
    if (!val) return 0;
    const t = new Date(val).getTime();
    return isNaN(t) ? 0 : t;
  };

  return [...bookingsList].sort((a, b) => getTime(b) - getTime(a));
};

/**
 * Reconciles remote Firestore bookings with local storage cache.
 * Any bookings created locally during offline periods or rule blocks (e.g. after Sept 16th)
 * are preserved and automatically synchronized back up to Firestore.
 */
export const syncAndReconcileBookings = async (
  remoteBookings: Booking[]
): Promise<Booking[]> => {
  try {
    const localBookings = getBookings();
    const remoteIdMap = new Map<string, Booking>();
    remoteBookings.forEach((b) => {
      if (b && b.id) remoteIdMap.set(b.id, b);
    });

    const missingInRemote: Booking[] = [];
    const mergedList: Booking[] = [...remoteBookings];

    // Identify bookings in local storage not yet registered in Firestore
    for (const localB of localBookings) {
      if (localB && localB.id && !remoteIdMap.has(localB.id)) {
        missingInRemote.push(localB);
        mergedList.push(localB);
      }
    }

    // Auto-sync missing bookings to Firestore in background
    if (missingInRemote.length > 0) {
      console.info(
        `[Sync] Discovered ${missingInRemote.length} unsynced local bookings. Backfilling to Firestore...`
      );
      // Run asynchronously without blocking caller
      Promise.all(
        missingInRemote.map(async (booking) => {
          try {
            await safeSetDoc(doc(db, 'bookings', booking.id), booking, { merge: true });
          } catch (syncErr) {
            console.warn(`[Sync] Backfill failed for booking ${booking.id}:`, syncErr);
          }
        })
      ).catch((err) => {
        console.warn('[Sync] Batch backfill warning:', err);
      });
    }

    const sortedMerged = sortBookingsDescending(mergedList);
    saveBookings(sortedMerged);
    return sortedMerged;
  } catch (error) {
    console.warn('[Sync] Reconciliation fallback to remote list:', error);
    const sortedRemote = sortBookingsDescending(remoteBookings);
    saveBookings(sortedRemote);
    return sortedRemote;
  }
};

/**
 * Directly queries Firestore for the latest booking documents with a timeout fallback.
 */
export const fetchFreshBookingsFromFirestore = async (): Promise<Booking[]> => {
  try {
    const fetchPromise = getDocs(collection(db, 'bookings'));
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('FIRESTORE_TIMEOUT')), 7000)
    );

    const snapshot = await Promise.race([fetchPromise, timeoutPromise]);
    const remoteData: Booking[] = [];
    snapshot.forEach((d) => {
      remoteData.push({ id: d.id, ...d.data() } as Booking);
    });

    return await syncAndReconcileBookings(remoteData);
  } catch (err) {
    console.warn('[Sync] Direct fetch failed or timed out. Serving local storage cache.', err);
    return sortBookingsDescending(getBookings());
  }
};
