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
    <select
      value={initialLanguage}
      onChange={handleChange}
      className="pl-4 pr-10 py-2 border rounded-md appearance-none bg-white cursor-pointer"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 12px center",
      }}
    >
      <option value="All">All Languages</option>
      {SNIPPET_LANGUAGES.map((lang) => (
        <option key={lang} value={lang}>
          {lang}
        </option>
      ))}
    </select>
  );
}
