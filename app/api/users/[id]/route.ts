// 文件路径: app/api/users/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getServerSession } from "next-auth"

// 定义正确的上下文类型
interface Context {
  params: {
    id: string
  }
}

export async function DELETE(
  request: NextRequest,
  context: Context
) {
  try {
    const id = context.params.id;

    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    const hasUnsettledExpenses = await prisma.expense.count({
      where: {
        OR: [
          { payerId: id, settled: false },
          { splits: { some: { userId: id } }, settled: false }
        ]
      }
    })

    if (hasUnsettledExpenses > 0) {
      return NextResponse.json(
        { error: '该用户有未结算的账单，请先结算后再删除' },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id: id }
    })

    return NextResponse.json({ message: '用户删除成功' })
  } catch (error) {
    console.error('删除用户失败:', error)
    return NextResponse.json(
      { error: '删除用户失败' },
      { status: 500 }
    )
  }
}