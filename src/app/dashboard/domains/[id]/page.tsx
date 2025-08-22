'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Endpoint {
  id: string
  path: string
  method: string
  description?: string
  createdAt: string
  _count?: {
    responses: number
  }
}

interface Domain {
  id: string
  name: string
  description?: string
}

export default function DomainEndpointsPage() {
  const router = useRouter()
  const params = useParams()
  const domainId = params.id as string

  const [domain, setDomain] = useState<Domain | null>(null)
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({ 
    path: '', 
    method: 'GET', 
    description: '' 
  })
  const [creating, setCreating] = useState(false)

  const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']

  useEffect(() => {
    if (domainId) {
      fetchDomainAndEndpoints()
    }
  }, [domainId])

  const fetchDomainAndEndpoints = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      // Fetch domain details
      const domainResponse = await fetch(`/api/domains/${domainId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!domainResponse.ok) {
        if (domainResponse.status === 401) {
          localStorage.removeItem('token')
          router.push('/auth/login')
          return
        }
        throw new Error('Failed to fetch domain')
      }

      const domainData = await domainResponse.json()
      setDomain(domainData.domain)
      setEndpoints(domainData.domain.endpoints || [])
    } catch (_err) {
      setError('Failed to load domain and endpoints')
    } finally {
      setLoading(false)
    }
  }

  const createEndpoint = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/domains/${domainId}/endpoints`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createForm)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create endpoint')
      }

      setShowCreateModal(false)
      setCreateForm({ path: '', method: 'GET', description: '' })
      fetchDomainAndEndpoints()
    } catch (_err) {
      setError(_err instanceof Error ? _err.message : 'Failed to create endpoint')
    } finally {
      setCreating(false)
    }
  }

  const deleteEndpoint = async (endpointId: string, path: string) => {
    if (!confirm(`Are you sure you want to delete endpoint "${path}"?`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/domains/${domainId}/endpoints/${endpointId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete endpoint')
      }

      fetchDomainAndEndpoints()
    } catch (_err) {
      setError('Failed to delete endpoint')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading endpoints...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {domain?.name} - Endpoints
            </h1>
            <p className="mt-2 text-gray-600">
              Manage API endpoints for this domain
            </p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/dashboard/domains')}
              className="bg-gray-600 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-700"
            >
              Back to Domains
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700"
            >
              Create Endpoint
            </button>
          </div>
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

        {endpoints.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No endpoints yet</h3>
            <p className="text-gray-600 mb-4">Create your first endpoint for this domain</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700"
            >
              Create First Endpoint
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {endpoints.map((endpoint) => (
              <div key={endpoint.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                        endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                        endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                        endpoint.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {endpoint.method}
                      </span>
                      <span className="text-lg font-semibold text-gray-900">
                        {endpoint.path}
                      </span>
                    </div>
                    {endpoint.description && (
                      <p className="text-gray-600 mb-4">{endpoint.description}</p>
                    )}
                    <div className="flex items-center text-sm text-gray-500 space-x-6">
                      <span>
                        Responses: {endpoint._count?.responses || 0}
                      </span>
                      <span>
                        Created: {new Date(endpoint.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => router.push(`/dashboard/domains/${domainId}/endpoints/${endpoint.id}`)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                    >
                      Manage Responses
                    </button>
                    <button
                      onClick={() => deleteEndpoint(endpoint.id, endpoint.path)}
                      className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Endpoint Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Endpoint</h2>
              <form onSubmit={createEndpoint}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    HTTP Method *
                  </label>
                  <select
                    value={createForm.method}
                    onChange={(e) => setCreateForm({ ...createForm, method: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  >
                    {httpMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Endpoint Path *
                  </label>
                  <input
                    type="text"
                    value={createForm.path}
                    onChange={(e) => setCreateForm({ ...createForm, path: e.target.value })}
                    placeholder="e.g., /api/v1/users"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="Optional description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      setCreateForm({ path: '', method: 'GET', description: '' })
                    }}
                    className="flex-1 bg-gray-600 text-white py-2 rounded-md font-medium hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
