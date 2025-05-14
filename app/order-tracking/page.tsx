'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header2 from '@/components/Header2';
import Footer from '@/components/Footer';

// Google tipi bildirimi
declare global {
    interface Window {
        google?: any;
    }
}

// Basit tip tanımlamaları
interface GoogleMap {
    panTo(latLng: Location): void;
}

interface GoogleMapMarker {
    setPosition(latLng: Location): void;
}

interface Location {
    lat: number;
    lng: number;
}

interface Courier {
    name: string;
    phone: string;
}

interface OrderData {
    id: string;
    status: string;
    courier: Courier;
    restaurant: {
        name: string;
        address: string;
        location: Location;
    };
    user: {
        name: string;
        address: string;
    };
}

interface DeliveryData {
    id: string;
    location: Location;
    updatedAt: string;
    status: string;
}

interface TrackingData {
    order: OrderData;
    delivery: DeliveryData;
}

// Hata tipini tanımlayalım
interface ErrorWithMessage {
    message: string;
}

// Debug bilgisi için tip tanımı
interface DebugInfo {
    status?: number;
    statusText?: string;
    url?: string;
    responseData?: any;
    testResponse?: any;
    error?: string;
    courierLocationData?: any;
    restaurantLocationData?: any;
    mapCreationError?: string;
    positionUpdateError?: string;
}

