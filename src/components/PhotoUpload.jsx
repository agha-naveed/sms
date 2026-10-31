// Choose, change or remove a profile picture.
//
//   <PhotoUpload name="Ali" photo={url} path="/auth/photo" onChanged={fn} />
//
// path is "/auth/photo" for your own picture, or "/auth/photo/<userId>" when
// the admin sets someone else's. onChanged(newPhotoUrlOrNull) runs after a
// change is saved.
import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import api, { errorText } from "../api";
import Avatar from "./Avatar.jsx";
import { Button, Message } from "./ui.jsx";

const MAX_BYTES = 3 * 1024 * 1024;

export default function PhotoUpload({ name, photo, path, onChanged, size = 72 }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function choose(e) {
    const file = e.target.files[0];
    e.target.value = "";           // lets the same file be picked again later
    if (!file) return;

    setError("");
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setError("Choose a JPG, PNG or WebP picture.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That picture is bigger than 3 MB. Choose a smaller one.");
      return;
    }

    setBusy(true);
    try {
      const body = new FormData();
      body.append("photo", file);
      const res = await api.put(path, body);
      onChanged(res.data.photo);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setError("");
    setBusy(true);
    try {
      await api.delete(path);
      onChanged(null);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <Avatar name={name} photo={photo} size={size} />

        <div className="flex flex-wrap gap-2">
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={choose} />
          <Button type="button" variant="plain" size="sm" icon={Camera} loading={busy} onClick={function () { input.current.click(); }}>
            {photo ? "Change picture" : "Add picture"}
          </Button>
          {photo && (
            <Button type="button" variant="plain" size="sm" icon={Trash2} disabled={busy} onClick={remove}>
              Remove
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-2">JPG, PNG or WebP, up to 3 MB. It is cropped to a square.</p>
      <Message type="error" onClose={function () { setError(""); }}>{error}</Message>
    </div>
  );
}
