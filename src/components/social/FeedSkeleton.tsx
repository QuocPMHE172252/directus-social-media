"use client";

import React from 'react';

export function FeedSkeleton() {
	return (
		<div className="animate-pulse space-y-3">
			<div className="flex items-center space-x-3">
				<div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-neutral-800" />
				<div className="space-y-2 flex-1">
					<div className="h-3 w-28 rounded bg-gray-200 dark:bg-neutral-800" />
					<div className="h-2 w-16 rounded bg-gray-200 dark:bg-neutral-800" />
				</div>
			</div>
			<div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-neutral-800" />
			<div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-neutral-800" />
			<div className="h-48 w-full rounded-md bg-gray-200 dark:bg-neutral-800" />
			<div className="h-9 w-full rounded-md bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800" />
		</div>
	);
} 