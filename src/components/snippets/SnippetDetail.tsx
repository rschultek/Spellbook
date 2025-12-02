import { useState } from "react";
import { Button } from "../ui/button";
import { toast } from "../../lib/utils/toast";
import type { SnippetResponseDto } from "../../types";
import { getSupabaseBrowserClient } from "../../lib/utils/supabase-browser";
import CodeBlock from "./CodeBlock";

interface Props {
  snippet: SnippetResponseDto;
}

export default function SnippetDetail({ snippet }: Props) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <a href="/snippets" className="text-blue-600 hover:underline">
          ← Back to snippets
        </a>
        <div className="flex gap-2">
          <a href={`/snippets/${snippet.id}/edit`}>
            <Button variant="outline">Edit</Button>
          </a>
          <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
            Delete
          </Button>
        </div>
      </div>

      {/* Title and Language */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{snippet.title}</h1>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="font-medium">{snippet.language}</span>
          <span>Created {formatDate(snippet.created_at)}</span>
          {snippet.updated_at !== snippet.created_at && <span>Updated {formatDate(snippet.updated_at)}</span>}
        </div>
      </div>

      {/* Description */}
      {snippet.description && <p className="text-gray-700 mb-6">{snippet.description}</p>}

      {/* Tags */}
      {snippet.tags && snippet.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {snippet.tags.map((tag) => (
            <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Content */}
      <CodeBlock code={snippet.content} language={snippet.language as import("../../types").SnippetLanguage} />

      {/* Delete Modal - Simple version */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Delete Snippet</h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete &quot;<strong>{snippet.title}</strong>&quot;? This action cannot be
              undone.
            </p>
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  try {
                    const { SnippetsService } = await import("../../lib/services/snippets.service");
                    const service = new SnippetsService(getSupabaseBrowserClient());
                    await service.delete(snippet.id);
                    toast.success("Snippet deleted successfully!");
                    window.location.href = "/snippets";
                  } catch {
                    toast.error("Failed to delete snippet");
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
