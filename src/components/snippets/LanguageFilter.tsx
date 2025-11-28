import { SNIPPET_LANGUAGES } from "../../types";

interface Props {
  initialLanguage?: string;
}

export default function LanguageFilter({ initialLanguage = "All" }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    const url = new URL(window.location.href);

    if (lang === "All") {
      url.searchParams.delete("lang");
    } else {
      url.searchParams.set("lang", lang);
    }

    window.location.href = url.toString();
  };

  return (
    <select value={initialLanguage} onChange={handleChange} className="px-4 py-2 border rounded-md">
      <option value="All">All Languages</option>
      {SNIPPET_LANGUAGES.map((lang) => (
        <option key={lang} value={lang}>
          {lang}
        </option>
      ))}
    </select>
  );
}
