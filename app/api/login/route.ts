import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        // Kullanıcıyı veritabanında bul
        const user = await prisma.user.findFirst({
            where: { email },
            select: { id: true, email: true, phoneNumber: true, password: true },
        });

        if (!user || user.password !== password) {
            return NextResponse.json({ error: "Geçersiz kimlik bilgileri" }, { status: 401 });
        }

        return NextResponse.json({ message: "Giriş başarılı", user }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
    }
}
