'use client'

export default function LoginPage() {
  const handleLogin = () => {
    // Use direct browser navigation to avoid CORS issues with OAuth
    window.location.href = '/api/auth/login'
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">ログイン</h1>
        <p className="text-gray-600">Shopify Customer Accountでログイン</p>
      </div>
      
      <button
        onClick={handleLogin}
        className="w-full rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800"
      >
        ログイン
      </button>
    </div>
  )
}
