function hashString(value) {
  const input = String(value || "football-player");
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function getInitials(name) {
  const parts = String(name || "Player")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "FP";
  return parts.map((part) => part[0]?.toUpperCase() || "").join("") || "FP";
}

function buildPlayerFallbackSvg({ name, team }) {
  const palettes = [
    ["#ef4444", "#f59e0b"],
    ["#2563eb", "#06b6d4"],
    ["#16a34a", "#84cc16"],
    ["#db2777", "#8b5cf6"],
    ["#ea580c", "#eab308"],
  ];

  const palette = palettes[hashString(`${name}-${team}`) % palettes.length];
  const initials = getInitials(name);
  const safeName = String(name || "Football Player").slice(0, 22);
  const safeTeam = String(team || "Professional Football").slice(0, 24);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="760" viewBox="0 0 640 760" fill="none">
      <defs>
        <linearGradient id="bg" x1="64" y1="40" x2="590" y2="720" gradientUnits="userSpaceOnUse">
          <stop stop-color="${palette[0]}"/>
          <stop offset="1" stop-color="${palette[1]}"/>
        </linearGradient>
      </defs>
      <rect width="640" height="760" rx="42" fill="url(#bg)"/>
      <circle cx="514" cy="122" r="108" fill="white" fill-opacity="0.12"/>
      <circle cx="118" cy="662" r="132" fill="white" fill-opacity="0.09"/>
      <path d="M320 188c82 0 148 66 148 148v150c0 20-16 36-36 36H208c-20 0-36-16-36-36V336c0-82 66-148 148-148Z" fill="white" fill-opacity="0.16"/>
      <circle cx="320" cy="248" r="76" fill="white" fill-opacity="0.18"/>
      <rect x="74" y="64" width="164" height="164" rx="82" fill="white" fill-opacity="0.18"/>
      <text x="156" y="164" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="700" fill="white">${initials}</text>
      <text x="74" y="592" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="700" fill="white">${safeName}</text>
      <text x="74" y="636" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="500" fill="rgba(255,255,255,0.92)">${safeTeam}</text>
      <text x="74" y="694" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="600" fill="rgba(255,255,255,0.86)">Professional Football Visual</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function getPlayerVisual(player, fallback = {}) {
  const candidate = player || fallback;
  const sources = [
    candidate?.strRender,
    candidate?.strCutout,
    candidate?.strThumb,
    candidate?.image,
    candidate?.photo,
  ];

  const professionalImage = sources.find(
    (value) => typeof value === "string" && value.trim() && !value.includes("via.placeholder")
  );

  if (professionalImage) {
    return professionalImage;
  }

  return buildPlayerFallbackSvg({
    name: candidate?.strPlayer || candidate?.name || fallback?.name || "Football Player",
    team: candidate?.strTeam || candidate?.team || fallback?.team || "Professional Football",
  });
}