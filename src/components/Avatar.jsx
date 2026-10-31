// A round profile picture, or the person's initials when there is none.
export default function Avatar({ name, photo, size = 36, className = "" }) {
  const initials = String(name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(function (w) { return w[0]; })
    .join("")
    .toUpperCase();

  const box = { width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.36)) };

  if (photo) {
    return (
      <img
        src={photo}
        alt={name || "Profile picture"}
        style={box}
        className={"rounded-full object-cover shrink-0 bg-slate-200 " + className}
      />
    );
  }

  return (
    <span
      style={box}
      className={"rounded-full bg-teal/80 text-white flex items-center justify-center font-bold shrink-0 " + className}
    >
      {initials}
    </span>
  );
}
