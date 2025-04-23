import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/utils/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'restaurant_owner') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const orders = await prisma.order.findMany({
            where: {
                restaurantId: {
                    in: (await prisma.restaurant.findMany({
                        where: {
                            ownerId: session.user.id
                        },
                        select: {
                            id: true
                        }
                    })).map(restaurant => restaurant.id)
                }
            },
            include: {
                user: true,
                items: true
            },
            orderBy: {
                orderedAt: 'desc'
            }
        });

        return NextResponse.json(orders);
    } catch (error) {
        console.error('Siparişler getirilirken hata:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'restaurant_owner') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const body = await request.json();
        const { orderId, status } = body;

        const order = await prisma.order.update({
            where: {
                id: orderId,
                restaurantId: {
                    in: (await prisma.restaurant.findMany({
                        where: {
                            ownerId: session.user.id
                        },
                        select: {
                            id: true
                        }
                    })).map(restaurant => restaurant.id)
                }
            },
            data: {
                status
            }
        });

        return NextResponse.json(order);
    } catch (error) {
        console.error('Sipariş güncellenirken hata:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
} 