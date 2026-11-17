export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome to DevBill
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Sign in to manage your API usage and billing.
        </p>

        <form className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="button"
            className="w-full rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}