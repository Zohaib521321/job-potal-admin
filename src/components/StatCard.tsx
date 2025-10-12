interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'success' | 'error';
}

export default function StatCard({ title, value, icon, trend, color = 'primary' }: StatCardProps) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    error: 'bg-error/10 text-error',
  };

  return (
    <div className="bg-surface rounded-lg p-6 shadow-lg border border-accent hover:border-primary/50 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-text-secondary text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-foreground">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
      
      {trend && (
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium ${
              trend.isPositive ? 'text-success' : 'text-error'
            }`}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-text-secondary text-sm">vs last month</span>
        </div>
      )}
    </div>
  );
}

