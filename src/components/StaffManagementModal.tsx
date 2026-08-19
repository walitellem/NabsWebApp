import { generateKey } from '../utils/keyGenerator';
import React, { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { StaffMember } from '../types';
import { getStaff, saveStaff, generateId } from '../data';
import { Plus, Trash2, X, Users, Briefcase, Building2, User } from 'lucide-react';
import { useToast } from './ToastContext';
import { motion, AnimatePresence } from 'motion/react';

interface StaffManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

export function StaffManagementModal({ isOpen, onClose, isDarkMode }: StaffManagementModalProps) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [branch, setBranch] = useState('Annex');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (!isOpen) return;
    setConfirmDeleteId(null);

    if (!isFirebaseConfigured) {
      setStaff(getStaff());
      return;
    }

    const q = query(collection(db, 'staff'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStaff(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StaffMember)));
    });
    return () => unsubscribe();
  }, [isOpen]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role) return;

    const newStaff: StaffMember = {
      id: `staff_${generateId()}`,
      name,
      role,
      branch,
      createdAt: new Date().toISOString()
    };

    if (!isFirebaseConfigured) {
      const currentStaff = getStaff();
      const updated = [newStaff, ...currentStaff];
      saveStaff(updated);
      setStaff(updated);
      setName('');
      setRole('');
      addToast('Staff Added', 'success', `${name} added to staff directory.`);
      return;
    }

    try {
      await addDoc(collection(db, 'staff'), { name, role, branch, createdAt: new Date().toISOString() });
      setName('');
      setRole('');
      addToast('Staff Added', 'success', `${name} added to staff directory.`);
    } catch (err) {
      addToast('Error', 'error', 'Failed to add staff.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!isFirebaseConfigured) {
      const currentStaff = getStaff();
      const updated = currentStaff.filter(s => s.id !== id);
      saveStaff(updated);
      setStaff(updated);
      addToast('Staff Removed', 'success', 'Staff member removed.');
      return;
    }

    try {
      await deleteDoc(doc(db, 'staff', id));
      addToast('Staff Removed', 'success', 'Staff member removed.');
    } catch (err) {
      addToast('Error', 'error', 'Failed to remove staff.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" key="ap-staff-management-modal">
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
            className={`relative w-full max-w-md p-6 rounded-[2rem] transition-all ${
              isDarkMode ? 'neu-raised-lg text-zinc-100' : 'bg-white border border-slate-200 shadow-2xl text-slate-800'
            }`}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isDarkMode ? 'neu-raised-sm text-purple-400' : 'bg-purple-500/10 text-purple-500'}`}>
                  <Users className="w-5 h-5" />
                </div>
                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Staff Management
                </h2>
              </div>
              <button 
                onClick={onClose}
                className={`p-2 rounded-full transition-colors ${
                  isDarkMode ? 'neu-button text-zinc-400 hover:text-zinc-200' : 'hover:bg-slate-100 text-slate-400'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-3 mb-8">
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className={`w-full pl-10 pr-4 py-2.5 text-sm transition-all focus:outline-none ${
                    isDarkMode ? 'neu-inset text-white focus:ring-1 focus:ring-purple-500' : 'bg-slate-50 border border-slate-200 rounded-xl'
                  }`}
                  required 
                />
              </div>
              <div className="relative">
                <Briefcase className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                <input 
                  type="text" 
                  placeholder="Role (e.g. Cleaner, Driver)" 
                  value={role} 
                  onChange={e => setRole(e.target.value)} 
                  className={`w-full pl-10 pr-4 py-2.5 text-sm transition-all focus:outline-none ${
                    isDarkMode ? 'neu-inset text-white focus:ring-1 focus:ring-purple-500' : 'bg-slate-50 border border-slate-200 rounded-xl'
                  }`}
                  required 
                />
              </div>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                <select 
                  value={branch} 
                  onChange={e => setBranch(e.target.value)} 
                  className={`w-full pl-10 pr-4 py-2.5 text-sm transition-all focus:outline-none appearance-none ${
                    isDarkMode ? 'neu-inset text-white focus:ring-1 focus:ring-purple-500' : 'bg-slate-50 border border-slate-200 rounded-xl'
                  }`}
                >
                  <option value="Annex" className={isDarkMode ? 'bg-[#0d1527] text-white' : ''}>Annex Branch</option>
                  <option value="Ayigya" className={isDarkMode ? 'bg-[#0d1527] text-white' : ''}>Ayigya Branch</option>
                </select>
              </div>
              <button 
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-lg shadow-purple-500/20 active:scale-[0.98] neu-glow-purple"
              >
                <Plus className="w-4 h-4" /> Add Staff Member
              </button>
            </form>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-3 custom-inset-scrollbar">
              <AnimatePresence mode="popLayout">
                {staff.map((s, idx) => (
                  <motion.div 
                    layout
                    key={generateKey(s.id || s.name, idx, 'staff-item')}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`flex justify-between items-center p-3 rounded-2xl transition-all ${
                      isDarkMode ? 'neu-raised-sm' : 'bg-slate-50/50 border border-slate-100 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        isDarkMode ? 'neu-inset text-purple-400 font-black' : 'bg-white text-slate-600 border border-slate-100'
                      }`}>
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{s.name}</p>
                        <p className={`text-[10px] uppercase font-bold tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                          {s.role} • {s.branch}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <AnimatePresence mode="wait">
                        {confirmDeleteId === s.id ? (
                          <motion.button
                            key="confirm"
                            initial={{ opacity: 0, scale: 0.9, width: 0 }}
                            animate={{ opacity: 1, scale: 1, width: 'auto' }}
                            exit={{ opacity: 0, scale: 0.9, width: 0 }}
                            onClick={() => handleDelete(s.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-red-500/20 active:scale-95"
                          >
                            Confirm?
                          </motion.button>
                        ) : null}
                      </AnimatePresence>
                      
                      <button 
                        onClick={() => {
                          if (confirmDeleteId === s.id) {
                            setConfirmDeleteId(null);
                          } else {
                            setConfirmDeleteId(s.id);
                            // Auto-cancel after 3 seconds
                            setTimeout(() => {
                              setConfirmDeleteId(current => current === s.id ? null : current);
                            }, 3000);
                          }
                        }} 
                        className={`p-2.5 rounded-xl transition-all active:scale-90 ${
                          confirmDeleteId === s.id
                            ? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300'
                            : (isDarkMode ? 'hover:bg-red-500/10 bg-red-500/5 text-red-500' : 'hover:bg-red-50 bg-red-50/50 text-red-500')
                        }`}
                        title={confirmDeleteId === s.id ? "Cancel Deletion" : "Delete Staff Member"}
                      >
                        {confirmDeleteId === s.id ? <X className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {staff.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm opacity-50 italic">No staff members listed yet.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

