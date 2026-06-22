import { MODULES, RAIL_GROUPS } from "../../data/modules";
import { FaIcon } from "../Icon";

export default function Rail({ active, onSelect }) {
  const groups = RAIL_GROUPS.map((g) => MODULES.filter((m) => m.group === g)).filter((a) => a.length);

  return (
    <nav className="rail">
      <div className="rail-logo">SGA</div>
      {groups.map((mods, gi) => (
        <span key={gi} style={{ display: "contents" }}>
          {mods.map((m) => (
            <button
              key={m.id}
              type="button"
              className="rail-btn"
              aria-current={active === m.id}
              onClick={() => onSelect(m.id)}
            >
              <FaIcon icon={m.icon} />
              <span className="rail-tip">{m.label}</span>
            </button>
          ))}
          {gi < groups.length - 1 && <div className="rail-sep" />}
        </span>
      ))}
    </nav>
  );
}
