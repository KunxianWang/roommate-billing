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
}