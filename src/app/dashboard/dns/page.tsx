'use client'

import { useEffect, useState } from 'react'

interface DnsStatus {
  status: 'available' | 'partial' | 'not_configured'
  message: string
  available: boolean
  configDirAvailable: boolean
  setupInstructions: string
}

export default function DnsManagementPage() {
  const [dnsStatus, setDnsStatus] = useState<DnsStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [restarting, setRestarting] = useState(false)
  const [error, setError] = useState('')

  const fetchDnsStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/dns', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setDnsStatus(data)
      } else {
        setError('Failed to fetch DNS status')
      }
    } catch (_err) {
      setError('Failed to fetch DNS status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDnsStatus()
  }, [fetchDnsStatus])

  const restartDnsmasq = async () => {
    setRestarting(true)
    setError('')
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/dns', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'restart' })
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('dnsmasq restart initiated successfully')
      } else {
        setError(data.message || 'Failed to restart dnsmasq')
      }
    } catch (_err) {
      setError('Failed to restart dnsmasq')
    } finally {
      setRestarting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-800 bg-green-100'
      case 'partial': return 'text-yellow-800 bg-yellow-100'
      case 'not_configured': return 'text-red-800 bg-red-100'
      default: return 'text-gray-800 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-8">
          <div className="text-gray-500">Loading DNS status...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">DNS Management</h1>
        <p className="mt-2 text-gray-600">
          Configure automatic DNS resolution for your mock domains
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={() => setError('')}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {dnsStatus && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(dnsStatus.status)}`}>
                    {dnsStatus.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{dnsStatus.message}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">dnsmasq Available:</span>
                  <span className={`text-sm ${dnsStatus.available ? 'text-green-600' : 'text-red-600'}`}>
                    {dnsStatus.available ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Config Directory:</span>
                  <span className={`text-sm ${dnsStatus.configDirAvailable ? 'text-green-600' : 'text-red-600'}`}>
                    {dnsStatus.configDirAvailable ? '✓ Available' : '✗ Not Available'}
                  </span>
                </div>
              </div>

              {dnsStatus.available && (
                <div className="pt-4">
                  <button
                    onClick={restartDnsmasq}
                    disabled={restarting}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {restarting ? 'Restarting...' : 'Restart dnsmasq'}
                  </button>
                  <p className="mt-2 text-xs text-gray-500">
                    Restart dnsmasq to apply configuration changes
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Setup Instructions</h2>
            
            <div className="text-sm text-gray-700">
              <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded-md text-xs overflow-x-auto">
                {dnsStatus.setupInstructions}
              </pre>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">How It Works</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>• When you add a domain (e.g., &quot;api.facebook.com&quot;), it&apos;s automatically added to dnsmasq configuration</p>
          <p>• dnsmasq will resolve the domain to your local mock server (127.0.0.1:3001)</p>
          <p>• Domains ending in &quot;.test&quot; are preserved and not modified</p>
          <p>• When you delete a domain, it&apos;s automatically removed from dnsmasq</p>
          <p>• No need to manually edit hosts files or restart services</p>
        </div>
      </div>
    </div>
  )
}
