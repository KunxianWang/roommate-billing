import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route' // 导入 authOptions
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
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

    // 获取我欠别人的钱
    const iOweRaw = await prisma.expenseSplit.findMany({
      where: {
        userId: currentUser.id,
        expense: {
          settled: false,
          payerId: {
            not: currentUser.id
          }
        }
      },
      include: {
        expense: {
          include: {
            payer: true
          }
        }
      }
    })

    // 获取别人欠我的钱
    const othersOweRaw = await prisma.expense.findMany({
      where: {
        payerId: currentUser.id,
        settled: false
      },
      include: {
        splits: {
          where: {
            userId: {
              not: currentUser.id
            }
          },
          include: {
            user: true
          }
        }
      }
    })

    // 整理我欠别人的数据
    const iOwe: Record<string, { user: any, amount: number }> = {}
    iOweRaw.forEach(split => {
      const payerId = split.expense.payerId
      if (!iOwe[payerId]) {
        iOwe[payerId] = {
          user: split.expense.payer,
          amount: 0
        }
      }
      iOwe[payerId].amount += split.amountOwed
    })

    // 整理别人欠我的数据
    const othersOwe: Record<string, { user: any, amount: number }> = {}
    othersOweRaw.forEach(expense => {
      expense.splits.forEach(split => {
        const userId = split.userId
        if (!othersOwe[userId]) {
          othersOwe[userId] = {
            user: split.user,
            amount: 0
          }
        }
        othersOwe[userId].amount += split.amountOwed
      })
    })

    // 计算净额
    const netBalances: Record<string, { user: any, amount: number }> = {}
    
    // 处理我欠别人的
    Object.entries(iOwe).forEach(([userId, data]) => {
      netBalances[userId] = {
        user: data.user,
        amount: -data.amount // 负数表示我欠别人
      }
    })

    // 处理别人欠我的
    Object.entries(othersOwe).forEach(([userId, data]) => {
      if (netBalances[userId]) {
        netBalances[userId].amount += data.amount
      } else {
        netBalances[userId] = {
          user: data.user,
          amount: data.amount // 正数表示别人欠我
        }
      }
    })

    return NextResponse.json({
      iOwe: Object.values(iOwe),
      othersOwe: Object.values(othersOwe),
      netBalances: Object.values(netBalances)
    })
  } catch (error) {
    console.error('获取仪表盘数据失败:', error)
    return NextResponse.json(
      { error: '获取仪表盘数据失败' },
      { status: 500 }
    )
  }
}
