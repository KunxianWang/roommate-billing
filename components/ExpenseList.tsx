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

interface User {
  id: string
  name: string | null
  email: string | null
  image: string | null
}

export default function ExpenseList() {
  const { data: session } = useSession()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unsettled' | 'settled'>('unsettled')
  const [editingExpense, setEditingExpense] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    amount: '',
    description: '',
    involvedUserIds: [] as string[]
  })
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    fetchExpenses()
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('获取用户列表失败:', error)
    }
  }

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

  const handleDelete = async (expenseId: string) => {
    if (!confirm('确定要删除这笔开销吗？')) return

    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('删除成功')
        fetchExpenses()
      } else {
        const error = await response.json()
        alert(error.error || '删除失败')
      }
    } catch (error) {
      alert('删除失败，请重试')
    }
  }

  const startEdit = (expense: Expense) => {
    setEditingExpense(expense.id)
    setEditForm({
      amount: expense.amount.toString(),
      description: expense.description,
      involvedUserIds: expense.splits.map(s => s.userId)
    })
  }

  const cancelEdit = () => {
    setEditingExpense(null)
    setEditForm({
      amount: '',
      description: '',
      involvedUserIds: []
    })
  }

  const handleUpdate = async (expenseId: string) => {
    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(editForm.amount),
          description: editForm.description,
          involvedUserIds: editForm.involvedUserIds
        })
      })

      if (response.ok) {
        alert('更新成功')
        cancelEdit()
        fetchExpenses()
      } else {
        const error = await response.json()
        alert(error.error || '更新失败')
      }
    } catch (error) {
      alert('更新失败，请重试')
    }
  }

  const filteredExpenses = expenses.filter(expense => {
    if (filter === 'all') return true
    if (filter === 'unsettled') return !expense.settled
    if (filter === 'settled') return expense.settled
    return true
  })

  const currentUserEmail = session?.user?.email
  const currentUser = users.find(u => u.email === currentUserEmail)

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
              {editingExpense === expense.id ? (
                // 编辑模式
                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        描述
                      </label>
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        金额
                      </label>
                      <input
                        type="number"
                        value={editForm.amount}
                        onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        分摊人员
                      </label>
                      <div className="space-y-2 border border-gray-200 rounded-md p-3 max-h-40 overflow-y-auto">
                        {users.map(user => (
                          <label key={user.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={editForm.involvedUserIds.includes(user.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditForm({
                                    ...editForm,
                                    involvedUserIds: [...editForm.involvedUserIds, user.id]
                                  })
                                } else {
                                  setEditForm({
                                    ...editForm,
                                    involvedUserIds: editForm.involvedUserIds.filter(id => id !== user.id)
                                  })
                                }
                              }}
                              className="h-4 w-4 text-blue-600"
                            />
                            <span className="text-sm">{user.name || user.email}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(expense.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        保存
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // 显示模式
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

                    {/* 操作按钮 */}
                    {!expense.settled && expense.payer.id === currentUser?.id && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => startEdit(expense)}
                          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded hover:bg-blue-50"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50"
                        >
                          删除
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}