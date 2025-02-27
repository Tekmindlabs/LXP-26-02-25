import { Button } from "./button";

interface ErrorDisplayProps {
  error: Error;
  onRetry?: () => void;
}

export const ErrorDisplay = ({ error, onRetry }: ErrorDisplayProps) => {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center">
        <div className="text-lg font-semibold text-destructive">Error</div>
        <div className="text-sm text-muted-foreground mb-4">
          {error.message || "An unexpected error occurred. Please try again later."}
        </div>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}; 