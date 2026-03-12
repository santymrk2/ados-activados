export function Avatar({ p, size = 36 }) {
  const initials = `${p.nombre?.[0] || ''}${p.apellido?.[0] || ''}`.toUpperCase();
  const isM = p.sexo === 'M';
  const sexColor = isM ? '#0891B2' : '#EC4899';
  
  return (
    <div
      className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
      style={{
        width: size,
        height: size,
        backgroundColor: '#E5E5E5',
        border: `2px solid ${sexColor}`,
      }}
    >
      {p.foto ? (
        <img src={p.foto} className="w-full h-full object-cover" alt="" />
      ) : (
        <span style={{ fontSize: size * 0.36, fontWeight: 900, color: '#666666' }}>
          {initials || '?'}
        </span>
      )}
    </div>
  );
}
