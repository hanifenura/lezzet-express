'use client';

import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import RestaurantHeader from "./components/RestaurantHeader";
import Categories from "./components/Categories";
import MenuItem from "./components/MenuItem";
import Header2 from "@/components/Header2";
import Footer from "@/components/Footer";
import { CartProvider } from "@/app/context/CartContext";
import { useState } from "react";

const prisma = new PrismaClient();

export default async function RestaurantDetailPage({ params }: { params: { id: string } }) {
    const restaurant = await prisma.restaurant.findUnique({
        where: { id: params.id },
        include: { menu: true },
    });

    if (!restaurant) return notFound();

    return (
        <CartProvider>
            <RestaurantDetailContent restaurant={restaurant} />
        </CartProvider>
    );
}

function RestaurantDetailContent({ restaurant }: { restaurant: any }) {
    const [selectedCategory, setSelectedCategory] = useState('');

    const filteredMenu = selectedCategory
        ? restaurant.menu.filter((item: any) => item.category === selectedCategory)
        : restaurant.menu;

    return (
        <>
            <Header2 />
            <main className="container mx-auto px-4 py-8">
                <RestaurantHeader restaurant={restaurant} />
                <Categories
                    categories={[...new Set(restaurant.menu.map((item: any) => item.category))]}
                    selectedCategory={selectedCategory}
                    onCategorySelect={setSelectedCategory}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMenu.map((item: any) => (
                        <MenuItem key={item.id} item={item} />
                    ))}
                </div>
            </main>
            <Footer />
        </>
    );
}
