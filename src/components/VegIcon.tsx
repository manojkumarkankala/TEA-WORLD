export function VegIcon({ isVeg, size = 16 }: { isVeg: boolean; size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-sm border-2"
      style={{
        width: size,
        height: size,
        borderColor: isVeg ? '#2d7a2d' : '#a33',
      }}
      title={isVeg ? 'Vegetarian' : 'Non-veg'}
    >
      <span
        className="rounded-full"
        style={{
          width: size * 0.5,
          height: size * 0.5,
          backgroundColor: isVeg ? '#2d7a2d' : '#a33',
        }}
      />
    </span>
  );
}
