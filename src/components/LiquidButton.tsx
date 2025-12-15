import React from "react";

type Size = "sm" | "md" | "lg";

type Props = {
  label: string;
  size?: Size;
};

export default function LiquidButton({ label, size = "md" }: Props) {
  return (
    <button type="button" style={styles.button(size)}>
      {label}
      <span style={{ fontSize: 16, marginLeft: 8 }}>→</span>
    </button>
  );
}

const styles = {
  button: (size: Size) => ({
    marginTop: 8,
    padding: "12px 24px",
    borderRadius: 999,
    border: "1px solid rgba(255, 255, 255, 0.18)",
    background:
      "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    color: "#fdfeec",
    fontWeight: 400,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    boxShadow:
      "0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
    transition:
      "background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
    fontSize: 14,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  }),
};
