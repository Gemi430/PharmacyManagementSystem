import { useState } from "react";
import api from "../../api/axios";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "pharmacist",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/auth/register", form);
      alert(res.data.message);
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow w-80"
      >
        <h2 className="text-xl font-bold mb-4 text-center">
          📝 Register
        </h2>

        <input
          placeholder="Username"
          className="border w-full mb-3 px-3 py-2"
          onChange={(e) =>
            setForm({ ...form, username: e.target.value })
          }
        />

        <input
          type="password"
          placeholder="Password"
          className="border w-full mb-3 px-3 py-2"
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
        />

        <select
          className="border w-full mb-4 px-3 py-2"
          onChange={(e) =>
            setForm({ ...form, role: e.target.value })
          }
        >
          <option value="pharmacist">Pharmacist</option>
          <option value="admin">Admin</option>
        </select>

        <button className="w-full bg-green-500 text-white py-2">
          Register
        </button>
      </form>
    </div>
  );
}