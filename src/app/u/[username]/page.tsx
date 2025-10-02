type PageProps = { params: { username: string } };

export default async function UserProfilePage({ params }: PageProps) {
	const { username } = params;
	return (
		<div className="container mx-auto px-4 py-6">
			<h1 className="text-2xl font-semibold mb-4">Profile</h1>
			<div className="rounded-md border p-4">Username: {username}</div>
			{/* TODO: Profile header, tabs, posts */}
		</div>
	);
} 