import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route' // 导入 authOptions
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    // 验证 CRON_SECRET
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      )
    }

    // 获取所有未结算的开销
    const unsettledExpenses = await prisma.expense.findMany({
      where: { settled: false },
      include: {
        splits: true
      }
    })

    if (unsettledExpenses.length === 0) {
      return NextResponse.json({ message: '没有需要结算的账单' })
    }

    // 计算每个用户的净差额
    const userBalances: Record<string, number> = {}
    
    unsettledExpenses.forEach(expense => {
      // 支付人获得正余额
      userBalances[expense.payerId] = (userBalances[expense.payerId] || 0) + expense.amount
      
      // 分摊人产生负余额
      expense.splits.forEach(split => {
        userBalances[split.userId] = (userBalances[split.userId] || 0) - split.amountOwed
      })
    })

    // 简化债务算法
    const settlements: Array<{ from: string, to: string, amount: number }> = []
    const creditors: Array<{ userId: string, amount: number }> = []
    const debtors: Array<{ userId: string, amount: number }> = []

    Object.entries(userBalances).forEach(([userId, balance]) => {
      if (balance > 0.01) {
        creditors.push({ userId, amount: balance })
      } else if (balance < -0.01) {
        debtors.push({ userId, amount: -balance })
      }
    })

    // 贪心算法简化债务
    creditors.sort((a, b) => b.amount - a.amount)
    debtors.sort((a, b) => b.amount - a.amount)

    let i = 0, j = 0
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i]
      const debtor = debtors[j]
      
      const settleAmount = Math.min(creditor.amount, debtor.amount)
      
      if (settleAmount > 0.01) {
        settlements.push({
          from: debtor.userId,
          to: creditor.userId,
          amount: Math.round(settleAmount * 100) / 100
        })
      }
      
      creditor.amount -= settleAmount
      debtor.amount -= settleAmount
      
      if (creditor.amount < 0.01) i++
      if (debtor.amount < 0.01) j++
    }

    // 使用事务处理结算
    await prisma.$transaction(async (tx) => {
      // 创建结算记录
      if (settlements.length > 0) {
        await tx.settlement.createMany({
          data: settlements.map(s => ({
            fromUserId: s.from,
            toUserId: s.to,
            amount: s.amount
          }))
        })
      }

      // 标记所有开销为已结算
      await tx.expense.updateMany({
        where: {
          id: {
            in: unsettledExpenses.map(e => e.id)
          }
        },
        data: {
          settled: true,
          settledAt: new Date()
        }
      })
    })

    return NextResponse.json({
      message: '结算成功',
      settlements,
      expensesSettled: unsettledExpenses.length
    })
  } catch (error) {
    console.error('结算失败:', error)
    return NextResponse.json(
      { error: '结算失败' },
      { status: 500 }
    )
  }
}
