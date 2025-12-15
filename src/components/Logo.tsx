import LogoSvg from "../assets/logo_klogt.svg";

export default function Logo() {
  return (
    <div style={styles.logo}>
      <img style={styles.img} src={LogoSvg.src} alt="Logo klogt AS" />
    </div>
  );
}

const styles: Record<string, React.CSSProperties | any> = {
  logo: {
    position: "absolute" as const,
    inset: "0px",
    maxWidth: "720px",
    width: "100%",
    height: "80px",
    marginTop: "10rem",
    marginRight: "auto",
    marginLeft: "auto",
    filter: "brightness(0.25)",
  },
  img: {
    height: "50px",
  },
};
