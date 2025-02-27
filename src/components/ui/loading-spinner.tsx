export const LoadingSpinner = () => {
	return (
		<div className="flex items-center justify-center min-h-[200px]">
			<div className="text-center">
				<div className="text-lg font-semibold">Loading...</div>
				<div className="text-sm text-muted-foreground">Please wait while we fetch the data</div>
			</div>
		</div>
	);
};