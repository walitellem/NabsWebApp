
import React, { useState } from 'react';
import { Booking, User, PaymentStatus, PaymentRectificationRequest } from '../types';
import { motion } from 'motion/react';
import { X, DollarSign, RefreshCw, AlertTriangle } from 'lucide-react';
import { useToast } from './ToastContext';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { generateId, addAuditLog } from '../data';

interface PaymentRectificationModalProps {
  booking: Booking;
  isDarkMode: boolean;
  currentUser: User;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentRectificationModal: React.FC<PaymentRectificationModalProps> = ({
  booking,
  isDarkMode,
  currentUser,
  onClose,
  onSuccess,
}) => {
  const { addToast } = useToast();
  const [proposedPaymentStatus, setProposedPaymentStatus] = useState<PaymentStatus>(booking.paymentStatus);
  const [proposedAmountPaid, setProposedAmountPaid] = useState<string>(booking.amountPaid?.toString() || '0');
  const [proposedPaymentMethod, setProposedPaymentMethod] = useState<string>(booking.paymentMethod || 'Cash');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const requestId = `pay_rect_${generateId()}`;
      const request: PaymentRectificationRequest = {
        id: requestId,
        bookingId: booking.id,
        branch: booking.branch,
        receptionistId: currentUser.id,
        receptionistName: currentUser.name,
        createdAt: new Date().toISOString(),
        status: 'Pending',
        currentPaymentStatus: booking.paymentStatus,
        currentAmountPaid: booking.amountPaid || 0,
        currentPaymentMethod: booking.paymentMethod || 'Cash',
        proposedPaymentStatus,
        proposedAmountPaid: parseFloat(proposedAmountPaid),
        proposedPaymentMethod,
        reason: reason.trim()
      };

      if (db) {
        await setDoc(doc(db, 'pendingPaymentRectifications', requestId), request);
      }
      
      addAuditLog(
        currentUser.id,
        currentUser.name,
        'Receptionist',
        booking.branch,
        `Submitted Payment Rectification #${requestId.slice(-5)}`,
        `Booking: #${booking.id.slice(-5)}. Status: ${proposedPaymentStatus}`
      );

      addToast("Rectification Submitted", "success", "Rectification request sent to Manager for approval.", 4000);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      addToast("Submission Error", "error", "Failed to submit rectification.", 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className={`border rounded-3xl p-6 w-full max-w-lg ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
        <div className="flex justify-between items-center pb-4">
          <h3 className="font-bold">Rectify Payment</h3>
          <button onClick={onClose}><X className="w-5 h-5"/></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs mb-1">Proposed Status</label>
            <select value={proposedPaymentStatus} onChange={(e) => setProposedPaymentStatus(e.target.value as PaymentStatus)} className="w-full p-2 rounded-xl border">
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Partial">Partial</option>
              <option value="Partially Paid (50% Deposit)">Partially Paid (50% Deposit)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1">Proposed Amount Paid</label>
            <input type="number" value={proposedAmountPaid} onChange={(e) => setProposedAmountPaid(e.target.value)} className="w-full p-2 rounded-xl border"/>
          </div>
          <div>
            <label className="block text-xs mb-1">Reason for Rectification</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} required className="w-full p-2 rounded-xl border" />
          </div>
          <button type="submit" className="w-full p-3 rounded-xl bg-blue-600 text-white font-bold" disabled={isSubmitting}>Submit for Approval</button>
        </form>
      </motion.div>
    </div>
  );
};
