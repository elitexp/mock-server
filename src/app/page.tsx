import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl">
            Mock API Server
          </h1>
          <p className="mt-6 text-xl text-gray-600">
            Create and manage configurable mock API endpoints with domain-based routing,
            authentication, and dynamic response matching.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/dashboard"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/auth/login"
              className="bg-gray-200 text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Login
            </Link>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              User Management
            </h3>
            <p className="text-gray-600">
              Complete authentication and authorization system with JWT tokens and user roles.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Domain-Based Routing
            </h3>
            <p className="text-gray-600">
              Configure multiple domains and only accept requests from authorized domains.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Configurable Endpoints
            </h3>
            <p className="text-gray-600">
              Create GET, POST, DELETE, OPTIONS endpoints with custom headers, cookies, and body matching.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Dynamic Responses
            </h3>
            <p className="text-gray-600">
              Multiple responses per endpoint with condition matching based on headers, cookies, and body.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Database Storage
            </h3>
            <p className="text-gray-600">
              All configurations stored in database with Prisma ORM for data management.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              SSR Support
            </h3>
            <p className="text-gray-600">
              Built with Next.js App Router for server-side rendering and optimal performance.
            </p>
          </div>
        </div>

        <div className="mt-20 bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Quick Start
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900">1. Register an Account</h3>
              <p className="text-gray-600">Create a user account to start managing your mock APIs.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">2. Add a Domain</h3>
              <p className="text-gray-600">Configure the domains that will be accepted by your mock server.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">3. Create Endpoints</h3>
              <p className="text-gray-600">Define API endpoints with specific paths and HTTP methods.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">4. Configure Responses</h3>
              <p className="text-gray-600">Set up responses with conditions based on headers, cookies, or request body.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">5. Test Your API</h3>
              <p className="text-gray-600">Make requests to <code className="bg-gray-100 px-2 py-1 rounded">/api/mock/your-endpoint</code> with the appropriate domain header.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
