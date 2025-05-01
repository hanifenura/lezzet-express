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

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'restaurant_owner') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const body = await request.json();
        const { name, description, address, phone } = body;

        const restaurant = await prisma.restaurant.create({
            data: {
                name,
                description,
                address,
                phone,
                ownerId: session.user.id,
                rating: 0,
                image: null,
                location: {
                    lat: 0,
                    lng: 0
                }
            }
        });

        return NextResponse.json(restaurant);
    } catch (error) {
        console.error('Restoran eklenirken hata:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'restaurant_owner') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const body = await request.json();
        const { id, name, description, address, phone } = body;

        const restaurant = await prisma.restaurant.update({
            where: {
                id,
                ownerId: session.user.id
            },
            data: {
                name,
                description,
                address,
                phone
            }
        });

        return NextResponse.json(restaurant);
    } catch (error) {
        console.error('Restoran güncellenirken hata:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
} 