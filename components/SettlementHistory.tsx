'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Settlement {
  id: string
  amount: number
  createdAt: string
  completed: boolean
  completedAt: string | null
  fromUser: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  }
  toUser: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  }
}

export default function SettlementHistory() {
  const { data: session } = useSession()
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [loading, setLoading] = useState(true)
  const [settling, setSettling] = useState(false)

  useEffect(() => {
    fetchSettlements()
  }, [])

  const fetchSettlements = async () => {
    try {
      const response = await fetch('/api/settlements')
      if (response.ok) {
        const data = await response.json()
        setSettlements(data)
      }
    } catch (error) {
      console.error('获取结算历史失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSettle = async () => {
    if (!confirm('确定要结算所有未结算的账单吗？')) return

    setSettling(true)
    try {
      const response = await fetch('/api/settle', {
        method: 'POST'
      })

      if (response.ok) {
        const result = await response.json()
        alert(`结算成功！共结算 ${result.expensesSettled} 笔开销，总金额 ¥${result.totalAmount?.toFixed(2) || '0.00'}`)
        fetchSettlements()
        // 刷新其他数据
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.error || '结算失败')
      }
    } catch (error) {
      alert('结算失败，请重试')
    } finally {
      setSettling(false)
    }
  }

  const markAsCompleted = async (settlementId: string) => {
    try {
      const response = await fetch('/api/settlements', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settlementId })
      })

      if (response.ok) {
        alert('已标记为完成')
        fetchSettlements()
      }
    } catch (error) {
      alert('操作失败')
    }
  }

  const currentUserEmail = session?.user?.email

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // 分组结算记录
  const pendingSettlements = settlements.filter(s => !s.completed)
  const completedSettlements = settlements.filter(s => s.completed)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">结算管理</h2>
        <button
          onClick={handleSettle}
          disabled={settling}
          className={`px-4 py-2 text-white rounded-md ${
            settling 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {settling ? '结算中...' : '立即结算'}
        </button>
      </div>

      {/* 待支付 */}
      {pendingSettlements.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">待支付</h3>
          <div className="space-y-3">
            {pendingSettlements.map((settlement) => (
              <div key={settlement.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {settlement.fromUser.image && (
                        <img
                          src={settlement.fromUser.image}
                          alt={settlement.fromUser.name || ''}
                          className="h-8 w-8 rounded-full"
                        />
                      )}
                      <span className="font-medium">
                        {settlement.fromUser.name || settlement.fromUser.email}
                        {settlement.fromUser.email === currentUserEmail && ' (我)'}
                      </span>
                    </div>
                    <span className="text-gray-500">→</span>
                    <div className="flex items-center space-x-2">
                      {settlement.toUser.image && (
                        <img
                          src={settlement.toUser.image}
                          alt={settlement.toUser.name || ''}
                          className="h-8 w-8 rounded-full"
                        />
                      )}
                      <span className="font-medium">
                        {settlement.toUser.name || settlement.toUser.email}
                        {settlement.toUser.email === currentUserEmail && ' (我)'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xl font-bold text-yellow-800">
                      ¥{settlement.amount.toFixed(2)}
                    </span>
                    {(settlement.fromUser.email === currentUserEmail || 
                      settlement.toUser.email === currentUserEmail) && (
                      <button
                        onClick={() => markAsCompleted(settlement.id)}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        标记已支付
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  创建于 {new Date(settlement.createdAt).toLocaleDateString('zh-CN')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 已完成 */}
      {completedSettlements.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">已完成</h3>
          <div className="space-y-3">
            {completedSettlements.map((settlement) => (
              <div key={settlement.id} className="bg-green-50 border border-green-200 rounded-lg p-4 opacity-75">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {settlement.fromUser.image && (
                        <img
                          src={settlement.fromUser.image}
                          alt={settlement.fromUser.name || ''}
                          className="h-8 w-8 rounded-full"
                        />
                      )}
                      <span className="font-medium">
                        {settlement.fromUser.name || settlement.fromUser.email}
                      </span>
                    </div>
                    <span className="text-gray-500">→</span>
                    <div className="flex items-center space-x-2">
                      {settlement.toUser.image && (
                        <img
                          src={settlement.toUser.image}
                          alt={settlement.toUser.name || ''}
                          className="h-8 w-8 rounded-full"
                        />
                      )}
                      <span className="font-medium">
                        {settlement.toUser.name || settlement.toUser.email}
                      </span>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-green-800">
                    ¥{settlement.amount.toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  完成于 {settlement.completedAt && new Date(settlement.completedAt).toLocaleDateString('zh-CN')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {settlements.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          暂无结算记录
        </div>
      )}
    </div>
  )
}