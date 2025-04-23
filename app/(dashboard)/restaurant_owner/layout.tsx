'use client';

import React from 'react';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    HomeIcon,
    SettingsIcon,
    MenuIcon,
    ShoppingCartIcon,
    LogOutIcon,
    UtensilsCrossed,
    Star,
} from 'lucide-react';

type ViewType = 'dashboard' | 'restaurants' | 'menu' | 'orders' | 'reviews' | 'settings';

interface Props {
    children: React.ReactNode;
}

export default function RestaurantOwnerLayout({
    children,
}: Props) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    if (status === 'loading') return <div>Yükleniyor...</div>;
    if (status === 'unauthenticated' || session?.user.role !== 'restaurant_owner') {
        router.push('/');
        return null;
    }

    const handleLogout = async () => {
        await fetch('/api/auth/signout', { method: 'POST' });
        router.push('/');
    };

    const sidebarItems = [
        { view: 'dashboard', icon: <HomeIcon size={18} />, label: 'Dashboard' },
        { view: 'restaurants', icon: <UtensilsCrossed size={18} />, label: 'Restoranlarım' },
        { view: 'menu', icon: <MenuIcon size={18} />, label: 'Menü Yönetimi' },
        { view: 'orders', icon: <ShoppingCartIcon size={18} />, label: 'Siparişler' },
        { view: 'reviews', icon: <Star size={18} />, label: 'Yorumlar' },
        { view: 'settings', icon: <SettingsIcon size={18} />, label: 'Ayarlar' },
    ];

    const isActive = (view: string) => {
        return pathname.includes(view);
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-md transition-all duration-300`}>
                <div className="flex items-center justify-between p-4">
                    {isSidebarOpen && (
                        <div className="flex items-center space-x-2">
                            <Image src="/logo_1.png" alt="Logo" width={40} height={40} />
                            <span className="text-xl font-bold text-[#7F0005]">LezzetExpress</span>
                        </div>
                    )}
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-500 hover:text-gray-700">
                        {isSidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                    </button>
                </div>

                <nav className="px-2 py-4 space-y-1">
                    {sidebarItems.map((item) => (
                        <Link
                            key={item.view}
                            href={`/restaurant_owner/${item.view}`}
                            className={`flex items-center w-full px-4 py-2 rounded hover:bg-gray-100 ${isActive(item.view) ? 'bg-gray-100' : ''
                                } ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}
                        >
                            {item.icon}
                            {isSidebarOpen && <span className="ml-3">{item.label}</span>}
                        </Link>
                    ))}
                    <button
                        onClick={handleLogout}
                        className={`flex items-center w-full px-4 py-2 rounded text-red-600 hover:bg-gray-100 ${isSidebarOpen ? 'justify-start' : 'justify-center'
                            }`}
                    >
                        <LogOutIcon size={18} />
                        {isSidebarOpen && <span className="ml-3">Çıkış Yap</span>}
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                <header className="bg-white shadow sticky top-0 z-30 w-full">
                    <div className="px-6 py-4 flex justify-between items-center">
                        <h1 className="text-xl font-semibold text-[#7F0005]">Restaurant Owner Panel</h1>
                        <div className="text-gray-700">{session?.user?.name}</div>
                    </div>
                </header>

                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
