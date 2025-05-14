'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    HomeIcon,
    ShoppingCartIcon,
    LogOutIcon,
    MapPinIcon,
    UserIcon,
    PhoneIcon,
} from 'lucide-react';

interface Order {
    id: string;
    status: string;
    totalPrice: number;
    orderedAt: string;
    user: {
        name: string;
        phoneNumber: string;
        address: string;
    };
    restaurant: {
        name: string;
        address: string;
    };
    items: {
        id: string;
        quantity: number;
        menu: {
            name: string;
            price: number;
        };
    }[];
}

export default function CourierPanel() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
    const [locationTracking, setLocationTracking] = useState<boolean>(false);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number, lng: number } | null>(null);
    const watchPositionRef = useRef<number | null>(null);
    const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (session?.user) {
            fetchOrders();
            // Konum izni kontrolü
            checkLocationPermission();
        }
    }, [session]);

    useEffect(() => {
        if (status === 'unauthenticated' || session?.user.role !== 'courier') {
            router.push('/');
        }
    }, [status, session]);

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/courier/orders');
            if (!res.ok) throw new Error('Veri çekilemedi');
            const data = await res.json();
            setOrders(data);
        } catch (err) {
            setError('Veri çekilirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const checkLocationPermission = () => {
        if ('permissions' in navigator) {
            // @ts-ignore
            navigator.permissions.query({ name: 'geolocation' })
                .then(permissionStatus => {
                    setLocationPermission(permissionStatus.state as 'granted' | 'denied' | 'prompt');

                    permissionStatus.onchange = () => {
                        setLocationPermission(permissionStatus.state as 'granted' | 'denied' | 'prompt');
                    };
                })
                .catch(error => {
                    console.error('Konum izni kontrolü hatası:', error);
                });
        }
    };

    const requestLocationPermission = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocationPermission('granted');
                    setCurrentLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.error('Konum izni reddedildi:', error);
                    setLocationPermission('denied');
                }
            );
        } else {
            alert('Tarayıcınız konum servislerini desteklemiyor.');
        }
    };

    const startLocationTracking = (orderId: string) => {
        if (locationPermission !== 'granted') {
            requestLocationPermission();
            return;
        }

        if (watchPositionRef.current) {
            // Zaten izleme yapılıyorsa durdur ve yeniden başlat
            stopLocationTracking();
        }

        // Konum izleme başlat
        setLocationTracking(true);
        setSelectedOrderId(orderId);

        // Konum değişikliklerini izle
        watchPositionRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const newLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                setCurrentLocation(newLocation);
            },
            (error) => {
                console.error('Konum izleme hatası:', error);
                stopLocationTracking();
            },
            {
                enableHighAccuracy: true,
                maximumAge: 30000,
                timeout: 27000
            }
        );

        // Konum verilerini sunucuya gönder (15 saniyede bir)
        locationIntervalRef.current = setInterval(() => {
            if (currentLocation) {
                sendLocationToServer(orderId, currentLocation);
            }
        }, 15000);

        // İlk konum gönderme
        if (currentLocation) {
            sendLocationToServer(orderId, currentLocation);
        }
    };

    const stopLocationTracking = () => {
        if (watchPositionRef.current) {
            navigator.geolocation.clearWatch(watchPositionRef.current);
            watchPositionRef.current = null;
        }

        if (locationIntervalRef.current) {
            clearInterval(locationIntervalRef.current);
            locationIntervalRef.current = null;
        }

        setLocationTracking(false);
        setSelectedOrderId(null);
    };

    const sendLocationToServer = async (orderId: string, location: { lat: number, lng: number }) => {
        try {
            const response = await fetch('/api/courier/location', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId,
                    location
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                console.error('Konum güncellemesi başarısız:', data.error);
            }
        } catch (error) {
            console.error('Konum gönderirken hata:', error);
        }
    };

    const handleCompleteOrder = async (orderId: string) => {
        try {
            // Eğer konum izleme aktifse, durdur
            if (locationTracking && selectedOrderId === orderId) {
                stopLocationTracking();
            }

            const res = await fetch('/api/courier/orders', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId,
                    action: 'complete'
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Sipariş tamamlanamadı');
            }

            await fetchOrders();
        } catch (error) {
            console.error('Sipariş tamamlanırken hata:', error);
            alert(error instanceof Error ? error.message : 'Sipariş tamamlanırken bir hata oluştu');
        }
    };

    const handleCancelOrder = async () => {
        if (!selectedOrderId || !cancelReason.trim()) {
            alert('Lütfen iptal sebebini belirtin');
            return;
        }

        try {
            // Eğer konum izleme aktifse, durdur
            if (locationTracking) {
                stopLocationTracking();
            }

            const res = await fetch('/api/courier/orders', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: selectedOrderId,
                    action: 'cancel',
                    reason: cancelReason
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Sipariş iptal edilemedi');
            }

            await fetchOrders();
            setShowCancelModal(false);
            setSelectedOrderId(null);
            setCancelReason('');
        } catch (error) {
            console.error('Sipariş iptal edilirken hata:', error);
            alert(error instanceof Error ? error.message : 'Sipariş iptal edilirken bir hata oluştu');
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/signout', { method: 'POST' });
        router.push('/');
    };

    const renderCancelModal = () => {
        if (!showCancelModal) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg w-96">
                    <h3 className="text-lg font-semibold mb-4">Siparişi İptal Et</h3>
                    <textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="w-full p-2 border rounded mb-4"
                        placeholder="İptal sebebini yazın..."
                        rows={4}
                    />
                    <div className="flex justify-end space-x-2">
                        <button
                            onClick={() => {
                                setShowCancelModal(false);
                                setSelectedOrderId(null);
                                setCancelReason('');
                            }}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            Vazgeç
                        </button>
                        <button
                            onClick={handleCancelOrder}
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                            İptal Et
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderOrders = () => (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Aktif Siparişlerim</h1>
            <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                    <div className="space-y-4">
                        {orders
                            .filter(order => order.status === 'YOLDA')
                            .map((order) => (
                                <div key={order.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-medium">{order.restaurant.name}</h3>
                                            <p className="text-sm text-gray-500">
                                                {new Date(order.orderedAt).toLocaleDateString("tr-TR")}
                                            </p>
                                        </div>
                                        <p className="font-semibold">{order.totalPrice} TL</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="bg-gray-50 p-3 rounded">
                                            <h4 className="font-medium mb-2">Müşteri Bilgileri</h4>
                                            <div className="space-y-1">
                                                <p className="flex items-center">
                                                    <UserIcon className="w-4 h-4 mr-2" />
                                                    {order.user.name}
                                                </p>
                                                <p className="flex items-center">
                                                    <PhoneIcon className="w-4 h-4 mr-2" />
                                                    {order.user.phoneNumber}
                                                </p>
                                                <p className="flex items-center">
                                                    <MapPinIcon className="w-4 h-4 mr-2" />
                                                    {order.user.address}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 p-3 rounded">
                                            <h4 className="font-medium mb-2">Sipariş Detayları</h4>
                                            <div className="space-y-1">
                                                {order.items.map((item) => (
                                                    <div key={item.id} className="text-sm">
                                                        {item.quantity}x {item.menu.name} - {item.menu.price} TL
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Konum İzleme Butonu */}
                                        <div className="bg-blue-50 p-3 rounded">
                                            <h4 className="font-medium mb-2">Konum Takibi</h4>
                                            <div className="text-sm">
                                                {locationPermission === 'denied' ? (
                                                    <p className="text-red-500">
                                                        Konum izni reddedildi. Konum takibi için lütfen tarayıcı ayarlarınızdan izin verin.
                                                    </p>
                                                ) : locationTracking && selectedOrderId === order.id ? (
                                                    <div>
                                                        <p className="text-green-600 mb-2">
                                                            Konumunuz takip ediliyor ve müşteri ile paylaşılıyor.
                                                        </p>
                                                        <button
                                                            onClick={() => stopLocationTracking()}
                                                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                                                        >
                                                            Takibi Durdur
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p className="mb-2">
                                                            Konum takibini başlatarak müşteriye canlı konum bilgisi sağlayabilirsiniz.
                                                        </p>
                                                        <button
                                                            onClick={() => startLocationTracking(order.id)}
                                                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                                                        >
                                                            Konum Takibini Başlat
                                                        </button>
                                                    </div>
                                                )}
                                                {currentLocation && (
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        Mevcut Konum: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex justify-end space-x-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedOrderId(order.id);
                                                    setShowCancelModal(true);
                                                }}
                                                className="px-4 py-2 text-red-500 hover:text-red-700"
                                            >
                                                İptal Et
                                            </button>
                                            <button
                                                onClick={() => handleCompleteOrder(order.id)}
                                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                            >
                                                Teslim Edildi
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
            {renderCancelModal()}
        </div>
    );

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
                        <h1 className="text-xl font-semibold text-[#7F0005]">Kurye Paneli</h1>
                        <div className="text-gray-700">{session?.user?.name}</div>
                    </div>
                </header>

                <main className="flex-1 p-6">
                    {loading ? (
                        <div>Yükleniyor...</div>
                    ) : error ? (
                        <div className="text-red-500">{error}</div>
                    ) : (
                        renderOrders()
                    )}
                </main>
            </div>
        </div>
    );
}