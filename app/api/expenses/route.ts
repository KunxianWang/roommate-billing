import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getServerSession } from "next-auth"
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { amount, description, involvedUserIds } = body

    // 验证输入
    if (!amount || !description || !involvedUserIds?.length) {
      return NextResponse.json(
        { error: '请填写所有必填字段' },
        { status: 400 }
      )
    }

    // 获取当前用户
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // 计算每个人的分摊金额
    const splitAmount = amount / involvedUserIds.length

    // 使用事务创建开销记录
    const expense = await prisma.$transaction(async (tx) => {
      // 创建开销记录
      const newExpense = await tx.expense.create({
        data: {
          amount,
          description,
          payerId: currentUser.id,
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

      return newExpense
    })

    return NextResponse.json(expense)
  } catch (error) {
    console.error('创建开销失败:', error)
    return NextResponse.json(
      { error: '创建开销失败' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    // 获取所有未结算的开销
    const expenses = await prisma.expense.findMany({
      where: {
        settled: false
      },
      include: {
        payer: true,
        splits: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error('获取开销列表失败:', error)
    return NextResponse.json(
      { error: '获取开销列表失败' },
      { status: 500 }
    )
  }
}