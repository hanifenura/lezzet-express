import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Oturum açmanız gerekiyor' },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Kullanıcı bulunamadı' },
                { status: 404 }
            );
        }

        const orders = await prisma.order.findMany({
            where: { userId: user.id },
            include: {
                items: {
                    include: {
                        menu: true
                    }
                }
            },
            orderBy: {
                orderedAt: 'desc',
            },
        });

        // Restoran bilgilerini ayrıca al
        const restaurantIds = [...new Set(orders.map(order => order.restaurantId))];
        const restaurants = await prisma.restaurant.findMany({
            where: {
                id: { in: restaurantIds }
            },
            select: {
                id: true,
                name: true
            }
        });

        const restaurantMap = new Map(restaurants.map(r => [r.id, r]));

        const formattedOrders = orders.map((order) => ({
            id: order.id,
            restaurantId: order.restaurantId,
            restaurantName: restaurantMap.get(order.restaurantId)?.name || 'Bilinmeyen Restoran',
            items: order.items.map((item) => ({
                id: item.id,
                name: item.menu.name,
                price: item.price,
                quantity: item.quantity,
            })),
            totalPrice: order.totalPrice,
            status: order.status,
            orderedAt: order.orderedAt,
            deliveryAddress: order.deliveryAddress,
        }));

        return NextResponse.json(formattedOrders);
    } catch (error) {
        console.error('Siparişler alınırken hata:', error);
        return NextResponse.json(
            { error: 'Bir hata oluştu' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Oturum bulunamadı' },
                { status: 401 }
            );
        }

        const { items, totalAmount, restaurantId, deliveryAddress } = await request.json();

        // Adres bilgilerini string formatına dönüştür
        const formattedAddress = `${deliveryAddress.fullName}, ${deliveryAddress.address}, ${deliveryAddress.district}/${deliveryAddress.city}, Tel: ${deliveryAddress.phone}`;

        // Siparişi oluştur
        const order = await prisma.order.create({
            data: {
                userId: session.user.id,
                restaurantId,
                totalPrice: totalAmount,
                status: 'PENDING',
                paymentMethod: 'CREDIT_CARD',
                deliveryAddress: formattedAddress,
                items: {
                    create: items.map((item: any) => ({
                        menuId: item.id,
                        quantity: item.quantity,
                        price: item.price
                    }))
                }
            },
            include: {
                items: true
            }
        });

        return NextResponse.json(order);
    } catch (error) {
        console.error('Sipariş oluşturulurken hata:', error);
        return NextResponse.json(
            { error: 'Sipariş oluşturulamadı' },
            { status: 500 }
        );
    }
} 