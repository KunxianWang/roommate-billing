'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface ExpenseSplit {
  id: string
  userId: string
  amountOwed: number
  user: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  }
}

interface Expense {
  id: string
  amount: number
  description: string
  createdAt: string
  settled: boolean
  payer: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  }
  splits: ExpenseSplit[]
}

export default function ExpenseList() {
  const { data: session } = useSession()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unsettled' | 'settled'>('unsettled')

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/expenses')
      if (response.ok) {
        const data = await response.json()
        setExpenses(data)
      }
    } catch (error) {
      console.error('获取开销列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredExpenses = expenses.filter(expense => {
    if (filter === 'all') return true
    if (filter === 'unsettled') return !expense.settled
    if (filter === 'settled') return expense.settled
    return true
  })

  const currentUserEmail = session?.user?.email

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">开销记录</h2>
        <div className="flex gap-2">
          {(['unsettled', 'settled', 'all'] as const).map((value) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                filter === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {value === 'all' && '全部'}
              {value === 'unsettled' && '未结算'}
              {value === 'settled' && '已结算'}
            </button>
          ))}
        </div>
      </div>

      {filteredExpenses.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          暂无{filter === 'unsettled' ? '未结算' : filter === 'settled' ? '已结算' : ''}开销记录
        </div>
      ) : (
        <div className="space-y-4">
          {filteredExpenses.map((expense) => (
            <div
              key={expense.id}
              className={`bg-white rounded-lg border ${
                expense.settled ? 'border-gray-200 opacity-75' : 'border-gray-300'
              } overflow-hidden`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {expense.description}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(expense.createdAt).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      ¥{expense.amount.toFixed(2)}
                    </p>
                    {expense.settled && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                        已结算
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center mb-3">
                    <span className="text-sm font-medium text-gray-700 mr-2">支付人：</span>
                    <div className="flex items-center space-x-2">
                      {expense.payer.image && (
                        <img
                          src={expense.payer.image}
                          alt={expense.payer.name || ''}
                          className="h-6 w-6 rounded-full"
                        />
                      )}
                      <span className="text-sm text-gray-900">
                        {expense.payer.name || expense.payer.email}
                        {expense.payer.email === currentUserEmail && ' (我)'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-gray-700">分摊明细：</span>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {expense.splits.map((split) => (
                        <div
                          key={split.id}
                          className="flex items-center justify-between bg-gray-50 rounded px-3 py-2"
                        >
                          <div className="flex items-center space-x-2">
                            {split.user.image && (
                              <img
                                src={split.user.image}
                                alt={split.user.name || ''}
                                className="h-5 w-5 rounded-full"
                              />
                            )}
                            <span className="text-sm text-gray-700">
                              {split.user.name || split.user.email}
                              {split.user.email === currentUserEmail && ' (我)'}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            ¥{split.amountOwed.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}