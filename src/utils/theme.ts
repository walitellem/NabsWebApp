export const getThemeClasses = (isDarkMode: boolean) => ({
  bg: 'bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-200 min-h-screen w-full',
  sidebar: 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800',
  card: 'bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 shadow-sm',
  cardHeader: 'border-zinc-200 dark:border-zinc-800',
  text: 'text-zinc-900 dark:text-zinc-50 font-bold',
  textMuted: 'text-zinc-500 dark:text-zinc-400 text-sm',
  textMutedLight: 'text-zinc-450 dark:text-zinc-500',
  border: 'border-zinc-200/60 dark:border-zinc-800',
  borderLight: 'border-zinc-100 dark:border-zinc-800/60',
  tableHeader: 'bg-zinc-100/50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300',
  tableContainer: 'bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800',
  tableRowHover: 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
  input: 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 focus:border-blue-600 focus:ring-blue-600/15 shadow-sm',
  buttonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20',
  buttonSecondary: 'bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-sm',
  buttonDanger: 'bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20',
  buttonDangerOutline: 'bg-white dark:bg-zinc-900 hover:bg-red-50 dark:hover:bg-red-950/20 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-450 shadow-sm',
  badgeSuccess: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
  badgeWarning: 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-100 dark:border-yellow-500/20 text-yellow-700 dark:text-yellow-400',
  badgeError: 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-700 dark:text-red-400',
  badgeNeutral: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
  infoBanner: 'bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400',
  modalBackdrop: 'fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm',
});

export const getRoomStatusClasses = (status: string, isDarkMode: boolean) => {
  switch(status) {
    case 'Available':
    case 'vacant':
      return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
    case 'Occupied':
      return 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';
    case 'occupied_hold':
      return 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20';
    case 'Cleaning':
      return 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20';
    case 'Maintenance':
      return 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20';
    default:
      return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700';
  }
};

