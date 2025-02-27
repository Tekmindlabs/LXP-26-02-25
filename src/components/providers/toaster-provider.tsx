'use client';

import { Toaster } from "sonner";

export function ToasterProvider() {
	return (
		<Toaster
			expand={false}
			richColors
			closeButton
			position="top-right"
			duration={4000}
		/>
	);
}
