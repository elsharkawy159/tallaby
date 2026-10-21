export default function ProfileLoading() {
  return (
    <div className="space-y-6">
      <div className="bg-background rounded-lg p-6">
        <div className="animate-pulse">
          <div className="flex items-center space-x-4 mb-4">
            <div className="h-16 w-16 bg-foreground/10 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-foreground/10 rounded w-32"></div>
              <div className="h-3 bg-foreground/10 rounded w-48"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-2 bg-foreground/10 rounded w-full"></div>
            <div className="h-3 bg-foreground/10 rounded w-24"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
