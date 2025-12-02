import type { SnippetResponseDto } from "../../types";

interface Props {
  snippet: SnippetResponseDto;
}

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: "bg-yellow-100 text-yellow-800",
  TypeScript: "bg-blue-100 text-blue-800",
  Python: "bg-green-100 text-green-800",
  PHP: "bg-purple-100 text-purple-800",
  Bash: "bg-gray-100 text-gray-800",
  CSS: "bg-pink-100 text-pink-800",
  HTML: "bg-orange-100 text-orange-800",
  JSON: "bg-teal-100 text-teal-800",
  MySQL: "bg-indigo-100 text-indigo-800",
  Note: "bg-amber-100 text-amber-800",
  Other: "bg-slate-100 text-slate-800",
};

export default function SnippetCard({ snippet }: Props) {
  const colorClass = LANGUAGE_COLORS[snippet.language] || LANGUAGE_COLORS.Other;
  const preview = snippet.content.substring(0, 150);
  const needsEllipsis = snippet.content.length > 150;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <a
      href={`/snippets/${snippet.id}`}
      className="block p-6 bg-white border rounded-lg hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold truncate flex-1">{snippet.title}</h3>
        <span className={`px-2 py-1 text-xs rounded-full ${colorClass}`}>{snippet.language}</span>
      </div>

      {snippet.description && <p className="text-gray-600 text-sm mb-3">{snippet.description}</p>}

      <pre className="bg-gray-50 p-3 rounded text-xs font-mono overflow-hidden mb-3">
        <code className="text-gray-700">
          {preview}
          {needsEllipsis && "..."}
        </code>
      </pre>

      {snippet.tags && snippet.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {snippet.tags.map((tag) => (
            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500">Created {formatDate(snippet.created_at)}</p>
    </a>
  );
}
