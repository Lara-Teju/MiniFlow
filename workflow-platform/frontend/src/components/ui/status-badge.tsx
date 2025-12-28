// src/components/ui/status-badge.tsx
import * as React from "react"
import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react"

interface StatusBadgeProps {
  status: 'success' | 'failed' | 'running' | 'pending';
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

export function StatusBadge({ 
  status, 
  size = 'md', 
  showIcon = true,
  className 
}: StatusBadgeProps) {
  const icons = {
    success: CheckCircle2,
    failed: XCircle,
    running: Loader2,
    pending: Clock
  };

  const colors = {
    success: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    running: 'bg-blue-100 text-blue-800',
    pending: 'bg-gray-100 text-gray-800'
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1'
  };

  const Icon = icons[status];

  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        colors[status],
        sizes[size],
        className
      )}
    >
      {showIcon && <Icon className={cn(size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5', status === 'running' && 'animate-spin')} />}
      <span className="capitalize">{status}</span>
    </span>
  );
}
