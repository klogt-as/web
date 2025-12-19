import LogoSvg from "../assets/logo_klogt.svg";
import { useIsMobile } from "../hooks/useIsMobile";

export default function Logo() {
  const isMobile = useIsMobile();

  return (
    <nav style={styles.logo(isMobile)}>
      <a href="/">
        <img
          className="logo"
          style={styles.img}
          src={LogoSvg.src}
          alt="Logo klogt AS"
        />
      </a>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties | any> = {
  logo: (isMobile: boolean) => ({
    zIndex: 99,
    position: "absolute" as const,
    inset: "0px",
    width: "100%",
    height: "80px",
    marginTop: isMobile ? "2rem" : "8vh",
    marginRight: "auto",
    marginLeft: "auto",
  }),
  img: {
    height: "50px",
  },
};
