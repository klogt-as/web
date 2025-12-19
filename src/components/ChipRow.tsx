interface ChipRowProps {
  label: string;
  index: number;
}

export function ChipRow({ label, index }: ChipRowProps) {
  return (
    <div style={styles.chipRow}>
      <span style={styles.chip}>{label}</span>
      <span style={styles.chipIndex}>// {String(index).padStart(2, "0")}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  chipRow: {
    display: "flex",
    gap: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  chip: {
    fontSize: 12,
    textTransform: "uppercase",
    lineHeight: 1,
    letterSpacing: 2,
    padding: "8px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(0, 0, 0, 0.2)",
    color: "var(--secondary-color)",
  },
  chipIndex: {
    fontSize: 12,
    color: "var(--font-color-subtile)",
  },
};
