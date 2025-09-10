'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface BalanceData {
  user: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  }
  amount: number
}

interface DashboardData {
  iOwe: BalanceData[]
  othersOwe: BalanceData[]
  netBalances: BalanceData[]
}

export default function Dashboard() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard')
      if (response.ok) {
        const dashboardData = await response.json()
        setData(dashboardData)
      }
    } catch (error) {
      console.error('获取仪表盘数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-500">
        无法加载数据
      </div>
    )
  }

  const totalIOwe = data.iOwe.reduce((sum, item) => sum + item.amount, 0)
  const totalOthersOwe = data.othersOwe.reduce((sum, item) => sum + item.amount, 0)
  const netBalance = totalOthersOwe - totalIOwe

  return (
    <div className="space-y-6">
      {/* 总览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 rounded-lg p-6 border border-red-200">
          <h3 className="text-sm font-medium text-red-800 mb-2">我欠别人</h3>
          <p className="text-2xl font-bold text-red-900">
            ¥{totalIOwe.toFixed(2)}
          </p>
        </div>
        
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <h3 className="text-sm font-medium text-green-800 mb-2">别人欠我</h3>
          <p className="text-2xl font-bold text-green-900">
            ¥{totalOthersOwe.toFixed(2)}
          </p>
        </div>
        
        <div className={`rounded-lg p-6 border ${
          netBalance >= 0 
            ? 'bg-blue-50 border-blue-200' 
            : 'bg-orange-50 border-orange-200'
        }`}>
          <h3 className={`text-sm font-medium mb-2 ${
            netBalance >= 0 ? 'text-blue-800' : 'text-orange-800'
          }`}>
            净额
          </h3>
          <p className={`text-2xl font-bold ${
            netBalance >= 0 ? 'text-blue-900' : 'text-orange-900'
          }`}>
            {netBalance >= 0 ? '+' : ''}¥{netBalance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* 详细列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 我欠别人的 */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">我需要支付</h3>
          </div>
          <div className="p-6">
            {data.iOwe.length === 0 ? (
              <p className="text-gray-500 text-center py-4">暂无欠款</p>
            ) : (
              <div className="space-y-3">
                {data.iOwe.map((item) => (
                  <div key={item.user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {item.user.image && (
                        <img
                          src={item.user.image}
                          alt={item.user.name || ''}
                          className="h-10 w-10 rounded-full"
                        />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.user.name || item.user.email}
                        </p>
                        <p className="text-xs text-gray-500">需支付</p>
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-red-600">
                      ¥{item.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 别人欠我的 */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">待收款项</h3>
          </div>
          <div className="p-6">
            {data.othersOwe.length === 0 ? (
              <p className="text-gray-500 text-center py-4">暂无待收款</p>
            ) : (
              <div className="space-y-3">
                {data.othersOwe.map((item) => (
                  <div key={item.user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {item.user.image && (
                        <img
                          src={item.user.image}
                          alt={item.user.name || ''}
                          className="h-10 w-10 rounded-full"
                        />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.user.name || item.user.email}
                        </p>
                        <p className="text-xs text-gray-500">应付给我</p>
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-green-600">
                      ¥{item.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 净额汇总 */}
      {data.netBalances.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">净额汇总</h3>
            <p className="text-sm text-gray-500 mt-1">考虑双向欠款后的实际结算金额</p>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {data.netBalances.map((item) => (
                <div key={item.user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {item.user.image && (
                      <img
                        src={item.user.image}
                        alt={item.user.name || ''}
                        className="h-10 w-10 rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.user.name || item.user.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.amount > 0 ? '应收' : item.amount < 0 ? '应付' : '已结清'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-lg font-semibold ${
                    item.amount > 0 ? 'text-green-600' : item.amount < 0 ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {item.amount > 0 ? '+' : ''}¥{Math.abs(item.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}