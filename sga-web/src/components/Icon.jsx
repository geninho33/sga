const ICONS = {
  grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/>',
  database:
    '<ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 5.5v5c0 1.7 3.6 3 8 3s8-1.3 8-3v-5"/><path d="M4 10.5v5c0 1.7 3.6 3 8 3s8-1.3 8-3v-5"/>',
  utensils:
    '<path d="M6 3v8a2 2 0 0 0 4 0V3"/><path d="M8 11v10"/><path d="M16 3v5a4 4 0 0 1-4 4v13"/>',
  boxes:
    '<path d="M3 8.5 12 4l9 4.5v8L12 21l-9-4.5Z"/><path d="M12 12.5V21"/><path d="M21 8.5 12 13 3 8.5"/>',
  truck:
    '<path d="M3 7h11v8H3Z"/><path d="M14 10h4l3 3v2h-7Z"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/>',
  users:
    '<circle cx="9" cy="8" r="3.2"/><path d="M3 20v-1a5 5 0 0 1 10 0v1"/><path d="M16 5.2a3.2 3.2 0 0 1 0 5.6"/><path d="M15 13.2a5 5 0 0 1 6 4.8v1"/>',
  heart:
    '<path d="M12 20S3.5 14 3.5 8.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 8.5 2.5C20.5 14 12 20 12 20Z"/>',
  shield:
    '<path d="M12 3 4 6v5c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-3Z"/>',
  sliders:
    '<line x1="6" y1="3" x2="6" y2="21"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="18" y1="3" x2="18" y2="21"/><rect x="3.5" y="7" width="5" height="3.4" rx="1.2" fill="currentColor" stroke="none"/><rect x="9.5" y="13" width="5" height="3.4" rx="1.2" fill="currentColor" stroke="none"/><rect x="15.5" y="5" width="5" height="3.4" rx="1.2" fill="currentColor" stroke="none"/>',
  key: '<circle cx="8" cy="15" r="5"/><line x1="11.5" y1="11.5" x2="21" y2="2"/><line x1="17.5" y1="5.5" x2="20.5" y2="8.5"/>',
  carrot:
    '<path d="M12 21c4-6 5-10 5-14a5 5 0 0 0-10 0c0 4 1 8 5 14Z"/><path d="M12 7V3"/><path d="M10 5l2-2 2 2"/>',
  graduation:
    '<path d="M12 4 2 9l10 5 10-5-10-5Z"/><path d="M6 11.5V16c0 1.6 3 3 6 3s6-1.4 6-3v-4.5"/>',
  list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.6" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="3.6" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="3.6" cy="18" r="1.3" fill="currentColor" stroke="none"/>',
  table:
    '<rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="9.5" x2="21" y2="9.5"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9.5" y1="9.5" x2="9.5" y2="20"/>',
  search:
    '<circle cx="11" cy="11" r="7"/><line x1="16" y1="16" x2="21" y2="21"/>',
  bars: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
  "bars-staggered":
    '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/>',
  "map-pin":
    '<path d="M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  "chevron-down": '<polyline points="6,9 12,15 18,9"/>',
  "chevron-right": '<polyline points="9,6 15,12 9,18"/>',
  "chevron-left": '<polyline points="15,6 9,12 15,18"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5Z"/>',
  sun:
    '<circle cx="12" cy="12" r="4.2"/><line x1="12" y1="2.5" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="21.5"/><line x1="2.5" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="21.5" y2="12"/>',
  bell: '<path d="M6 9.5a6 6 0 0 1 12 0c0 4.5 2 5.5 2 5.5H4s2-1 2-5.5Z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
  download: '<path d="M12 3v12"/><polyline points="7,11 12,16 17,11"/><path d="M4.5 20h15"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  "trend-up":
    '<polyline points="3,17 10,10 14,14 21,7"/><polyline points="15,7 21,7 21,13"/>',
  "arrow-right":
    '<line x1="4" y1="12" x2="19.5" y2="12"/><polyline points="13.5,6 19.5,12 13.5,18"/>',
  "arrow-left":
    '<line x1="19" y1="12" x2="4.5" y2="12"/><polyline points="10.5,6 4.5,12 10.5,18"/>',
  "circle-check":
    '<circle cx="12" cy="12" r="9"/><polyline points="8,12 11,15 16,9"/>',
  check: '<polyline points="5,12 10,17 19,7"/>',
  ban: '<circle cx="12" cy="12" r="9"/><line x1="5" y1="5" x2="19" y2="19"/>',
  x: '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
  sort:
    '<polyline points="8,9.5 12,5.5 16,9.5"/><polyline points="8,14.5 12,18.5 16,14.5"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16Z"/><line x1="14.5" y1="5.5" x2="18.5" y2="9.5"/>',
  dot: '<circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none"/>',
  folder:
    '<path d="M3 7.5a2 2 0 0 1 2-2h3.8l2 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
  landmark:
    '<line x1="3" y1="21" x2="21" y2="21"/><polyline points="12,3 3,8 21,8 12,3"/><line x1="6" y1="11" x2="6" y2="18"/><line x1="10" y1="11" x2="10" y2="18"/><line x1="14" y1="11" x2="14" y2="18"/><line x1="18" y1="11" x2="18" y2="18"/>',
  "file-text":
    '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><polyline points="14,3 14,8 19,8"/><line x1="8.5" y1="13" x2="15.5" y2="13"/>',
  "pie-chart":
    '<path d="M21 12a9 9 0 1 1-9-9v9Z"/><path d="M12 3a9 9 0 0 1 9 9h-9Z"/>',
  spoon:
    '<path d="M12 2c-1.5 0-3 1.2-3 3.5 0 2.2-2.5 3.8-2.5 6.5a5.5 5.5 0 0 0 11 0c0-2.7-2.5-4.3-2.5-6.5C15 3.2 13.5 2 12 2Z"/><line x1="12" y1="14" x2="12" y2="22"/>',
  print:
    '<polyline points="6,9 6,2 18,2 18,9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
  copy:
    '<rect x="8" y="8" width="12" height="14" rx="2"/><path d="M4 16V6a2 2 0 0 1 2-2h10"/>',
  "calendar-alt":
    '<rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/>',
  trash:
    '<polyline points="3,6 5,6 21,6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
};

