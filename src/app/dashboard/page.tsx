export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mock API Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage your domains, endpoints, and responses
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Domains</h3>
            <p className="text-gray-600 mb-4">
              Manage your API domains and their configurations.
            </p>
            <a
              href="/dashboard/domains"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Manage Domains
            </a>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Test</h3>
            <p className="text-gray-600 mb-4">
              Test your configured endpoints quickly.
            </p>
            <a
              href="/dashboard/test"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Test Endpoints
            </a>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Documentation</h3>
            <p className="text-gray-600 mb-4">
              View API documentation and examples.
            </p>
            <a
              href="/dashboard/docs"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
            >
              View Docs
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">How It Works</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Quick Start Guide:</h4>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Create a new domain (e.g., api.example.com)</li>
                  <li>Add endpoints to your domain (e.g., GET /api/v1/users)</li>
                  <li>Configure responses with conditions and content</li>
                  <li>Test your endpoints using the configured domain</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Key Features:</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>Domain-based routing:</strong> Route requests based on domain</li>
                  <li>• <strong>Conditional responses:</strong> Match headers, cookies, query params</li>
                  <li>• <strong>Priority system:</strong> Control which response is returned</li>
                  <li>• <strong>Authentication:</strong> Secure your mock server</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h4 className="font-semibold text-blue-900 mb-3">Example Usage:</h4>
          <div className="bg-white rounded-lg p-4 font-mono text-sm">
            <div className="text-gray-600 mb-2"># Create a domain and endpoint, then test:</div>
            <div className="text-blue-600">curl -H "Host: api.example.com" http://localhost:3001/api/v1/hello</div>
          </div>
        </div>
      </div>
    </div>
  )
}
