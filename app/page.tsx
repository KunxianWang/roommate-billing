'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'
import LoginButton from '@/components/LoginButton'
import ExpenseForm from '@/components/ExpenseForm'
import Dashboard from '@/components/Dashboard'
import ExpenseList from '@/components/ExpenseList'
import SettlementHistory from '@/components/SettlementHistory'
import UserManagement from '@/components/UserManagement'

export default function Home() {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState('dashboard')

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
            室友账单 AA 制
          </h1>
          <p className="text-gray-600 text-center mb-8">
            使用 Google 账户登录，轻松管理共同开销
          </p>
          <LoginButton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">室友账单管理</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {session.user?.name || session.user?.email}
              </span>
              <LoginButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              {['dashboard', 'add-expense', 'expenses', 'settlements', 'users'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-6 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'dashboard' && '账单总览'}
                  {tab === 'add-expense' && '添加开销'}
                  {tab === 'expenses' && '开销列表'}
                  {tab === 'settlements' && '结算管理'}
                  {tab === 'users' && '用户管理'}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'add-expense' && <ExpenseForm />}
            {activeTab === 'expenses' && <ExpenseList />}
            {activeTab === 'settlements' && <SettlementHistory />}
            {activeTab === 'users' && <UserManagement />}
          </div>
        </div>
      </main>
    </div>
  )
}-4 w-4 text-blue-600"
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
                            className="h