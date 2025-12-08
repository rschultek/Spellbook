import type { SnippetResponseDto } from "../../types";

interface Props {
  snippet: SnippetResponseDto;
}

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: "bg-yellow-500/10 text-yellow-500 ring-1 ring-yellow-500/20",
  TypeScript: "bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20",
  Python: "bg-green-500/10 text-green-500 ring-1 ring-green-500/20",
  PHP: "bg-purple-500/10 text-purple-500 ring-1 ring-purple-500/20",
  Bash: "bg-zinc-500/10 text-zinc-400 ring-1 ring-zinc-500/20",
  CSS: "bg-pink-500/10 text-pink-500 ring-1 ring-pink-500/20",
  HTML: "bg-orange-500/10 text-orange-500 ring-1 ring-orange-500/20",
  JSON: "bg-teal-500/10 text-teal-500 ring-1 ring-teal-500/20",
  MySQL: "bg-indigo-500/10 text-indigo-500 ring-1 ring-indigo-500/20",
  Note: "bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20",
  Other: "bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/20",
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
      className="block p-6 bg-card border rounded-lg hover:shadow-lg transition-all hover:bg-card/80 hover:border-primary/50 group"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold truncate flex-1 text-card-foreground group-hover:text-primary transition-colors">
          {snippet.title}
        </h3>
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colorClass}`}>{snippet.language}</span>
      </div>

      {snippet.description && <p className="text-muted-foreground text-sm mb-3">{snippet.description}</p>}

      <pre className="bg-black/30 p-3 rounded text-xs font-mono overflow-hidden mb-3 border border-white/10">
        <code className="text-blue-100/90">
          {preview}
          {needsEllipsis && "..."}
        </code>
      </pre>

      {snippet.tags && snippet.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {snippet.tags.map((tag) => (
            <span key={tag} className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">Created {formatDate(snippet.created_at)}</p>
    </a>
  );
}
