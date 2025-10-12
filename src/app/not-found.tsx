import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

export default function NotFound() {
  return (
    <div className="flex">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-primary mb-4">404</h1>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Page Not Found
            </h2>
            <p className="text-text-secondary text-lg mb-8">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <Link
            href="/"
            className="inline-block bg-primary text-background font-semibold px-8 py-3 rounded-lg hover:bg-primary-dark transition-all duration-200"
          >
            Back to Dashboard
          </Link>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/"
              className="bg-surface rounded-lg p-6 hover:border hover:border-primary transition-all duration-200"
            >
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-foreground font-semibold mb-2">Dashboard</h3>
              <p className="text-text-secondary text-sm">View overview</p>
            </Link>

            <Link
              href="/jobs"
              className="bg-surface rounded-lg p-6 hover:border hover:border-primary transition-all duration-200"
            >
              <div className="text-4xl mb-3">💼</div>
              <h3 className="text-foreground font-semibold mb-2">Jobs</h3>
              <p className="text-text-secondary text-sm">Manage jobs</p>
            </Link>

            <Link
              href="/categories"
              className="bg-surface rounded-lg p-6 hover:border hover:border-primary transition-all duration-200"
            >
              <div className="text-4xl mb-3">🏷️</div>
              <h3 className="text-foreground font-semibold mb-2">Categories</h3>
              <p className="text-text-secondary text-sm">Manage categories</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

