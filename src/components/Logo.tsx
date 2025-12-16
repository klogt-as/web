import LogoSvg from "../assets/logo_klogt.svg";
import { useIsMobile } from "../hooks/useIsMobile";

export default function Logo() {
  const isMobile = useIsMobile();

  return (
    <div style={styles.logo(isMobile)}>
      <img style={styles.img} src={LogoSvg.src} alt="Logo klogt AS" />
    </div>
  );
}

const styles: Record<string, React.CSSProperties | any> = {
  logo: (isMobile: boolean) => ({
    position: "absolute" as const,
    inset: "0px",
    maxWidth: "720px",
    width: "100%",
    height: "80px",
    marginTop: isMobile ? "2rem" : "20vh",
    marginRight: "auto",
    marginLeft: "auto",
    filter: "brightness(0.25)",
  }),
  img: {
    height: "50px",
  },
};
