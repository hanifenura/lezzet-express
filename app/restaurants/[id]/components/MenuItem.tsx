'use client';

import { useCart } from '@/app/context/CartContext';

interface MenuItemProps {
    item: {
        id: string;
        name: string;
        price: number;
        description: string;
        image: string;
    };
}

export default function MenuItem({ item }: MenuItemProps) {
    const { addToCart } = useCart();

    const handleAddToCart = () => {
        addToCart({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1
        });
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
            <div className="p-4">
                <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                <div className="flex items-center justify-between">
                    <span className="font-bold text-lg">{item.price.toFixed(2)} ₺</span>
                    <button
                        onClick={handleAddToCart}
                        className="px-4 py-2 bg-[#7F0005] text-white rounded-lg hover:bg-opacity-90 transition-colors"
                    >
                        Sepete Ekle
                    </button>
                </div>
            </div>
        </div>
    );
}
