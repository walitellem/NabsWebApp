import { db, safeAddDoc, safeFirestoreOp, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

let isCheckingSnapshot = false;

export const createMonthlySnapshot = async (month: string, year: number, data: any) => {
  const snapshotRef = collection(db, 'monthlySnapshots');
  const docId = await safeAddDoc(snapshotRef, {
    month,
    year,
    data,
    createdAt: new Date().toISOString(),
  });
  return { id: docId };
};

export const createSnapshotNotification = async (snapshotId: string, message: string) => {
  const notificationRef = collection(db, 'monthlySnapshotNotifications');
  await safeAddDoc(notificationRef, {
    snapshotId,
    message,
    status: 'unread',
    createdAt: new Date().toISOString(),
  });
};

export const checkAndCreateSnapshot = async (currentData: any) => {
  if (isCheckingSnapshot) return;
  isCheckingSnapshot = true;

  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthName = lastMonth.toLocaleString('default', { month: 'long' });
    const year = lastMonth.getFullYear();

    // Check if snapshot already exists safely
    const snapshotQuery = query(
      collection(db, 'monthlySnapshots'),
      where('month', '==', monthName),
      where('year', '==', year)
    );
    
    const snapshotDocs = await safeFirestoreOp(
      () => getDocs(snapshotQuery),
      { empty: true, docs: [] } as any
    );

    if (snapshotDocs && snapshotDocs.empty) {
      // Create snapshot
      const snapshotRef = await createMonthlySnapshot(monthName, year, currentData);
      
      if (snapshotRef && snapshotRef.id) {
        // Create notification
        await createSnapshotNotification(
          snapshotRef.id, 
          `The breakdown for ${monthName} ${year} is ready.`
        );
      }
    }
  } catch (err: any) {
    console.error('Error checking or creating monthly snapshot:', err);
    handleFirestoreError(err, OperationType.WRITE, 'monthlySnapshots');
  } finally {
    isCheckingSnapshot = false;
  }
};

