import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getServerSession } from "next-auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    const settlements = await prisma.settlement.findMany({
      include: {
        fromUser: true,
        toUser: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(settlements)
  } catch (error) {
    console.error('获取结算历史失败:', error)
    return NextResponse.json(
      { error: '获取结算历史失败' },
      { status: 500 }
    )
  }
}

// 标记结算为已完成
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    const { settlementId } = await request.json()

    const settlement = await prisma.settlement.update({
      where: { id: settlementId },
      data: {
        completed: true,
        completedAt: new Date()
      }
    })

    return NextResponse.json(settlement)
  } catch (error) {
    console.error('更新结算状态失败:', error)
    return NextResponse.json(
      { error: '更新结算状态失败' },
      { status: 500 }
    )
  }
}