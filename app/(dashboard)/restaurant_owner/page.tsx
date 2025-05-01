'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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



// Tip tanımı
type ViewType = 'dashboard' | 'restaurants' | 'menu' | 'orders' | 'reviews';

interface Restaurant {
    id?: string;
    name: string;
    description: string | null;
    address: string | null;
    phone: string | null;
    rating?: number;
    image?: string | null;
    menu?: {
        id: string;
        name: string;
        description: string | null;
        price: number;
        category: string;
        available: boolean;
    }[];
    orders?: {
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

export default function RestaurantOwnerSPA() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [currentView, setCurrentView] = useState<ViewType>('dashboard');
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (session?.user) fetchRestaurants();
    }, [session]);

    useEffect(() => {
        if (status === 'unauthenticated' || session?.user.role !== 'restaurant_owner') {
            router.push('/');
        }
    }, [status, session]);

    const fetchRestaurants = async () => {
        try {
            const res = await fetch('/api/restaurant-owner/restaurants');
            if (!res.ok) throw new Error('Veri çekilemedi');
            const data = await res.json();
            setRestaurants(data);
        } catch (err) {
            setError('Veri çekilirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/signout', { method: 'POST' });
        router.push('/');
    };

    const sidebarItems: { view: ViewType; icon: React.ReactNode; label: string }[] = [
        { view: 'dashboard', icon: <HomeIcon size={18} />, label: 'Dashboard' },
        { view: 'restaurants', icon: <UtensilsCrossed size={18} />, label: 'Restoranlarım' },
        { view: 'menu', icon: <MenuIcon size={18} />, label: 'Menü Yönetimi' },
        { view: 'orders', icon: <ShoppingCartIcon size={18} />, label: 'Siparişler' },
        { view: 'reviews', icon: <Star size={18} />, label: 'Yorumlar' },
    ];

    const renderCurrentView = () => {
        if (loading) return <div>Yükleniyor...</div>;
        if (error) return <div className="text-red-500">{error}</div>;

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
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Restoranlarım</h1>
                    <button
                        onClick={() => {
                            const newRestaurant = {
                                name: '',
                                description: '',
                                address: '',
                                phone: ''
                            };
                            setRestaurants([...restaurants, newRestaurant]);
                        }}
                        className="bg-[#7F0005] text-white px-4 py-2 rounded-lg hover:bg-[#6A0004]"
                    >
                        Yeni Restoran Ekle
                    </button>
                </div>
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6">
                        <div className="space-y-4">
                            {restaurants.map((restaurant, index) => (
                                <div key={restaurant.id || index} className="border-b pb-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={restaurant.name}
                                                onChange={(e) => {
                                                    const newRestaurants = [...restaurants];
                                                    newRestaurants[index].name = e.target.value;
                                                    setRestaurants(newRestaurants);
                                                }}
                                                className="text-lg font-medium w-full p-2 border rounded"
                                                placeholder="Restoran Adı"
                                            />
                                            <textarea
                                                value={restaurant.description || ''}
                                                onChange={(e) => {
                                                    const newRestaurants = [...restaurants];
                                                    newRestaurants[index].description = e.target.value;
                                                    setRestaurants(newRestaurants);
                                                }}
                                                className="text-gray-600 w-full p-2 border rounded mt-2"
                                                placeholder="Açıklama"
                                            />
                                            <input
                                                type="text"
                                                value={restaurant.address || ''}
                                                onChange={(e) => {
                                                    const newRestaurants = [...restaurants];
                                                    newRestaurants[index].address = e.target.value;
                                                    setRestaurants(newRestaurants);
                                                }}
                                                className="text-sm text-gray-500 w-full p-2 border rounded mt-2"
                                                placeholder="Adres"
                                            />
                                            <input
                                                type="text"
                                                value={restaurant.phone || ''}
                                                onChange={(e) => {
                                                    const newRestaurants = [...restaurants];
                                                    newRestaurants[index].phone = e.target.value;
                                                    setRestaurants(newRestaurants);
                                                }}
                                                className="text-sm text-gray-500 w-full p-2 border rounded mt-2"
                                                placeholder="Telefon"
                                            />
                                        </div>
                                        <div className="ml-4">
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        if (restaurant.id) {
                                                            await fetch('/api/restaurant-owner/restaurants', {
                                                                method: 'PUT',
                                                                headers: {
                                                                    'Content-Type': 'application/json',
                                                                },
                                                                body: JSON.stringify(restaurant),
                                                            });
                                                        } else {
                                                            const response = await fetch('/api/restaurant-owner/restaurants', {
                                                                method: 'POST',
                                                                headers: {
                                                                    'Content-Type': 'application/json',
                                                                },
                                                                body: JSON.stringify(restaurant),
                                                            });
                                                            const newRestaurant = await response.json();
                                                            const newRestaurants = [...restaurants];
                                                            newRestaurants[index] = newRestaurant;
                                                            setRestaurants(newRestaurants);
                                                        }
                                                    } catch (error) {
                                                        console.error('Restoran kaydedilirken hata:', error);
                                                    }
                                                }}
                                                className="bg-[#7F0005] text-white px-4 py-2 rounded-lg hover:bg-[#6A0004]"
                                            >
                                                Kaydet
                                            </button>
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
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-medium">{restaurant.name}</h3>
                                        <button
                                            onClick={() => {
                                                const newMenuItem = {
                                                    name: '',
                                                    description: '',
                                                    price: 0,
                                                    category: 'Ana Yemek',
                                                    restaurantId: restaurant.id,
                                                    available: true
                                                };
                                                try {
                                                    fetch('/api/restaurant-owner/menu', {
                                                        method: 'POST',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                        },
                                                        body: JSON.stringify(newMenuItem),
                                                    }).then(() => {
                                                        fetchRestaurants();
                                                    });
                                                } catch (error) {
                                                    console.error('Menü öğesi eklenirken hata:', error);
                                                }
                                            }}
                                            className="bg-[#7F0005] text-white px-4 py-2 rounded-lg hover:bg-[#6A0004]"
                                        >
                                            Yeni Menü Öğesi Ekle
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {restaurant.menu?.map((item) => (
                                            <div key={item.id} className="border rounded-lg p-4">
                                                <input
                                                    type="text"
                                                    value={item.name}
                                                    onChange={async (e) => {
                                                        try {
                                                            await fetch('/api/restaurant-owner/menu', {
                                                                method: 'PUT',
                                                                headers: {
                                                                    'Content-Type': 'application/json',
                                                                },
                                                                body: JSON.stringify({
                                                                    id: item.id,
                                                                    name: e.target.value,
                                                                    description: item.description,
                                                                    price: item.price,
                                                                    category: item.category,
                                                                    available: item.available
                                                                }),
                                                            });
                                                            fetchRestaurants();
                                                        } catch (error) {
                                                            console.error('Menü öğesi güncellenirken hata:', error);
                                                        }
                                                    }}
                                                    className="font-medium w-full p-2 border rounded"
                                                    placeholder="Ürün Adı"
                                                />
                                                <textarea
                                                    value={item.description || ''}
                                                    onChange={async (e) => {
                                                        try {
                                                            await fetch('/api/restaurant-owner/menu', {
                                                                method: 'PUT',
                                                                headers: {
                                                                    'Content-Type': 'application/json',
                                                                },
                                                                body: JSON.stringify({
                                                                    id: item.id,
                                                                    name: item.name,
                                                                    description: e.target.value,
                                                                    price: item.price,
                                                                    category: item.category,
                                                                    available: item.available
                                                                }),
                                                            });
                                                            fetchRestaurants();
                                                        } catch (error) {
                                                            console.error('Menü öğesi güncellenirken hata:', error);
                                                        }
                                                    }}
                                                    className="text-gray-600 w-full p-2 border rounded mt-2"
                                                    placeholder="Açıklama"
                                                />
                                                <input
                                                    type="number"
                                                    value={item.price}
                                                    onChange={async (e) => {
                                                        try {
                                                            await fetch('/api/restaurant-owner/menu', {
                                                                method: 'PUT',
                                                                headers: {
                                                                    'Content-Type': 'application/json',
                                                                },
                                                                body: JSON.stringify({
                                                                    id: item.id,
                                                                    name: item.name,
                                                                    description: item.description,
                                                                    price: parseFloat(e.target.value),
                                                                    category: item.category,
                                                                    available: item.available
                                                                }),
                                                            });
                                                            fetchRestaurants();
                                                        } catch (error) {
                                                            console.error('Menü öğesi güncellenirken hata:', error);
                                                        }
                                                    }}
                                                    className="text-sm text-gray-500 w-full p-2 border rounded mt-2"
                                                    placeholder="Fiyat"
                                                />
                                                <select
                                                    value={item.category}
                                                    onChange={async (e) => {
                                                        try {
                                                            await fetch('/api/restaurant-owner/menu', {
                                                                method: 'PUT',
                                                                headers: {
                                                                    'Content-Type': 'application/json',
                                                                },
                                                                body: JSON.stringify({
                                                                    id: item.id,
                                                                    name: item.name,
                                                                    description: item.description,
                                                                    price: item.price,
                                                                    category: e.target.value,
                                                                    available: item.available
                                                                }),
                                                            });
                                                            fetchRestaurants();
                                                        } catch (error) {
                                                            console.error('Menü öğesi güncellenirken hata:', error);
                                                        }
                                                    }}
                                                    className="text-sm text-gray-500 w-full p-2 border rounded mt-2"
                                                >
                                                    <option value="Ana Yemek">Ana Yemek</option>
                                                    <option value="Çorba">Çorba</option>
                                                    <option value="Salata">Salata</option>
                                                    <option value="Tatlı">Tatlı</option>
                                                    <option value="İçecek">İçecek</option>
                                                </select>
                                                <div className="flex items-center justify-between mt-2">
                                                    <div className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={item.available}
                                                            onChange={async (e) => {
                                                                try {
                                                                    await fetch('/api/restaurant-owner/menu', {
                                                                        method: 'PUT',
                                                                        headers: {
                                                                            'Content-Type': 'application/json',
                                                                        },
                                                                        body: JSON.stringify({
                                                                            id: item.id,
                                                                            name: item.name,
                                                                            description: item.description,
                                                                            price: item.price,
                                                                            category: item.category,
                                                                            available: e.target.checked
                                                                        }),
                                                                    });
                                                                    fetchRestaurants();
                                                                } catch (error) {
                                                                    console.error('Menü öğesi güncellenirken hata:', error);
                                                                }
                                                            }}
                                                            className="mr-2"
                                                        />
                                                        <span className="text-sm">Mevcut</span>
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await fetch('/api/restaurant-owner/menu', {
                                                                        method: 'PUT',
                                                                        headers: {
                                                                            'Content-Type': 'application/json',
                                                                        },
                                                                        body: JSON.stringify({
                                                                            id: item.id,
                                                                            name: item.name,
                                                                            description: item.description,
                                                                            price: item.price,
                                                                            category: item.category,
                                                                            available: item.available
                                                                        }),
                                                                    });
                                                                    fetchRestaurants();
                                                                } catch (error) {
                                                                    console.error('Menü öğesi güncellenirken hata:', error);
                                                                }
                                                            }}
                                                            className="bg-[#7F0005] text-white px-3 py-1 rounded hover:bg-[#6A0004] text-sm"
                                                        >
                                                            Kaydet
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await fetch(`/api/restaurant-owner/menu?id=${item.id}`, {
                                                                        method: 'DELETE',
                                                                    });
                                                                    fetchRestaurants();
                                                                } catch (error) {
                                                                    console.error('Menü öğesi silinirken hata:', error);
                                                                }
                                                            }}
                                                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                                                        >
                                                            Sil
                                                        </button>
                                                    </div>
                                                </div>
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
                                                    {order.status === "PENDING" && (
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await fetch(`/api/restaurant-owner/orders?id=${order.id}`, {
                                                                        method: 'DELETE',
                                                                    });
                                                                    fetchRestaurants();
                                                                } catch (error) {
                                                                    console.error('Sipariş iptal edilirken hata:', error);
                                                                }
                                                            }}
                                                            className="text-red-500 hover:text-red-700 mt-2"
                                                        >
                                                            İptal Et
                                                        </button>
                                                    )}
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

        switch (currentView) {
            case 'dashboard': return renderDashboard();
            case 'restaurants': return renderRestaurants();
            case 'menu': return renderMenu();
            case 'orders': return renderOrders();
            case 'reviews': return renderReviews();
            default: return null;
        }
    };

    if (status === 'loading') return <div>Yükleniyor...</div>;

    return (
        <div className="flex min-h-screen bg-gray-100">
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
                        <button
                            key={item.view}
                            onClick={() => setCurrentView(item.view)}
                            className={`flex items-center w-full px-4 py-2 rounded hover:bg-gray-100 ${currentView === item.view ? 'bg-gray-100' : ''
                                } ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}
                        >
                            {item.icon}
                            {isSidebarOpen && <span className="ml-3">{item.label}</span>}
                        </button>
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

            <div className="flex-1 flex flex-col">
                <header className="bg-white shadow sticky top-0 z-30 w-full">
                    <div className="px-6 py-4 flex justify-between items-center">
                        <h1 className="text-xl font-semibold text-[#7F0005]">Restaurant Owner Panel</h1>
                        <div className="text-gray-700">{session?.user?.name}</div>
                    </div>
                </header>

                <main className="flex-1 p-6">
                    {renderCurrentView()}
                </main>
            </div>
        </div>
    );
}
