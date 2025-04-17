import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/app/utils/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: 'Oturum bulunamadı' },
                { status: 401 }
            );
        }

        if (session.user?.role !== 'admin') {
            return NextResponse.json(
                { error: 'Bu işlem için yetkiniz yok' },
                { status: 403 }
            );
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error('Kullanıcılar getirilirken hata:', error);
        return NextResponse.json(
            { error: 'Kullanıcılar getirilirken bir hata oluştu' },
            { status: 500 }
        );
    }
} 