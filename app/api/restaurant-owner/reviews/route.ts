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

        // Önce restoran sahibinin tüm restoranlarını bulalım
        const restaurants = await prisma.restaurant.findMany({
            where: {
                ownerId: session.user.id
            },
            select: {
                id: true,
                name: true,
                rating: true,
                image: true,
            }
        });

        // Restoran ID'lerini alalım
        const restaurantIds = restaurants.map(restaurant => restaurant.id);

        // Tüm restoranlar için yorumları toplu olarak çekelim
        const reviews = await prisma.review.findMany({
            where: {
                restaurantId: {
                    in: restaurantIds
                }
            },
            include: {
                user: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Her restoran için yorumları gruplandıralım
        const restaurantsWithReviews = restaurants.map(restaurant => {
            // Bu restorana ait yorumları filtrele
            const restaurantReviews = reviews.filter(review => review.restaurantId === restaurant.id);

            return {
                ...restaurant,
                reviews: restaurantReviews
            };
        });

        return NextResponse.json(restaurantsWithReviews);
    } catch (error) {
        console.error('Yorumlar getirilirken hata:', error);
        return NextResponse.json(
            {
                error: 'Yorumlar getirilirken bir hata oluştu',
                details: error instanceof Error ? error.message : 'Bilinmeyen hata'
            },
            { status: 500 }
        );
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