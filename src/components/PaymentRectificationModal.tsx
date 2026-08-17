
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={`relative border rounded-[2rem] p-6 w-full max-w-lg shadow-2xl ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
      >
        <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="font-bold">Rectify Payment</h3>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-400'
            }`}
          >
            <X className="w-5 h-5"/>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-[10px] font-mono uppercase tracking-wider font-bold mb-1.5 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Proposed Status</label>
            <select 
              value={proposedPaymentStatus} 
              onChange={(e) => setProposedPaymentStatus(e.target.value as PaymentStatus)} 
              className={`w-full p-3 rounded-xl border-2 focus:outline-none transition-all ${
                isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-50 border-slate-100'
              }`}
            >
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Partial">Partial</option>
              <option value="Partially Paid (50% Deposit)">Partially Paid (50% Deposit)</option>
            </select>
          </div>
          <div>
            <label className={`block text-[10px] font-mono uppercase tracking-wider font-bold mb-1.5 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Proposed Amount Paid</label>
            <input 
              type="number" 
              value={proposedAmountPaid} 
              onChange={(e) => setProposedAmountPaid(e.target.value)} 
              className={`w-full p-3 rounded-xl border-2 focus:outline-none transition-all ${
                isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-50 border-slate-100'
              }`}
            />
          </div>
          <div>
            <label className={`block text-[10px] font-mono uppercase tracking-wider font-bold mb-1.5 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Reason for Rectification</label>
            <textarea 
              value={reason} 
              onChange={(e) => setReason(e.target.value)} 
              required 
              rows={3}
              placeholder="Why are you rectifying this payment?"
              className={`w-full p-3 rounded-xl border-2 focus:outline-none transition-all ${
                isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-50 border-slate-100'
              }`} 
            />
          </div>
          <button 
            type="submit" 
            className="w-full p-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
