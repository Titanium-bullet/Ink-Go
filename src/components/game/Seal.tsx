export function Seal({
  text,
  size = 56,
  className = "",
}: {
  text: string;
  size?: number;
  className?: string;
}) {
  const chars = [...text];
  const fontSize = chars.length <= 2 ? size * 0.42 : size * 0.3;
  return (
    <span
      className={`seal ${className}`}
      style={{ width: size, height: size, fontSize, lineHeight: 1.05 }}
      aria-hidden="true"
    >
      {chars.length <= 2 ? (
        chars.join("")
      ) : (
        <span style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, padding: size * 0.12 }}>
          {chars.map((c, i) => (
            <span key={i} style={{ textAlign: "center" }}>{c}</span>
          ))}
        </span>
      )}
    </span>
  );
}
