'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface ResponseCondition {
  id: string
  type: string
  key: string
  operator: string
  value: string
}

interface EndpointResponse {
  id: string
  statusCode: number
  headers?: any
  body?: string
  priority: number
  isDefault: boolean
  conditions: ResponseCondition[]
  createdAt: string
}

interface Endpoint {
  id: string
  path: string
  method: string
  domain: {
    name: string
  }
}

export default function EndpointResponsesPage() {
  const router = useRouter()
  const params = useParams()
  const domainId = params.id as string
  const endpointId = params.endpointId as string

  const [endpoint, setEndpoint] = useState<Endpoint | null>(null)
  const [responses, setResponses] = useState<EndpointResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    statusCode: 200,
    headers: '{}',
    responseData: '{}',
    priority: 0
  })
  const [conditions, setConditions] = useState<Array<{
    type: string
    key: string
    operator: string
    value: string
  }>>([])
  const [creating, setCreating] = useState(false)

  const conditionTypes = ['header', 'cookie', 'query', 'body']
  const operators = ['equals', 'contains', 'startsWith', 'endsWith', 'exists']

  useEffect(() => {
    if (domainId && endpointId) {
      fetchEndpointAndResponses()
    }
  }, [domainId, endpointId])

  const fetchEndpointAndResponses = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`/api/domains/${domainId}/endpoints/${endpointId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token')
          router.push('/auth/login')
          return
        }
        throw new Error('Failed to fetch endpoint')
      }

      const data = await response.json()
      setEndpoint(data.endpoint)
      setResponses(data.endpoint.responses || [])
    } catch (err) {
      setError('Failed to load endpoint and responses')
    } finally {
      setLoading(false)
    }
  }

  const createResponse = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    
    try {
      const token = localStorage.getItem('token')
      
      // Parse headers
      let headers = {}
      try {
        if (createForm.headers.trim()) {
          headers = JSON.parse(createForm.headers)
        }
      } catch {
        throw new Error('Invalid JSON in headers field')
      }

      // Parse responseData
      let responseData = {}
      try {
        if (createForm.responseData.trim()) {
          responseData = JSON.parse(createForm.responseData)
        }
      } catch {
        throw new Error('Invalid JSON in responseData field')
      }

      const response = await fetch(`/api/domains/${domainId}/endpoints/${endpointId}/responses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: createForm.name,
          statusCode: createForm.statusCode,
          headers,
          responseData,
          priority: createForm.priority,
          conditions
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create response')
      }

      setShowCreateModal(false)
      setCreateForm({
        name: '',
        statusCode: 200,
        headers: '{}',
        responseData: '{}',
        priority: 0
      })
      setConditions([])
      fetchEndpointAndResponses()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create response')
    } finally {
      setCreating(false)
    }
  }

  const deleteResponse = async (responseId: string) => {
    if (!confirm('Are you sure you want to delete this response?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/domains/${domainId}/endpoints/${endpointId}/responses/${responseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete response')
      }

      fetchEndpointAndResponses()
    } catch (err) {
      setError('Failed to delete response')
    }
  }

  const addCondition = () => {
    setConditions([...conditions, {
      type: 'header',
      key: '',
      operator: 'equals',
      value: ''
    }])
  }

  const updateCondition = (index: number, field: string, value: string) => {
    const updated = [...conditions]
    updated[index] = { ...updated[index], [field]: value }
    setConditions(updated)
  }

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading responses...</p>
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
              {endpoint?.method} {endpoint?.path} - Responses
            </h1>
            <p className="mt-2 text-gray-600">
              Domain: {endpoint?.domain?.name}
            </p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => router.push(`/dashboard/domains/${domainId}`)}
              className="bg-gray-600 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-700"
            >
              Back to Endpoints
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700"
            >
              Create Response
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

        {responses.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No responses configured</h3>
            <p className="text-gray-600 mb-4">Create your first response for this endpoint</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700"
            >
              Create First Response
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {responses.map((response) => (
              <div key={response.id} className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 text-sm font-medium rounded ${
                        response.statusCode >= 200 && response.statusCode < 300 ? 'bg-green-100 text-green-800' :
                        response.statusCode >= 400 && response.statusCode < 500 ? 'bg-yellow-100 text-yellow-800' :
                        response.statusCode >= 500 ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {response.statusCode}
                      </span>
                      <span className="text-sm text-gray-500">Priority: {response.priority}</span>
                      {response.isDefault && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => deleteResponse(response.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>

                  {response.conditions && response.conditions.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Conditions:</h4>
                      <div className="space-y-2">
                        {response.conditions.map((condition, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded-md text-sm">
                            <span className="font-medium text-gray-700">{condition.type}</span>
                            <span className="text-gray-500 mx-2">'{condition.key}'</span>
                            <span className="font-medium text-gray-700">{condition.operator}</span>
                            <span className="text-gray-500 mx-2">'{condition.value}'</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {response.headers && Object.keys(response.headers).length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Headers:</h4>
                      <pre className="bg-gray-50 p-3 rounded-md text-sm text-gray-800 overflow-x-auto">
                        {JSON.stringify(response.headers, null, 2)}
                      </pre>
                    </div>
                  )}

                  {response.body && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Response Body:</h4>
                      <pre className="bg-gray-50 p-3 rounded-md text-sm text-gray-800 overflow-x-auto max-h-64 overflow-y-auto">
                        {response.body}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Response Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Response</h2>
              <form onSubmit={createResponse} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Response Name *
                  </label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Default Success Response"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status Code *
                    </label>
                    <input
                      type="number"
                      value={createForm.statusCode}
                      onChange={(e) => setCreateForm({ ...createForm, statusCode: parseInt(e.target.value) })}
                      min="100"
                      max="599"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <input
                      type="number"
                      value={createForm.priority}
                      onChange={(e) => setCreateForm({ ...createForm, priority: parseInt(e.target.value) })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Response Headers (JSON)
                  </label>
                  <textarea
                    value={createForm.headers}
                    onChange={(e) => setCreateForm({ ...createForm, headers: e.target.value })}
                    placeholder='{"Content-Type": "application/json"}'
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Response Data (JSON) *
                  </label>
                  <textarea
                    value={createForm.responseData}
                    onChange={(e) => setCreateForm({ ...createForm, responseData: e.target.value })}
                    placeholder='{"message": "Success", "data": {}}'
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-mono text-sm"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Response Conditions
                    </label>
                    <button
                      type="button"
                      onClick={addCondition}
                      className="bg-green-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-green-700"
                    >
                      Add Condition
                    </button>
                  </div>
                  {conditions.map((condition, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-3 p-3 bg-gray-50 rounded-md">
                      <select
                        value={condition.type}
                        onChange={(e) => updateCondition(index, 'type', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                      >
                        {conditionTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={condition.key}
                        onChange={(e) => updateCondition(index, 'key', e.target.value)}
                        placeholder="Key"
                        className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                      />
                      <select
                        value={condition.operator}
                        onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                      >
                        {operators.map(op => (
                          <option key={op} value={op}>{op}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={condition.value}
                        onChange={(e) => updateCondition(index, 'value', e.target.value)}
                        placeholder="Value"
                        className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                      />
                      <button
                        type="button"
                        onClick={() => removeCondition(index)}
                        className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      setCreateForm({
                        name: '',
                        statusCode: 200,
                        headers: '{}',
                        responseData: '{}',
                        priority: 0
                      })
                      setConditions([])
                    }}
                    className="flex-1 bg-gray-600 text-white py-3 rounded-md font-medium hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create Response'}
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
