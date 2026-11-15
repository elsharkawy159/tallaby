import { code128Bars } from "@/lib/barcode/code128.lib";

/**
 * The order number as a Code 128 barcode (ROADMAP.md F-04e), drawn as inline
 * SVG on the server: plain black <rect>s, crisp edges, white quiet zones. The
 * dashboard's Orders › Scan returns page reads it with the phone camera.
 */
export function OrderBarcode({
  orderNumber,
  height = 40,
  module = 1.5,
  className,
}: {
  orderNumber: string;
  /** Bar height in CSS px. */
  height?: number;
  /** Width of the narrowest bar in CSS px (≥ 1.5 prints reliably on 203 dpi label printers). */
  module?: number;
  className?: string;
}) {
  const code = code128Bars(orderNumber);
  if (!code) return null;
  return (
    <svg
      role="img"
      aria-label={orderNumber}
      className={className}
      width={code.width * module}
      height={height}
      viewBox={`0 0 ${code.width} ${height}`}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      style={{ background: "#fff" }}
    >
      {code.bars.map((bar) => (
        <rect key={bar.x} x={bar.x} y={0} width={bar.w} height={height} fill="#000" />
      ))}
    </svg>
  );
}
