"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Register() {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!name || !email || !password) {
            setError("Lütfen tüm alanları doldurun.");
            return;
        }

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            if (!response.ok) {
                throw new Error("Kayıt başarısız. Lütfen bilgilerinizi kontrol edin.");
            }

            setIsOpen(false); // Modalı kapat
            router.push("/location"); // Başarılı kayıt sonrası yönlendir
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <>
            {/* Kayıt Ol Butonu */}
            <button
                onClick={() => setIsOpen(true)}
                className="bg-[#7F0005] text-white px-4 py-2 rounded-md"
            >
                Kayıt Ol
            </button>

            {/* Kayıt Ol Modalı */}
            {isOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                        <h2 className="text-xl font-bold text-center">Kayıt Ol</h2>

                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                        <form className="mt-4" onSubmit={handleRegister}>
                            <input
                                type="text"
                                placeholder="Ad Soyad"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-2 border rounded mb-2"
                                required
                            />
                            <input
                                type="email"
                                placeholder="E-posta"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-2 border rounded mb-2"
                                required
                            />
                            <input
                                type="password"
                                placeholder="Şifre"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-2 border rounded mb-2"
                                required
                            />
                            <button
                                type="submit"
                                className="w-full bg-[#7F0005] text-white py-2 rounded"
                            >
                                Kayıt Ol
                            </button>
                        </form>

                        <button
                            onClick={() => setIsOpen(false)}
                            className="mt-2 text-sm text-gray-500 hover:underline block text-center"
                        >
                            Kapat
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
