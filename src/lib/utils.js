export function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}

export function formatDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day} ${['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][parseInt(m) - 1]} ${y}`;
}
