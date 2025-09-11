// 文件路径: app/api/expenses/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getServerSession } from "next-auth"

// 定义正确的上下文类型
interface Context { params: Promise<{ id: string }> }

// 删除开销
export async function DELETE(
  request: NextRequest,
  context: Context
) {
  try {
    const {id} = await context.params;
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

    const expense = await prisma.expense.findUnique({
      where: { id: id }
    })

    if (!expense) {
      return NextResponse.json(
        { error: '开销不存在' },
        { status: 404 }
      )
    }

    if (expense.settled) {
      return NextResponse.json(
        { error: '已结算的开销无法删除' },
        { status: 400 }
      )
    }

    if (expense.payerId !== currentUser.id) {
      return NextResponse.json(
        { error: '只有创建者可以删除此开销' },
        { status: 403 }
      )
    }

    await prisma.expense.delete({
      where: { id: id }
    })

    return NextResponse.json({ message: '开销删除成功' })
  } catch (error) {
    console.error('删除开销失败:', error)
    return NextResponse.json(
      { error: '删除开销失败' },
      { status: 500 }
    )
  }
}

// 编辑开销
export async function PUT(
  request: NextRequest,
  context: Context
) {
  try {
    const {id} =await context.params;
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

    const body = await request.json()
    const { amount, description, involvedUserIds } = body

    const expense = await prisma.expense.findUnique({
      where: { id: id }
    })

    if (!expense) {
      return NextResponse.json(
        { error: '开销不存在' },
        { status: 404 }
      )
    }

    if (expense.settled) {
      return NextResponse.json(
        { error: '已结算的开销无法编辑' },
        { status: 400 }
      )
    }

    if (expense.payerId !== currentUser.id) {
      return NextResponse.json(
        { error: '只有创建者可以编辑此开销' },
        { status: 403 }
      )
    }

    const splitAmount = amount / involvedUserIds.length

    const updatedExpense = await prisma.$transaction(async (tx) => {
      await tx.expenseSplit.deleteMany({
        where: { expenseId: id }
      })

      return await tx.expense.update({
        where: { id: id },
        data: {
          amount,
          description,
          splits: {
            create: involvedUserIds.map((userId: string) => ({
              userId,
              amountOwed: splitAmount
            }))
          }
        },
        include: {
          payer: true,
          splits: {
            include: {
              user: true
            }
          }
        }
      })
    })

    return NextResponse.json(updatedExpense)
  } catch (error) {
    console.error('更新开销失败:', error)
    return NextResponse.json(
      { error: '更新开销失败' },
      { status: 500 }
    )
  }
}

// 获取单个开销详情
export async function GET(
  request: NextRequest,
  context: Context
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    const expense = await prisma.expense.findUnique({
      where: { id:id },
      include: {
        payer: true,
        splits: {
          include: {
            user: true
          }
        }
      }
    })

    if (!expense) {
      return NextResponse.json(
        { error: '开销不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json(expense)
  } catch (error) {
    console.error('获取开销详情失败:', error)
    return NextResponse.json(
      { error: '获取开销详情失败' },
      { status: 500 }
    )
  }
}