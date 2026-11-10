type Props = { width?: number; height?: number; className?: string };

// Solo el símbolo del logo (corchetes y ocelote), como en el encabezado de los mockups.
// Reutiliza los trazos originales de public/logo.svg por referencia: no se copia ni se
// modifica su forma ni sus colores, solo se encuadra la parte del símbolo.
const LogoMark = ({ width = 54, height = 35, className }: Props) => (
  <svg width={width} height={height} viewBox="326 300 600 390" role="img" aria-label="DevLingo" className={className}>
    <use href="/logo.svg#bracket-left" />
    <use href="/logo.svg#bracket-right" />
    <use href="/logo.svg#ocelot" />
  </svg>
);

export default LogoMark;
