import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSnippetSchema } from "../../lib/validation/snippet.schemas";
import { SnippetsService } from "../../lib/services/snippets.service";
import { Button } from "../ui/button";
import { toast } from "../../lib/utils/toast";
import { SNIPPET_LANGUAGES } from "../../types";
import type { CreateSnippetDto, SnippetLanguage, SnippetResponseDto } from "../../types";
import { getSupabaseBrowserClient } from "../../lib/utils/supabase-browser";

interface Props {
  mode: "create" | "edit";
  initialData?: SnippetResponseDto;
}

export default function SnippetForm({ mode, initialData }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createSnippetSchema),
    defaultValues: initialData
      ? {
          title: initialData.title,
          content: initialData.content,
          language: initialData.language as SnippetLanguage,
          description: initialData.description,
          tags: initialData.tags || [],
        }
      : {
          title: "",
          content: "",
          language: "Other" as SnippetLanguage,
          description: "",
          tags: [],
        },
  });

  const onSubmit = async (data: CreateSnippetDto) => {
    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in to create a snippet");
      }

      const service = new SnippetsService(supabase);

      const dto: CreateSnippetDto = {
        title: data.title,
        content: data.content,
        language: data.language,
        description: data.description || null,
        tags: data.tags || [],
      };

      if (mode === "create") {
        await service.create(dto, user.id);
        toast.success("Snippet created successfully!");
        window.location.href = "/snippets";
      } else {
        if (initialData?.id) {
          await service.update(initialData.id, dto);
          toast.success("Snippet updated successfully!");
          window.location.href = `/snippets/${initialData.id}`;
        } else {
          throw new Error("Missing snippet ID for update");
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(`Failed to ${mode} snippet`);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Title *
        </label>
        <input
          {...register("title")}
          type="text"
          id="title"
          className="w-full px-3 py-2 border rounded-md"
          placeholder="My awesome snippet"
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message as string}</p>}
      </div>

      {/* Language */}
      <div>
        <label htmlFor="language" className="block text-sm font-medium mb-1">
          Language *
        </label>
        <select
          {...register("language")}
          id="language"
          className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
        >
          {SNIPPET_LANGUAGES.map((lang) => (
            <option key={lang} value={lang} className="bg-background text-foreground">
              {lang}
            </option>
          ))}
        </select>
        {errors.language && <p className="text-red-500 text-sm mt-1">{errors.language.message as string}</p>}
      </div>

      {/* Content */}
      <div>
        <label htmlFor="content" className="block text-sm font-medium mb-1">
          Content *
        </label>
        <textarea
          {...register("content")}
          id="content"
          rows={15}
          className="w-full px-3 py-2 border rounded-md font-mono text-sm"
          placeholder="Enter your code or note here..."
        />
        {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content.message as string}</p>}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Description <span className="text-gray-500">(optional)</span>
        </label>
        <textarea
          {...register("description")}
          id="description"
          rows={3}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Brief description of this snippet..."
          maxLength={500}
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message as string}</p>}
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="tags" className="block text-sm font-medium mb-1">
          Tags <span className="text-gray-500">(optional, comma-separated)</span>
        </label>
        <input
          {...register("tags", {
            setValueAs: (v) => {
              if (typeof v === "string") {
                return v
                  .split(",")
                  .map((t: string) => t.trim())
                  .filter(Boolean);
              }
              return Array.isArray(v) ? v : [];
            },
          })}
          type="text"
          id="tags"
          className="w-full px-3 py-2 border rounded-md"
          placeholder="api, authentication, utility"
        />
        {errors.tags && <p className="text-red-500 text-sm mt-1">{errors.tags.message as string}</p>}
      </div>

      {/* Submit */}
      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting
            ? mode === "create"
              ? "Creating..."
              : "Updating..."
            : mode === "create"
              ? "Create Snippet"
              : "Update Snippet"}
        </Button>
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
