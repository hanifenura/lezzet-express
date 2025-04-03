'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/app/context/CartContext';

const Header2 = () => {
    const { items } = useCart();
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <nav className="bg-[#fdfcfc] py-6 shadow-lg sticky top-0 z-40 w-full">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="pl-4 md:pl-0 px-2 sm:px-4 md:px-6 flex items-center space-x-2">
                        <Image src="/logo_1.png" alt="Logo" width={56} height={56} className="w-10 md:w-12 lg:w-14 h-auto" />
                        <Link href="/">
                            <span className="font-sigmar text-2xl sm:text-3xl text-[#7F0005]">LezzetExpress</span>
                        </Link>
                    </div>

                    {/* Arama Çubuğu */}
                    <div className="flex-1 max-w-xl px-6">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Restoran veya mutfak ara..."
                                className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7F0005] focus:border-[#7F0005] outline-none"
                            />
                            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Sağ Taraf İkonları */}
                    <div className="flex items-center space-x-6 px-8">
                        {/* Sepet */}
                        <Link href="/cart" className="relative group">
                            <Image src="/basket.png" alt="Sepet" width={32} height={32} className="w-4 md:w-6 lg:w-8 h-auto" />
                            {itemCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-[#7F0005] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                    {itemCount}
                                </span>
                            )}
                        </Link>

                        {/* Profil */}
                        <button className="group">
                            <Image src="/people.png" alt="Profil" width={32} height={32} className="w-4 md:w-6 lg:w-8 h-auto" />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Header2;
