'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import React from 'react';

interface Restaurant {
    id: string;
    name: string;
    description: string | null;
    address: string | null;
    phone: string | null;
    rating: number;
    image: string | null;
    menu: {
        id: string;
        name: string;
        description: string | null;
        price: number;
        category: string;
        available: boolean;
    }[];
    orders: {
        id: string;
        status: string;
        orderedAt: string;
        totalPrice: number;
        user: {
            name: string;
        };
        items: {
            id: string;
            quantity: number;
            menu: {
                name: string;
                price: number;
            };
        }[];
    }[];
    reviews?: {
        id: string;
        rating: number;
        comment: string;
        createdAt: string;
        user: {
            name: string;
        };
    }[];
}

export default function RestaurantOwnerDashboard() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (session?.user) {
            fetchRestaurants();
        }
    }, [session]);

    const fetchRestaurants = async () => {
        try {
            const response = await fetch("/api/restaurant-owner/restaurants");
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setRestaurants(data);
            setLoading(false);
        } catch (err) {
            console.error("Restoran verileri yüklenirken hata:", err);
            setError("Veriler yüklenirken bir hata oluştu");
            setLoading(false);
        }
    };

    if (loading) {
        return <div>Yükleniyor...</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    const renderDashboard = () => (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Hoş Geldiniz, {session?.user?.name}</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold">Toplam Restoran</h3>
                    <p className="text-3xl font-bold">{restaurants.length}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold">Toplam Menü Öğesi</h3>
                    <p className="text-3xl font-bold">
                        {restaurants.reduce((acc, restaurant) => acc + (restaurant.menu?.length || 0), 0)}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold">Bekleyen Siparişler</h3>
                    <p className="text-3xl font-bold">
                        {restaurants.reduce(
                            (acc, restaurant) =>
                                acc + (restaurant.orders?.filter((order) => order.status === "PENDING").length || 0),
                            0
                        )}
                    </p>
                </div>
            </div>
        </div>
    );

    const renderRestaurants = () => (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Restoranlarım</h1>
            <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                    <div className="space-y-4">
                        {restaurants.map((restaurant) => (
                            <div key={restaurant.id} className="border-b pb-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-medium">{restaurant.name}</h3>
                                        <p className="text-gray-600">{restaurant.description}</p>
                                        <p className="text-sm text-gray-500">
                                            {restaurant.address} - {restaurant.phone}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">
                                            {restaurant.menu?.length || 0} menü öğesi
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {restaurant.orders?.length || 0} sipariş
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderMenu = () => (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Menü Yönetimi</h1>
            <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                    <div className="space-y-4">
                        {restaurants.map((restaurant) => (
                            <div key={restaurant.id} className="border-b pb-4">
                                <h3 className="text-lg font-medium mb-2">{restaurant.name}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {restaurant.menu?.map((item) => (
                                        <div key={item.id} className="border rounded-lg p-4">
                                            <h4 className="font-medium">{item.name}</h4>
                                            <p className="text-gray-600">{item.description}</p>
                                            <p className="text-sm text-gray-500">{item.category}</p>
                                            <p className="font-semibold">{item.price} TL</p>
                                            <p className={`text-sm ${item.available ? 'text-green-500' : 'text-red-500'}`}>
                                                {item.available ? 'Mevcut' : 'Mevcut Değil'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderOrders = () => (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Siparişler</h1>
            <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                    <div className="space-y-4">
                        {restaurants.flatMap((restaurant) =>
                            (restaurant.orders || [])
                                .sort((a, b) => new Date(b.orderedAt).getTime() - new Date(a.orderedAt).getTime())
                                .map((order) => (
                                    <div key={order.id} className="border-b pb-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-lg font-medium">{restaurant.name}</h3>
                                                <p className="text-gray-600">{order.user.name}</p>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(order.orderedAt).toLocaleDateString("tr-TR")}
                                                </p>
                                                <div className="mt-2">
                                                    {order.items.map((item) => (
                                                        <div key={item.id} className="text-sm">
                                                            {item.quantity}x {item.menu.name} - {item.menu.price} TL
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold">{order.totalPrice} TL</p>
                                                <p
                                                    className={`text-sm ${order.status === "PENDING"
                                                        ? "text-orange-500"
                                                        : order.status === "COMPLETED"
                                                            ? "text-green-500"
                                                            : "text-red-500"
                                                        }`}
                                                >
                                                    {order.status === "PENDING"
                                                        ? "Bekliyor"
                                                        : order.status === "COMPLETED"
                                                            ? "Tamamlandı"
                                                            : "İptal Edildi"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderReviews = () => (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Yorumlar</h1>
            <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                    <div className="space-y-4">
                        {restaurants.map((restaurant) => (
                            <div key={restaurant.id} className="border-b pb-4">
                                <h3 className="text-lg font-medium mb-2">{restaurant.name}</h3>
                                <div className="space-y-2">
                                    {restaurant.reviews?.map((review) => (
                                        <div key={review.id} className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className="flex items-center">
                                                        {[...Array(5)].map((_, i) => (
                                                            <svg
                                                                key={i}
                                                                className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                                                                    }`}
                                                                fill="currentColor"
                                                                viewBox="0 0 20 20"
                                                            >
                                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                            </svg>
                                                        ))}
                                                    </div>
                                                    <span className="ml-2 text-sm text-gray-500">{review.user.name}</span>
                                                </div>
                                                <span className="text-sm text-gray-500">
                                                    {new Date(review.createdAt).toLocaleDateString("tr-TR")}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-gray-600">{review.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSettings = () => (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Ayarlar</h1>
            <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-medium mb-2">Profil Bilgileri</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Ad Soyad</label>
                                    <input
                                        type="text"
                                        value={session?.user?.name || ''}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#7F0005] focus:ring-[#7F0005] sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">E-posta</label>
                                    <input
                                        type="email"
                                        value={session?.user?.email || ''}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#7F0005] focus:ring-[#7F0005] sm:text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium mb-2">Restoran Bilgileri</h3>
                            <div className="space-y-4">
                                {restaurants.map((restaurant) => (
                                    <div key={restaurant.id} className="border rounded-lg p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Restoran Adı</label>
                                                <input
                                                    type="text"
                                                    value={restaurant.name}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#7F0005] focus:ring-[#7F0005] sm:text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Telefon</label>
                                                <input
                                                    type="text"
                                                    value={restaurant.phone || ''}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#7F0005] focus:ring-[#7F0005] sm:text-sm"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700">Adres</label>
                                                <input
                                                    type="text"
                                                    value={restaurant.address || ''}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#7F0005] focus:ring-[#7F0005] sm:text-sm"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                                                <textarea
                                                    value={restaurant.description || ''}
                                                    rows={3}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#7F0005] focus:ring-[#7F0005] sm:text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const getCurrentView = () => {
        if (pathname.includes('dashboard')) return 'dashboard';
        if (pathname.includes('restaurants')) return 'restaurants';
        if (pathname.includes('menu')) return 'menu';
        if (pathname.includes('orders')) return 'orders';
        if (pathname.includes('reviews')) return 'reviews';
        if (pathname.includes('settings')) return 'settings';
        return 'dashboard';
    };

    const currentView = getCurrentView();

    switch (currentView) {
        case 'dashboard':
            return renderDashboard();
        case 'restaurants':
            return renderRestaurants();
        case 'menu':
            return renderMenu();
        case 'orders':
            return renderOrders();
        case 'reviews':
            return renderReviews();
        case 'settings':
            return renderSettings();
        default:
            return renderDashboard();
    }
}