const ALIAS = {
  grip: "grid",
  database: "database",
  utensils: "utensils",
  "boxes-stacked": "boxes",
  truck: "truck",
  "heart-pulse": "heart",
  "shield-halved": "shield",
  school: "graduation",
  "user-graduate": "graduation",
  "location-dot": "map-pin",
  "magnifying-glass": "search",
  "list-ul": "list",
  pen: "edit",
  xmark: "x",
  ban: "ban",
  "arrow-trend-up": "trend-up",
  "file-csv": "file-text",
  "chart-pie": "pie-chart",
  warehouse: "folder",
  "box-open": "folder",
  building: "graduation",
  "building-columns": "landmark",
  "file-lines": "file-text",
  "file-text": "file-text",
  "list-ul": "list",
  spoon: "spoon",
  print: "print",
  copy: "copy",
  clone: "copy",
  "calendar-alt": "calendar-alt",
  "calendar-days": "calendar-alt",
  trash: "trash",
  "arrow-left": "arrow-left",
  "arrow-right": "arrow-right",
  "clipboard-list": "spoon",
  "chevron-left": "chevron-left",
  "chevron-right": "chevron-right",
  "chevron-down": "chevron-down",
  "right-to-bracket": "arrow-right",
  "right-from-bracket": "arrow-right",
  "user-pen": "edit",
};

function resolveIcon(name) {
  if (!name) return "dot";
  const base = name.replace(/^fa-/, "");
  if (ICONS[base]) return base;
  if (ALIAS[base] && ICONS[ALIAS[base]]) return ALIAS[base];
  return "dot";
}

export default function Icon({ name, className = "", style }) {
  const key = resolveIcon(name);
  const inner = ICONS[key] || ICONS.dot;
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: "inline-block", verticalAlign: "-0.125em", flexShrink: 0, ...style }}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}

export function FaIcon({ icon, className, style }) {
  return <Icon name={icon.replace(/^fa-solid\s+/, "")} className={className} style={style} />;
}
