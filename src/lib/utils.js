export function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}

export function formatDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day} ${['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][parseInt(m) - 1]} ${y}`;
}

export function isToday(d) {
  if (!d) return false;
  const today = new Date();
  const [y, m, day] = d.split('-');
  return parseInt(y) === today.getFullYear() && 
         parseInt(m) === today.getMonth() + 1 && 
         parseInt(day) === today.getDate();
}

export function getTodayDateString() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
