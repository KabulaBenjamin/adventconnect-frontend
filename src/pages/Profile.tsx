import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";
import { Camera, Save } from "lucide-react";

const Profile = () => {
  const { user, login } = useAuth();
  const [form, setForm] = useState({
    username: user?.username || "",
    bio: user?.bio || "",
    church: user?.church || "",
  });
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>(user?.profilePic || "");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePic(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const formData = new FormData();
      formData.append("username", form.username);
      formData.append("bio", form.bio);
      formData.append("church", form.church);
      if (profilePic) formData.append("profilePic", profilePic);

      const updated = await apiFetch("/users/me", { method: "PUT", body: formData });
      login(updated, localStorage.getItem("token")!);
      setSuccess("Profile updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto pt-8 px-4 pb-20">
      <h1 className="text-2xl font-black text-gray-900 mb-6">Account Settings</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        {/* Profile Picture */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
              {preview
                ? <img src={preview} alt="Profile" className="w-full h-full object-cover" />
                : user?.username?.[0] || "U"}
            </div>
            <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-700 transition">
              <Camera size={14} />
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
          </div>
          <p className="mt-2 text-sm text-gray-500">Click the camera to change photo</p>
        </div>

        {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Display Name</label>
            <input
              type="text"
              className="w-full p-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Bio</label>
            <textarea
              className="w-full p-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="Tell the community about yourself..."
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Church / Conference</label>
            <input
              type="text"
              className="w-full p-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. North West Kenya Conference"
              value={form.church}
              onChange={(e) => setForm({ ...form, church: e.target.value })}
            />
          </div>
          <div className="pt-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full p-3 bg-gray-100 border rounded-lg text-gray-400 cursor-not-allowed"
              value={user?.email || ""}
              disabled
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
