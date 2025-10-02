import { InfiniteFeed } from '@/components/social/InfiniteFeed';

export default function FeedPage() {
  return (
    <div className="mx-auto w-full max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl px-2 sm:px-4 overflow-x-hidden">
      <InfiniteFeed />
    </div>
  );
}
