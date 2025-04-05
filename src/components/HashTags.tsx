interface HashTagsProps {
  keywords: string[];
}

export default function HashTags({ keywords }: HashTagsProps) {
  console.log("HashTags 컴포넌트 keywords:", keywords);

  if (!keywords || keywords.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 my-4">
      {keywords.map((keyword) => (
        <span
          key={keyword}
          className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors cursor-pointer"
        >
          #{keyword}
        </span>
      ))}
    </div>
  );
}
