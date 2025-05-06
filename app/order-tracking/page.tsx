'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header2 from '@/components/Header2';
import Footer from '@/components/Footer';

export default function OrderTrackingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Burada sipariş takip verilerini yükleyeceğiz
        setLoading(false);
    }, []);

    return (
        <>
            <Header2 />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold mb-6">Sipariş Takibi</h1>

                    {loading ? (
                        <div className="text-center">
                            <p>Yükleniyor...</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <p className="text-center text-gray-600">
                                Sipariş takip sistemi yakında aktif olacaktır.
                            </p>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
} 