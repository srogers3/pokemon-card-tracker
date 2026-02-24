import { type Cluster, type Renderer } from "@googlemaps/markerclusterer";

// Marker SVGs as data URIs — simple flat ball designs
const MARKER_BALL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="48" fill="#fff" stroke="#333" stroke-width="4"/>
  <path d="M2,50 H98" stroke="#333" stroke-width="4"/>
  <path d="M2,50 A48,48 0 0,0 98,50" fill="#ff1a1a"/>
  <circle cx="50" cy="50" r="12" fill="#fff" stroke="#333" stroke-width="4"/>
  <circle cx="50" cy="50" r="6" fill="#fff" stroke="#333" stroke-width="2"/>
</svg>`;

const GREAT_BALL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="48" fill="#fff" stroke="#333" stroke-width="4"/>
  <path d="M2,50 H98" stroke="#333" stroke-width="4"/>
  <path d="M2,50 A48,48 0 0,0 98,50" fill="#3b82f6"/>
  <path d="M8,42 H92" stroke="#ff1a1a" stroke-width="6"/>
  <circle cx="50" cy="50" r="12" fill="#fff" stroke="#333" stroke-width="4"/>
  <circle cx="50" cy="50" r="6" fill="#fff" stroke="#333" stroke-width="2"/>
</svg>`;

const ULTRA_BALL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="48" fill="#fff" stroke="#333" stroke-width="4"/>
  <path d="M2,50 H98" stroke="#333" stroke-width="4"/>
  <path d="M2,50 A48,48 0 0,0 98,50" fill="#1a1a1a"/>
  <path d="M6,44 H94" stroke="#f59e0b" stroke-width="5"/>
  <path d="M10,36 H90" stroke="#f59e0b" stroke-width="3"/>
  <circle cx="50" cy="50" r="12" fill="#fff" stroke="#333" stroke-width="4"/>
  <circle cx="50" cy="50" r="6" fill="#f59e0b" stroke="#333" stroke-width="2"/>
</svg>`;

function getBallSvg(count: number): string {
  if (count >= 6) return ULTRA_BALL_SVG;
  if (count >= 3) return GREAT_BALL_SVG;
  return MARKER_BALL_SVG;
}

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export const clusterRenderer: Renderer = {
  render({ count, position }: Cluster, _stats: unknown, map: google.maps.Map) {
    const ballSvg = getBallSvg(count);
    const size = 56;
    const iconSize = 28;

    // Create a container div for the cluster marker
    const container = document.createElement("div");
    container.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 3px solid #2DD4BF;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      cursor: pointer;
      animation: float 3s ease-in-out infinite;
    `;

    // Ball icon
    const icon = document.createElement("img");
    icon.src = svgToDataUri(ballSvg);
    icon.style.cssText = `
      width: ${iconSize}px;
      height: ${iconSize}px;
    `;
    container.appendChild(icon);

    // Count badge
    const badge = document.createElement("div");
    badge.textContent = String(count);
    badge.style.cssText = `
      position: absolute;
      bottom: -2px;
      right: -2px;
      min-width: 20px;
      height: 20px;
      border-radius: 10px;
      background-color: #2DD4BF;
      color: white;
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    `;
    container.appendChild(badge);

    const marker = new google.maps.marker.AdvancedMarkerElement({
      position,
      content: container,
      zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
      map,
    });

    return marker;
  },
};