export default function OrderTrackingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
    const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const googleMapRef = useRef<GoogleMap | null>(null);
    const markerRef = useRef<GoogleMapMarker | null>(null);
    const restaurantMarkerRef = useRef<GoogleMapMarker | null>(null);
    const destinationMarkerRef = useRef<GoogleMapMarker | null>(null);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Google Maps script yükleme
    useEffect(() => {
        const loadGoogleMapsScript = () => {
            if (window.google?.maps) return Promise.resolve();

            const googleMapsApiKey = 'AIzaSyAjOrMz9DvNQo7DZXkNYt2PYiVYt8DAuSI'; // Google Maps API anahtarınızı buraya ekleyin

            return new Promise<void>((resolve, reject) => {
                const script = document.createElement('script');
                script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;
                script.async = true;
                script.defer = true;
                script.onload = () => resolve();
                script.onerror = () => reject(new Error('Google Maps yüklenemedi'));
                document.head.appendChild(script);
            });
        };

        loadGoogleMapsScript()
            .then(() => {
                if (orderId) {
                    fetchTrackingData();
                    startPolling();
                } else {
                    setError('Sipariş ID bulunamadı');
                    setLoading(false);
                }
            })
            .catch(err => {
                console.error('Google Maps yükleme hatası:', err);
                setError('Harita yüklenirken bir hata oluştu');
                setLoading(false);
            });

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, [orderId]);

    // Polling işlemi başlat
    const startPolling = () => {
        // Her 10 saniyede bir konum bilgisini güncelle
        pollIntervalRef.current = setInterval(fetchTrackingData, 10000);
    };

    // Takip verilerini getir
    const fetchTrackingData = async () => {
        if (!orderId) {
            setError(`Sipariş ID bulunamadı. URL parametresi: ${window.location.search}`);
            setLoading(false);
            return;
        }

        try {
            console.log(`Konum verisi alınıyor: /api/courier/location?orderId=${orderId}`);
            const response = await fetch(`/api/courier/location?orderId=${orderId}`);
            const responseData = await response.json();

            setDebugInfo({
                status: response.status,
                statusText: response.statusText,
                url: response.url,
                responseData
            });

            if (response.status === 401) {
                router.push('/login');
                return;
            }

            if (response.status === 403) {
                setError('Bu siparişi görüntüleme yetkiniz bulunmuyor');
                setLoading(false);
                return;
            }

            if (response.status === 404) {
                // Test API kullanarak sipariş bilgilerini kontrol et
                try {
                    const testResponse = await fetch(`/api/test-delivery?orderId=${orderId}`);
                    const testData = await testResponse.json();
                    updateDebugInfo({
                        testResponse: testData
                    });

                    if (testResponse.ok && testData.createdOrUpdatedDelivery) {
                        // Test veri oluşturulduysa yeniden dene
                        setTimeout(() => fetchTrackingData(), 1000);
                        return;
                    }
                } catch (error) {
                    const err = error as ErrorWithMessage;
                    console.error('Test API hatası:', err);
                }

                setError(`Kurye henüz konumunu paylaşmamış veya sipariş bulunamadı. Sipariş ID: ${orderId}`);
                setLoading(false);
                return;
            }

            if (!response.ok) {
                throw new Error(responseData.error || 'Sipariş takip bilgisi alınamadı');
            }

            setTrackingData(responseData);
            setLoading(false);

            // İlk yükleme veya güncellemede haritayı oluştur
            if (responseData.delivery && responseData.delivery.location) {
                initializeOrUpdateMap(responseData);
            }
        } catch (error) {
            const err = error as ErrorWithMessage;
            console.error('Takip verisi alınırken hata:', err);
            setError('Sipariş takip verileri alınırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
            setLoading(false);
        }
    };

    // Hata ayıklama bilgilerini güncellemek için yardımcı fonksiyon
    const updateDebugInfo = (newInfo: Partial<DebugInfo>) => {
        setDebugInfo((prev: DebugInfo | null) => ({
            ...prev || {},
            ...newInfo
        }));
    };

    // Harita başlatma veya güncelleme
    const initializeOrUpdateMap = (data: TrackingData) => {
        const { delivery, order } = data;

        if (!window.google?.maps || !mapRef.current) return;

        const courierLocation = delivery.location;
        const restaurantLocation = order.restaurant.location;

        // Log konum bilgilerini hata ayıklama için
        console.log('Kurye Konumu:', courierLocation);
        console.log('Restoran Konumu:', restaurantLocation);

        // Konum verilerinin doğruluğunu kontrol et
        if (!courierLocation || typeof courierLocation.lat !== 'number' || typeof courierLocation.lng !== 'number') {
            console.error('Geçersiz kurye konum bilgisi:', courierLocation);
            updateDebugInfo({
                error: 'Kurye konum bilgisi geçersiz',
                courierLocationData: courierLocation
            });
            return;
        }

        if (!restaurantLocation || typeof restaurantLocation.lat !== 'number' || typeof restaurantLocation.lng !== 'number') {
            console.error('Geçersiz restoran konum bilgisi:', restaurantLocation);
            updateDebugInfo({
                error: 'Restoran konum bilgisi geçersiz',
                restaurantLocationData: restaurantLocation
            });
            return;
        }

        // Harita yoksa oluştur
        if (!googleMapRef.current) {
            const mapOptions = {
                center: courierLocation,
                zoom: 15,
                mapTypeId: "roadmap",
                mapTypeControl: false,
            };

            try {
                // @ts-ignore
                googleMapRef.current = new window.google.maps.Map(mapRef.current, mapOptions);

                // Kurye işaretçisi
                try {
                    // @ts-ignore
                    markerRef.current = new window.google.maps.Marker({
                        position: courierLocation,
                        map: googleMapRef.current,
                        icon: {
                            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                            // @ts-ignore
                            scaledSize: new window.google.maps.Size(40, 40)
                        },
                        title: 'Kurye',
                    });
                    console.log('Kurye işaretçisi oluşturuldu');
                } catch (error) {
                    const err = error as ErrorWithMessage;
                    console.error('Kurye işaretçisi oluşturulurken hata:', err);
                }

                // Restoran işaretçisi
                try {
                    // @ts-ignore
                    restaurantMarkerRef.current = new window.google.maps.Marker({
                        position: restaurantLocation,
                        map: googleMapRef.current,
                        icon: {
                            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                            // @ts-ignore
                            scaledSize: new window.google.maps.Size(40, 40)
                        },
                        title: order.restaurant.name,
                    });
                    console.log('Restoran işaretçisi oluşturuldu');
                } catch (error) {
                    const err = error as ErrorWithMessage;
                    console.error('Restoran işaretçisi oluşturulurken hata:', err);
                }

                // Teslimat adresi işaretçisi
                try {
                    // Gelişmiş bir uygulamada, müşteri adresi için geocoding yapabilirsiniz
                    // Şimdilik basitçe İstanbul koordinatlarını kullanalım
                    // @ts-ignore
                    destinationMarkerRef.current = new window.google.maps.Marker({
                        position: { lat: 41.0082, lng: 28.9784 },
                        map: googleMapRef.current,
                        icon: {
                            url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                            // @ts-ignore
                            scaledSize: new window.google.maps.Size(40, 40)
                        },
                        title: 'Teslimat Adresi',
                    });
                    console.log('Teslimat adresi işaretçisi oluşturuldu');
                } catch (error) {
                    const err = error as ErrorWithMessage;
                    console.error('Teslimat adresi işaretçisi oluşturulurken hata:', err);
                }
            } catch (error) {
                const err = error as ErrorWithMessage;
                console.error('Harita oluşturulurken hata:', err);
                updateDebugInfo({
                    mapCreationError: err.message
                });
            }
        } else {
            // Mevcut haritada kurye konumunu güncelle
            try {
                markerRef.current?.setPosition(courierLocation);
                console.log('Kurye konumu güncellendi');

                // Harita merkezi güncelleme
                googleMapRef.current.panTo(courierLocation);
            } catch (error) {
                const err = error as ErrorWithMessage;
                console.error('Konum güncellenirken hata:', err);
                updateDebugInfo({
                    positionUpdateError: err.message
                });
            }
        }
    };

    return (
        <>
            <Header2 />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold mb-6">Sipariş Takibi</h1>

                    {loading ? (
                        <div className="text-center p-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7F0005] mx-auto"></div>
                            <p className="mt-4">Sipariş bilgileri yükleniyor...</p>
                            <p className="mt-2 text-sm text-gray-500">Sipariş ID: {orderId || 'bulunamadı'}</p>
                        </div>
                    ) : error ? (
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <p className="text-center text-red-600 mb-4">
                                {error}
                            </p>

                            {debugInfo && (
                                <div className="mt-4 p-4 bg-gray-100 rounded text-sm overflow-auto max-h-64">
                                    <h3 className="font-bold mb-2">Hata Ayıklama Bilgisi:</h3>
                                    <pre className="whitespace-pre-wrap">
                                        {JSON.stringify(debugInfo, null, 2)}
                                    </pre>
                                </div>
                            )}

                            <div className="flex justify-center mt-4 space-x-4">
                                <button
                                    onClick={() => router.push('/orders')}
                                    className="px-4 py-2 bg-[#7F0005] text-white rounded hover:bg-opacity-90"
                                >
                                    Siparişlerime Dön
                                </button>

                                <button
                                    onClick={async () => {
                                        if (!orderId) return;
                                        setLoading(true);
                                        setError(null);
                                        try {
                                            await fetch(`/api/test-delivery?orderId=${orderId}&force=true`);
                                            setTimeout(() => fetchTrackingData(), 1000);
                                        } catch (error) {
                                            const err = error as ErrorWithMessage;
                                            console.error('Test verileri oluşturulurken hata:', err);
                                            setError('Test verileri oluşturulurken bir hata oluştu');
                                            setLoading(false);
                                        }
                                    }}
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-opacity-90"
                                >
                                    Test Verileri Oluştur
                                </button>
                            </div>
                        </div>
                    ) : trackingData ? (
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="mb-4 pb-4 border-b border-gray-200">
                                <h2 className="text-xl font-semibold mb-2">Sipariş Durumu</h2>
                                <p className="text-lg">
                                    <span className={`inline-block px-3 py-1 rounded-full ${trackingData.order.status === 'TAMAMLANDI'
                                        ? 'bg-green-100 text-green-800'
                                        : trackingData.order.status === 'IPTAL_EDILDI'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {trackingData.order.status === 'YOLDA'
                                            ? 'Sipariş Yolda'
                                            : trackingData.order.status === 'TAMAMLANDI'
                                                ? 'Sipariş Teslim Edildi'
                                                : trackingData.order.status === 'IPTAL_EDILDI'
                                                    ? 'Sipariş İptal Edildi'
                                                    : 'Sipariş Hazırlanıyor'}
                                    </span>
                                </p>
                            </div>

                            {trackingData.order.status === 'YOLDA' && trackingData.order.courier && (
                                <div className="mb-4 pb-4 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold mb-2">Kurye Bilgileri</h2>
                                    <p><strong>Kurye Adı:</strong> {trackingData.order.courier.name}</p>
                                    <p><strong>Telefon:</strong> {trackingData.order.courier.phone}</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Son Güncelleme: {new Date(trackingData.delivery.updatedAt).toLocaleTimeString('tr-TR')}
                                    </p>
                                </div>
                            )}

                            <div className="mb-4">
                                <h2 className="text-xl font-semibold mb-2">Restoran Bilgileri</h2>
                                <p><strong>Restoran:</strong> {trackingData.order.restaurant.name}</p>
                                <p><strong>Adres:</strong> {trackingData.order.restaurant.address}</p>
                            </div>

                            {trackingData.delivery && trackingData.delivery.location && (
                                <div className="mt-6">
                                    <h2 className="text-xl font-semibold mb-4">Canlı Takip</h2>
                                    <div
                                        ref={mapRef}
                                        className="w-full h-[400px] rounded-lg border border-gray-300 bg-gray-100"
                                    ></div>
                                    <p className="text-sm text-gray-500 mt-2 text-center">
                                        Haritada mavi işaret kurye konumunu, kırmızı işaret restoranı ve yeşil işaret teslimat adresini göstermektedir.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <p className="text-center text-gray-600">
                                Sipariş bilgisi bulunamadı.
                            </p>
                            <div className="flex justify-center mt-4">
                                <button
                                    onClick={() => router.push('/orders')}
                                    className="px-4 py-2 bg-[#7F0005] text-white rounded hover:bg-opacity-90"
                                >
                                    Siparişlerime Dön
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
} 