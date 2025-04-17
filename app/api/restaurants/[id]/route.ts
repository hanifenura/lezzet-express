import { NextResponse } from "next/server";
import prisma from "@/app/utils/prisma";

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: params.id },
            include: { menu: true },
        });

        if (!restaurant) {
            return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
        }

        return NextResponse.json(restaurant);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch restaurant" },
            { status: 500 }
        );
    }
}