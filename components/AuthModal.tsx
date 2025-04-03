import { useState, useEffect } from "react";

type AuthModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

const AuthModal = ({ isOpen, onClose, isLogin }: AuthModalProps & { isLogin: boolean }) => {
    const [isLoginState, setIsLogin] = useState(isLogin);
    const [isClient, setIsClient] = useState(false);

    // useEffect ile yalnızca istemci tarafında çalışmasını sağlıyoruz
    useEffect(() => {
        setIsClient(true);

        // ReCAPTCHA script'ini sayfaya ekliyoruz
        const script = document.createElement("script");
        script.src = "https://www.google.com/recaptcha/api.js";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        return () => {
            // Component unmount olduğunda script'i kaldırıyoruz
            document.head.removeChild(script);
        };
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoginState) {
            console.log("Login işlemi yapılacak");
        } else {
            console.log("Register işlemi yapılacak");
        }

        // Yalnızca istemci tarafında yönlendirme işlemi yapıyoruz
        if (isClient) {
            window.location.href = "/konum"; // Yeni sayfaya yönlendir
        }
    };

    return (
        <div
            className={`fixed inset-0 backdrop-blur-xs bg-opacity-50 ${isOpen ? "flex" : "hidden"} items-center justify-center z-50`}
        >
            <div className="bg-white rounded-lg w-[400px] p-6 transform transition-all duration-300 scale-100 opacity-100">
                <div className="flex border-b border-gray-200 mb-6">
                    <button
                        onClick={() => setIsLogin(true)}
                        className={`flex-1 py-3 font-bold ${isLoginState ? "text-[#7F0005] border-b-2 border-[#7F0005]" : "text-gray-500 hover:text-[#7F0005]"}`}
                    >
                        Giriş Yap
                    </button>
                    <button
                        onClick={() => setIsLogin(false)}
                        className={`flex-1 py-3 font-bold ${!isLoginState ? "text-[#7F0005] border-b-2 border-[#7F0005]" : "text-gray-500 hover:text-[#7F0005]"}`}
                    >
                        Kayıt Ol
                    </button>
                </div>

                {isLoginState ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                            <input
                                type="email"
                                placeholder="lezzetexpress@gmail.com"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7F0005] focus:border-[#7F0005] outline-none transition-all"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
                            <input
                                type="password"
                                placeholder="********"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7F0005] focus:border-[#7F0005] outline-none transition-all"
                                required
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-[#7F0005] border-gray-300 rounded focus:ring-[#7F0005]"
                                />
                                <span className="ml-2 text-sm text-gray-600">Beni hatırla</span>
                            </label>
                            <a href="#" className="text-sm text-[#7F0005] hover:underline">Şifremi unuttum</a>
                        </div>
                        <div className="flex items-center justify-center g-recaptcha" data-sitekey="6Lc-lesqAAAAAK5o42mobgLF172rujcQypAkfUNO">
                            reCAPTCHA doğrulaması
                        </div>
                        <button
                            type="submit"
                            className="w-full py-3 bg-[#7F0005] text-white rounded-lg hover:bg-opacity-90 transition-all"
                        >
                            Giriş Yap
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                            <input
                                type="text"
                                placeholder="Lezzet Express"
                                className="w-full p-2 border rounded mb-2"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon Numarası</label>
                            <input
                                type="tel"
                                placeholder="0(5--) --- -- --"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7F0005] focus:border-[#7F0005] outline-none transition-all"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                            <input
                                type="email"
                                placeholder="lezzetexpress@gmail.com"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7F0005] focus:border-[#7F0005] outline-none transition-all"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
                            <input
                                type="password"
                                placeholder="********"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7F0005] focus:border-[#7F0005] outline-none transition-all"
                                required
                            />
                        </div>
                        <div className="flex items-center justify-center g-recaptcha" data-sitekey="6Lc-lesqAAAAAK5o42mobgLF172rujcQypAkfUNO">
                            reCAPTCHA doğrulaması
                        </div>
                        <button
                            type="submit"
                            className="w-full py-3 bg-[#7F0005] text-white rounded-lg hover:bg-opacity-90 transition-all"
                        >
                            Kayıt Ol
                        </button>
                    </form>
                )}

                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default AuthModal;
