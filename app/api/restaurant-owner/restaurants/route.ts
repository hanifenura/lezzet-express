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

        const restaurants = await prisma.restaurant.findMany({
            where: {
                ownerId: session.user.id
            },
            include: {
                menu: true
            }
        });

        return NextResponse.json(restaurants);
    } catch (error) {
        console.error('Restoranlar getirilirken hata:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
} 