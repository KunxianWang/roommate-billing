import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getServerSession } from "next-auth"

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
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

    // 检查是否为管理员（可以设置第一个用户为管理员）
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // 检查要删除的用户是否有未结算的账单
    const hasUnsettledExpenses = await prisma.expense.count({
      where: {
        OR: [
          { payerId: params.id, settled: false },
          { splits: { some: { userId: params.id } }, settled: false }
        ]
      }
    })

    if (hasUnsettledExpenses > 0) {
      return NextResponse.json(
        { error: '该用户有未结算的账单，请先结算后再删除' },
        { status: 400 }
      )
    }

    // 删除用户（级联删除会自动处理相关记录）
    await prisma.user.delete({
      where: { id: params.id }
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