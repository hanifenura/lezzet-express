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

        const reviews = await prisma.review.findMany({
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
                user: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(reviews);
    } catch (error) {
        console.error('Yorumlar getirilirken hata:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'restaurant_owner') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const reviewId = searchParams.get('id');

        if (!reviewId) {
            return NextResponse.json({ error: 'Yorum ID\'si gerekli' }, { status: 400 });
        }

        const review = await prisma.review.delete({
            where: {
                id: reviewId,
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
            }
        });

        return NextResponse.json(review);
    } catch (error) {
        console.error('Yorum silinirken hata:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
} 