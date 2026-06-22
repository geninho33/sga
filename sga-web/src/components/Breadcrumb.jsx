import { FaIcon } from "./Icon";

export default function Breadcrumb({ items }) {
  return (
    <div className="breadcrumb">
      {items.map((it, i) => (
        <span key={i} style={{ display: "contents" }}>
          {i > 0 && <FaIcon icon="fa-chevron-right" className="sep" />}
          {i === items.length - 1 ? (
            <span className="current">{it}</span>
          ) : (
            <a href="#">{it}</a>
          )}
        </span>
      ))}
    </div>
  );
}
