import Image from "next/image";
import { fetchPostById } from "@/lib/social/fetchers";
import { ReactionBar } from "@/components/social/ReactionBar";
import CommentList from "@/components/social/CommentList";

type PageProps = { params: { id: string } };

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = params;
  const post = await fetchPostById(id);
  
  return (
    <div className="container mx-auto px-4 py-6 space-y-4">
      <h1 className="text-2xl font-semibold">{post.title ?? `Post ${post.id}`}</h1>
      {post.content ? <p className="text-sm text-muted-foreground whitespace-pre-wrap">{post.content}</p> : null}
      
      {/* Hiển thị ảnh/video nếu có */}
      {post.image ? (
        <div className="relative w-full overflow-hidden rounded-md border" style={{ aspectRatio: "16 / 9" }}>
          <Image 
            src={`/api/image-proxy?id=${post.image}`} 
            alt={post.title ?? "post image"} 
            fill 
            className="object-cover" 
          />
        </div>
      ) : null}
      
      <div className="text-xs text-muted-foreground">
        {post.createdAt ? new Date(post.createdAt).toLocaleString() : null}
      </div>
      
      <ReactionBar postId={post.id} />
      
      <div className="rounded-md border p-4">
        <h2 className="text-base font-semibold mb-2">Comments</h2>
        <CommentList postId={post.id} />
      </div>
    </div>
  );
}