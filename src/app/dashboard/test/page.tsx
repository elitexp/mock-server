'use client'

import { useEffect, useState } from 'react'

interface Domain {
  id: string
  name: string
  endpoints: Array<{
    id: string
    path: string
    method: string
  }>
}

function TestPage() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [selectedDomain, setSelectedDomain] = useState('')
  const [selectedEndpoint, setSelectedEndpoint] = useState('')
  const [testUrl, setTestUrl] = useState('')
  const [testMethod, setTestMethod] = useState('GET')
  const [testHeaders, setTestHeaders] = useState('{}')
  const [testBody, setTestBody] = useState('')
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDomains()
  }, [])

  const fetchDomains = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/domains?include=endpoints', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched domains:', data) // Debug log
        setDomains(data.domains || data)
      }
    } catch (err) {
      setError('Failed to load domains')
    }
  }

  const handleDomainChange = (domainId: string) => {
    setSelectedDomain(domainId)
    setSelectedEndpoint('')
    const domain = domains.find(d => d.id === domainId)
    if (domain) {
          setTestUrl('http://localhost:3000')
    }
  }

  const handleEndpointChange = (endpointId: string) => {
    setSelectedEndpoint(endpointId)
    const domain = domains.find(d => d.id === selectedDomain)
    const endpoint = domain?.endpoints?.find(e => e.id === endpointId)
    if (endpoint) {
      setTestMethod(endpoint.method)
      setTestUrl(`http://localhost:3000${endpoint.path}`)
      console.log('Selected endpoint:', endpoint) // Debug log
    }
  }

  const testEndpoint = async () => {
    setLoading(true)
    setError('')
    setResponse(null)

    try {
      const domain = domains.find(d => d.id === selectedDomain)
      if (!domain) {
        throw new Error('Domain not found')
      }

      console.log('Testing URL:', testUrl, 'with domain:', domain.name) // Debug log

      let headers: any = {
        'x-mock-domain': domain.name,
      }

      // Parse additional headers
      try {
        if (testHeaders.trim()) {
          const additionalHeaders = JSON.parse(testHeaders)
          headers = { ...headers, ...additionalHeaders }
        }
      } catch {
        throw new Error('Invalid JSON in headers')
      }

      const options: RequestInit = {
        method: testMethod,
        headers,
      }

      if (testMethod !== 'GET' && testMethod !== 'HEAD' && testBody.trim()) {
        options.body = testBody
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/json'
        }
      }

      const startTime = Date.now()
      const response = await fetch(testUrl, options)
      const endTime = Date.now()

      const responseHeaders: any = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      let responseBody = ''
      let isJsonResponse = false
      try {
        responseBody = await response.text()
        // Try to parse and format JSON responses
        if (response.headers.get('content-type')?.includes('application/json') || 
            responseBody.trim().startsWith('{') || responseBody.trim().startsWith('[')) {
          try {
            const jsonData = JSON.parse(responseBody)
            responseBody = JSON.stringify(jsonData, null, 2)
            isJsonResponse = true
          } catch {
            // Keep as text if JSON parsing fails
          }
        }
      } catch {
        responseBody = '[Unable to read response body]'
      }

      setResponse({
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseBody,
        isJson: isJsonResponse,
        time: endTime - startTime
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Test Endpoints</h1>
        <p className="mt-2 text-gray-600">
          Test your configured mock API endpoints
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Configuration</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Domain
              </label>
              <select
                value={selectedDomain}
                onChange={(e) => handleDomainChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="">Select a domain</option>
                {domains.map(domain => (
                  <option key={domain.id} value={domain.id}>{domain.name}</option>
                ))}
              </select>
              <div className="mt-1 text-xs text-gray-500">
                Loaded {domains.length} domain(s)
              </div>
            </div>

            {selectedDomain && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endpoint
                </label>
                <select
                  value={selectedEndpoint}
                  onChange={(e) => handleEndpointChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">Select an endpoint</option>
                  {domains.find(d => d.id === selectedDomain)?.endpoints?.map(endpoint => (
                    <option key={endpoint.id} value={endpoint.id}>
                      {endpoint.method} {endpoint.path}
                    </option>
                  ))}
                </select>
                <div className="mt-1 text-xs text-gray-500">
                  Available endpoints: {domains.find(d => d.id === selectedDomain)?.endpoints?.length || 0}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL
              </label>
              <input
                type="text"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="http://localhost:3000/api/endpoint"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-mono"
              />
              <div className="mt-1 text-xs text-gray-500">
                Selected Domain: {domains.find(d => d.id === selectedDomain)?.name || 'None'} | 
                Selected Endpoint: {selectedEndpoint ? 
                  (() => {
                    const domain = domains.find(d => d.id === selectedDomain);
                    const endpoint = domain?.endpoints?.find(e => e.id === selectedEndpoint);
                    return endpoint ? `${endpoint.method} ${endpoint.path}` : 'Unknown';
                  })()
                  : 'None'
                }
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Method
              </label>
              <select
                value={testMethod}
                onChange={(e) => setTestMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
                <option value="OPTIONS">OPTIONS</option>
                <option value="HEAD">HEAD</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Headers (JSON)
              </label>
              <textarea
                value={testHeaders}
                onChange={(e) => setTestHeaders(e.target.value)}
                placeholder='{"Content-Type": "application/json"}'
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-mono text-sm"
              />
            </div>

            {(testMethod === 'POST' || testMethod === 'PUT' || testMethod === 'PATCH') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Request Body
                </label>
                <textarea
                  value={testBody}
                  onChange={(e) => setTestBody(e.target.value)}
                  placeholder='{"key": "value"}'
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-mono text-sm"
                />
              </div>
            )}

            <button
              onClick={testEndpoint}
              disabled={loading || !testUrl}
              className="w-full bg-blue-600 text-white py-3 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Send Request'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Response</h2>
          
          {!response ? (
            <div className="text-center py-8 text-gray-500">
              Configure and send a request to see the response
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-4 text-sm">
                <span className={`px-3 py-1 rounded font-medium ${
                  response.status >= 200 && response.status < 300 ? 'bg-green-100 text-green-800' :
                  response.status >= 400 && response.status < 500 ? 'bg-yellow-100 text-yellow-800' :
                  response.status >= 500 ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {response.status} {response.statusText}
                </span>
                <span className="text-gray-500">{response.time}ms</span>
              </div>

              {Object.keys(response.headers).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Response Headers:</h3>
                  <pre className="bg-gray-50 p-3 rounded-md text-xs overflow-x-auto text-gray-800">
{JSON.stringify(response.headers, null, 2)}
                  </pre>
                </div>
              )}

              {response.body && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Response Body:</h3>
                  <pre className={`bg-gray-50 p-3 rounded-md text-sm overflow-x-auto max-h-96 overflow-y-auto text-gray-800 ${
                    response.isJson ? 'font-mono' : ''
                  }`}>
{response.body}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TestPage
