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

function getVisualSource(candidate, orderedKeys = ["strRender", "strCutout", "strThumb", "image", "photo"]) {
  for (const key of orderedKeys) {
    const value = candidate?.[key];
    if (typeof value === "string" && value.trim() && !value.includes("via.placeholder")) {
      return { src: value, variant: key };
    }
  }

  return null;
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

function buildSpotlightFallbackSvg({ name, team }) {
  const safeName = String(name || "Football Player").slice(0, 24);
  const safeTeam = String(team || "Professional Football").slice(0, 24);
  const initials = getInitials(name);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="720" height="860" viewBox="0 0 720 860" fill="none">
      <ellipse cx="360" cy="802" rx="188" ry="30" fill="rgba(255,255,255,0.12)"/>
      <circle cx="612" cy="122" r="54" fill="rgba(255,255,255,0.9)"/>
      <g opacity="0.92">
        <path d="M360 140c63 0 114 52 114 116v64c0 19-15 34-34 34H280c-19 0-34-15-34-34v-64c0-64 51-116 114-116Z" fill="#767676"/>
        <path d="M404 321c84 16 152 93 168 190l22 222H450l-24-132-132 1-20 131H130l21-217c15-99 81-179 167-195" fill="#666666"/>
        <path d="M360 154c-55 0-98 44-98 99 0 35 19 67 50 84l22 12c16 9 35 9 51 0l22-12c31-17 50-49 50-84 0-55-43-99-97-99Z" fill="#2f2f2f"/>
        <path d="M317 188c22-24 69-30 113-12 18 8 27 21 27 39 0 19-8 47-8 69" stroke="#1f1f1f" stroke-width="7" stroke-linecap="round"/>
        <path d="M267 279c-9 26-2 65 22 87 18 17 43 29 71 29 28 0 54-12 72-31 22-23 30-59 20-85" stroke="#3a3a3a" stroke-width="6" stroke-linecap="round"/>
        <path d="M319 396c24 18 58 29 96 29 40 0 77-12 101-33" stroke="#575757" stroke-width="6" stroke-linecap="round"/>
        <path d="M222 474c18 44 39 136 47 236" stroke="#4b4b4b" stroke-width="6" stroke-linecap="round"/>
        <path d="M500 472c-18 45-36 133-42 230" stroke="#4b4b4b" stroke-width="6" stroke-linecap="round"/>
      </g>
      <rect x="56" y="58" width="122" height="122" rx="61" fill="rgba(255,255,255,0.14)"/>
      <text x="117" y="134" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="50" font-weight="700" fill="#ffffff">${initials}</text>
      <text x="56" y="782" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" fill="#ffffff">${safeName}</text>
      <text x="56" y="818" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="600" fill="rgba(255,255,255,0.72)">${safeTeam}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function getPlayerVisual(player, fallback = {}) {
  const candidate = player || fallback;
  const professionalImage = getVisualSource(candidate);

  if (professionalImage) {
    return professionalImage.src;
  }

  return buildPlayerFallbackSvg({
    name: candidate?.strPlayer || candidate?.name || fallback?.name || "Football Player",
    team: candidate?.strTeam || candidate?.team || fallback?.team || "Professional Football",
  });
}

export function getPlayerProfileVisual(player, fallback = {}) {
  const candidate = player || fallback;
  const profileImage = getVisualSource(candidate, ["strThumb", "photo", "image", "strCutout", "strRender"]);

  if (profileImage) {
    return profileImage.src;
  }

  return buildPlayerFallbackSvg({
    name: candidate?.strPlayer || candidate?.name || fallback?.name || "Football Player",
    team: candidate?.strTeam || candidate?.team || fallback?.team || "Professional Football",
  });
}

export function getSpotlightPlayerVisual(player, fallback = {}) {
  const candidate = player || fallback;
  const professionalImage = getVisualSource(candidate);

  if (professionalImage) {
    return {
      src: professionalImage.src,
      variant: professionalImage.variant,
    };
  }

  return {
    src: buildSpotlightFallbackSvg({
      name: candidate?.strPlayer || candidate?.name || fallback?.name || "Football Player",
      team: candidate?.strTeam || candidate?.team || fallback?.team || "Professional Football",
    }),
    variant: "fallback",
  };
}