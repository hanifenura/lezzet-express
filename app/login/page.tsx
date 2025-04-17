'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Login() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('Geçersiz email veya şifre');
                return;
            }

            // Kullanıcı rolüne göre yönlendirme
            const response = await fetch('/api/auth/session');
            const session = await response.json();

            if (session?.user?.role === 'customer') {
                router.push('/konum');
            } else if (session?.user?.role === 'restaurant_owner') {
                router.push('/restaurant_owner');
            } else if (session?.user?.role === 'admin') {
                router.push('/admin');
            } else {
                router.push('/');
            }

            router.refresh();
        } catch (error) {
            console.error('Giriş hatası:', error);
            setError('Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header />
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
                    <div>
                        <h2 className="text-2xl font-bold text-center mb-6 text-gray-700">
                            Hesabınıza giriş yapın
                        </h2>
                    </div>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email adresi
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7F0005] focus:border-[#7F0005] outline-none transition-all"
                                    placeholder="lezzetexpress@gmail.com"
                                />
                            </div>
                            <br>

                            </br>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                    Şifre
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7F0005] focus:border-[#7F0005] outline-none transition-all"
                                    placeholder="********"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm text-center">{error}</div>

                        )}

                        <div className="flex items-center justify-between">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-[#7F0005] border-gray-300 rounded focus:ring-[#7F0005]"
                                />
                                <span className="ml-2 text-sm text-gray-600">Beni hatırla</span>
                            </label>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-[#7F0005] text-white rounded-lg hover:bg-opacity-90 transition-all"
                            >
                                {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600">
                            Hesabınız yok mu?{' '}
                            <a href="/register" className="text-[#7F0005] hover:underline">
                                Kayıt Ol
                            </a>
                        </p>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}
