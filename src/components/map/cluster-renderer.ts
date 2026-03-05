import { type Cluster, type Renderer } from "@googlemaps/markerclusterer";

// Marker SVGs as data URIs — cardboard box designs
const SMALL_BOX_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="15" y="38" width="70" height="48" rx="3" fill="#C4956A" stroke="#8B6914" stroke-width="3"/>
  <rect x="15" y="38" width="70" height="12" rx="2" fill="#D4A574" stroke="#8B6914" stroke-width="3"/>
  <line x1="50" y1="38" x2="50" y2="86" stroke="#8B6914" stroke-width="2" stroke-dasharray="4,3"/>
  <path d="M15,38 L25,18 H75 L85,38" fill="#D4A574" stroke="#8B6914" stroke-width="3"/>
  <path d="M50,38 L45,18" stroke="#8B6914" stroke-width="2"/>
  <path d="M50,38 L55,18" stroke="#8B6914" stroke-width="2"/>
</svg>`;

const MEDIUM_BOX_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="15" y="38" width="70" height="48" rx="3" fill="#C4956A" stroke="#8B6914" stroke-width="3"/>
  <rect x="15" y="38" width="70" height="12" rx="2" fill="#D4A574" stroke="#8B6914" stroke-width="3"/>
  <line x1="50" y1="38" x2="50" y2="86" stroke="#8B6914" stroke-width="2" stroke-dasharray="4,3"/>
  <path d="M15,38 L25,18 H75 L85,38" fill="#D4A574" stroke="#8B6914" stroke-width="3"/>
  <path d="M50,38 L45,18" stroke="#8B6914" stroke-width="2"/>
  <path d="M50,38 L55,18" stroke="#8B6914" stroke-width="2"/>
  <text x="50" y="72" text-anchor="middle" font-size="18" font-weight="bold" fill="#8B6914">✦</text>
</svg>`;

const LARGE_BOX_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="15" y="38" width="70" height="48" rx="3" fill="#C4956A" stroke="#8B6914" stroke-width="3"/>
  <rect x="15" y="38" width="70" height="12" rx="2" fill="#D4A574" stroke="#8B6914" stroke-width="3"/>
  <line x1="50" y1="38" x2="50" y2="86" stroke="#8B6914" stroke-width="2" stroke-dasharray="4,3"/>
  <path d="M15,38 L25,18 H75 L85,38" fill="#D4A574" stroke="#8B6914" stroke-width="3"/>
  <path d="M50,38 L45,18" stroke="#8B6914" stroke-width="2"/>
  <path d="M50,38 L55,18" stroke="#8B6914" stroke-width="2"/>
  <text x="50" y="72" text-anchor="middle" font-size="18" font-weight="bold" fill="#F59E0B">★</text>
</svg>`;

function getBoxSvg(count: number): string {
  if (count >= 6) return LARGE_BOX_SVG;
  if (count >= 3) return MEDIUM_BOX_SVG;
  return SMALL_BOX_SVG;
}

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export const clusterRenderer: Renderer = {
  render({ count, position }: Cluster, _stats: unknown, map: google.maps.Map) {
    const ballSvg = getBoxSvg(count);
    const size = 56;
    const iconSize = 28;

    // Create a container div for the cluster marker
    const container = document.createElement("div");
    container.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.9);
      border: 3px solid #2DD4BF;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      cursor: pointer;
      animation: marker-fade-in 0.4s ease-out both;
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
