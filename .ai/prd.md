# Dokument wymagań produktu (PRD) - Spellbook

## 1. Przegląd produktu

Spellbook to aplikacja webowa do zarządzania snippetami kodu i notatkami technicznymi, stworzona dla programistów, którzy potrzebują centralnego miejsca do przechowywania fragmentów kodu, zapytań SQL, skryptów bash i innych notatek technicznych.

Cel produktu: Zapewnić szybki, łatwy w użyciu system zarządzania snippetami z możliwością wyszukiwania, kategoryzacji i organizacji, zastępując rozproszone notatki w plikach tekstowych i różnych lokalizacjach.

Grupa docelowa: Programista backend (PHP/Elixir, 8 lat doświadczenia), który obecnie przechowuje snippety w prymitywnej formie i potrzebuje usprawnić swój workflow.

Typ produktu: Single-page application (SPA) z backend-as-a-service (Supabase)

Platforma: Aplikacja webowa (responsive design dla różnych rozdzielczości ekranu)

Timeline: 3 tygodnie (42 godziny, 2h dziennie)

Stack technologiczny:

- Frontend: Astro 5.13, React 19.1, TypeScript 5, Tailwind CSS 4.1, Shadcn/ui
- Backend: Supabase (BaaS) - PostgreSQL, Auth, SDK
- Testing: Playwright (E2E), Vitest (Unit Tests)
- Code Highlighting: Shiki 3.17
- AI Services: OpenRouter (Code explanations)
- CI/CD: GitHub Actions
- Deployment: Localhost (produkcyjne wdrożenie opcjonalne)

Zrealizowane rozszerzenia MVP:

- ✅ Syntax highlighting z Shiki
- ✅ AI Code Explain feature (OpenRouter)
- ✅ Testy jednostkowe (Vitest)
- ✅ Page Object Model dla testów E2E

Wizja przyszłości (v2+): Auto-detekcja języka AI, konwersja między językami programowania, dark mode, import/eksport danych, snippet versioning.

## 2. Problem użytkownika

Problem główny: Programiści gromadzą wiedzę techniczną w postaci snippetów kodu, zapytań SQL, skryptów i notatek, ale przechowują je w rozproszonych lokalizacjach (notatnik Windows/macOS, pliki .txt, różne aplikacje), co prowadzi do:

Konsekwencje problemu:

- Trudność w znalezieniu konkretnego snippetu gdy jest potrzebny
- Utrata czasu na ponowne pisanie już stworzonego kodu
- Brak centralnego repozytorium wiedzy technicznej
- Brak możliwości kategoryzacji i organizacji
- Ryzyko utraty danych przy zmianie komputera
- Niemożliwość szybkiego wyszukiwania w treści snippetów

Obecne rozwiązania użytkownika:

- Notatnik systemowy (Notepad, TextEdit)
- Pliki .txt w różnych folderach
- Prymitywne formy przechowywania bez struktury

Dlaczego obecne rozwiązania nie działają:

- Brak wyszukiwania w treści plików
- Brak kategoryzacji i tagowania
- Trudny dostęp (trzeba pamiętać gdzie zapisano plik)
- Brak kopii zapasowych
- Niemożliwość filtrowania po języku/typie

Oczekiwane rozwiązanie: Centralna, łatwa w użyciu aplikacja webowa, która pozwala na szybkie dodawanie, edycję, wyszukiwanie i organizację snippetów z minimalnym wysiłkiem.

## 3. Wymagania funkcjonalne

FR-001: Autentykacja użytkownika (Supabase Auth)

- Rejestracja nowego użytkownika przez email/hasło
- Logowanie istniejącego użytkownika
- Wylogowanie użytkownika
- Utrzymywanie sesji (auto-refresh token)
- Przekierowanie do strony logowania dla niezalogowanych użytkowników
- Haszowanie haseł (bcrypt przez Supabase)

FR-002: Zarządzanie snippetami - Tworzenie (Create)

- Formularz dodawania na osobnej stronie (/snippets/new)
- Pola formularza:
  - Title: text input, required, 1-200 znaków
  - Content: textarea, required, min 1 znak, bez limitu max
  - Language: dropdown select, required, wybór z predefiniowanej listy
  - Description: textarea, optional, max 500 znaków
  - Tags: tag input, optional, array of strings
- Walidacja client-side (Zod + React Hook Form)
- Walidacja server-side (PostgreSQL constraints)
- Automatyczne timestamps: created_at, updated_at
- Toast notification po sukcesie
- Przekierowanie do listy snippetów po zapisaniu
- Error handling przy niepowodzeniu

FR-003: Zarządzanie snippetami - Odczyt (Read)

- Lista wszystkich snippetów użytkownika (/snippets)
- Grid layout responsywny (1/2/3 kolumny w zależności od szerokości ekranu)
- Każda karta snippetu pokazuje:
  - Tytuł (bold, truncate jeśli za długi)
  - Language badge (kolorowy tag)
  - Tagi (jeśli istnieją)
  - Preview treści (100-150 znaków z "..." jeśli dłuższy)
  - Data utworzenia
- Domyślne sortowanie: od najnowszych (created_at DESC)
- Kliknięcie w kartę prowadzi do strony szczegółów
- Skeleton screens podczas ładowania
- Empty state gdy brak snippetów (przyjazny komunikat + przycisk "Add first snippet")
- Strona szczegółów snippetu (/snippets/:id):
  - Pełna treść snippetu (monospace font)
  - Wszystkie metadane (tytuł, język, tagi, opis, daty)
  - Przyciski: Edit, Delete, Back to list

FR-004: Zarządzanie snippetami - Aktualizacja (Update)

- Przycisk "Edit" na stronie szczegółów
- Formularz edycji na osobnej stronie (/snippets/:id/edit)
- Formularz pre-populated z istniejącymi danymi
- Te same pola i walidacja co w Create
- Aktualizacja pola updated_at automatycznie (PostgreSQL trigger)
- Przycisk "Cancel" z przekierowaniem do szczegółów bez zapisywania
- Toast notification po sukcesie
- Error handling przy niepowodzeniu

FR-005: Zarządzanie snippetami - Usuwanie (Delete)

- Przycisk "Delete" na stronie szczegółów
- Modal confirmation z:
  - Tytułem snippetu do usunięcia
  - Pytaniem "Are you sure you want to delete '[title]'?"
  - Przyciskami: Cancel, Confirm Delete
- Trwałe usunięcie (no soft delete)
- Toast notification po sukcesie
- Przekierowanie do listy po usunięciu
- Error handling przy niepowodzeniu

FR-006: Wyszukiwanie i filtrowanie

- Search bar na stronie listy snippetów
- Full-text search w: title + content (PostgreSQL to_tsvector)
- Live/instant search (update wyników podczas wpisywania)
- Language dropdown filter
- Możliwość łączenia search + filter
- Przycisk "Clear filters" gdy aktywny search/filter
- Wyniki wyszukiwania sortowane wg relevance + date
- Empty state gdy brak wyników ("No snippets found matching '[query]'")

FR-007: Walidacja danych

- Client-side validation:
  - Zod schemas dla wszystkich formularzy
  - React Hook Form integration
  - Real-time validation feedback
  - Error messages pod każdym polem
  - Disabled submit button gdy errors
- Server-side validation:
  - PostgreSQL CHECK constraints
  - Row Level Security (RLS) policies
  - Automatic user_id injection
- Error messages:
  - Title required: "Title is required"
  - Title too long: "Title must be 200 characters or less"
  - Content required: "Content is required"
  - Language required: "Please select a language"
  - Description too long: "Description must be 500 characters or less"

FR-008: Języki/typy snippetów

- Predefiniowana lista w alfabetycznej kolejności:
  - Bash
  - CSS
  - Elixir
  - HTML
  - JavaScript
  - JSON
  - MySQL
  - Note
  - Other
  - PHP
  - Python
  - TypeScript
  - YAML
- Dropdown select w formularzu
- Badge/tag display na kartach i szczegółach
- Możliwość filtrowania po każdym języku

FR-009: Tagi (Tags)

- Optional field w formularzu
- Array of strings w bazie danych (PostgreSQL array type)
- Wyświetlanie jako badges/pills na kartach
- Możliwość dodania wielu tagów do jednego snippetu
- Brak limitu liczby tagów (reasonable usage expected)

FR-010: Responsywność

- Grid layout:
  - Mobile (< 768px): 1 kolumna
  - Tablet (768px - 1024px): 2 kolumny
  - Desktop (> 1024px): 3 kolumny
- Wszystkie formularze responsive
- Touch-friendly buttons i inputs (min 44x44px)
- Readable font sizes na wszystkich urządzeniach

FR-011: Notyfikacje użytkownika (Toast)

- Toast notifications w prawym górnym rogu
- Auto-dismiss po 3-5 sekundach
- Możliwość ręcznego zamknięcia (X button)
- Typy:
  - Success (zielony): "Snippet created", "Snippet updated", "Snippet deleted"
  - Error (czerwony): "Failed to create snippet", "Failed to update snippet", itp.
- Stack multiple toasts jeśli wiele akcji jednocześnie

FR-012: Loading states

- Skeleton screens dla listy snippetów podczas ładowania
- Spinner w przycisku podczas akcji (save, delete)
- Disabled state przycisków podczas processing
- Loading indicator przy search (jeśli query trwa > 200ms)

FR-013: Error handling

- Graceful degradation przy błędach sieciowych
- User-friendly error messages (nie-techniczne)
- Detailed error logging do console.error (dla debugowania)
- Retry mechanism dla failed requests (optional)
- Error boundary dla React components

FR-014: Database Row Level Security

- Wszystkie queries automatycznie filtrowane przez user_id
- Policy: SELECT - users can only view own snippets
- Policy: INSERT - users can only insert with own user_id
- Policy: UPDATE - users can only update own snippets
- Policy: DELETE - users can only delete own snippets
- Niemożliwość obejścia policies (enforced at database level)

## 4. Granice produktu

Znajduje się w zakresie MVP:

- Pełny CRUD dla snippetów (Create, Read, Update, Delete)
- Autentykacja użytkowników (email/password)
- Full-text search w title i content
- Filtrowanie po języku/typie
- Kategoryzacja przez język i tagi
- Grid view z card layout
- Responsive design dla różnych urządzeń
- Walidacja formularzy (client i server)
- Toast notifications
- Loading states i error handling
- Row Level Security (RLS)
- Empty states
- Modal confirmation dla delete
- Minimum 1 E2E test (Playwright)
- CI/CD pipeline (GitHub Actions)
- Dokumentacja (PRD, tech stack, architecture)

✅ Zrealizowane poza MVP (rozszerzenia):

- ✅ Syntax highlighting kodu (Shiki 3.17)
- ✅ AI code explanation feature (OpenRouter)
- ✅ Testy jednostkowe z Vitest
- ✅ Page Object Model pattern dla testów E2E
- ✅ Copy to clipboard funkcjonalność
- ✅ Loading states dla AI requests

Poza zakresem (v2 i później):

- Advanced code editor (Monaco, CodeMirror)
- Dark mode / light mode toggle
- Dodatkowe AI features:
  - Auto-detect language from code
  - Translate snippets between languages
  - AI-powered tagging
- Import/eksport snippetów:
  - JSON export
  - CSV export
  - Import from files
- Snippet versioning (history zmian)
- Snippet sharing/collaboration:
  - Public snippets
  - Share links
  - Team workspaces
- Advanced search:
  - Search by tags
  - Date range filters
  - Regex search
- Favorites/bookmarks system
- Snippet templates
- Folder organization (hierarchical)
- Backup/restore functionality
- Browser extension dla quick capture
- CLI tool dla terminal access
- Mobile native apps (iOS, Android)
- Deployment do produkcji (optional, post-kurs)
- Multi-language UI (i18n)
- Analytics/usage statistics
- Keyboard shortcuts
- Snippet duplication

Ograniczenia techniczne MVP:

- Single user focus (brak multi-tenancy)
- Localhost deployment (produkcyjne wdrożenie opcjonalne)
- Rate limiting dla AI (client-side throttling)
- Brak advanced caching strategies
- Brak pagination (wszystkie snippety na jednej stronie, acceptable do ~200 snippetów)
- Podstawowy error handling dla edge cases

Decyzje techniczne poza zakresem:

- Custom backend (używamy Supabase BaaS)
- Własna autentykacja (używamy Supabase Auth)
- SQL migrations management (używamy Supabase migrations)
- Custom API routes (używamy Supabase SDK)
- Docker deployment (localhost wystarczy)
- Load balancing / scaling
- CDN dla static assets

## 5. Historyjki użytkowników

US-001: Rejestracja nowego użytkownika
Jako nowy użytkownik chcę móc zarejestrować się przy użyciu adresu email i hasła, aby stworzyć konto i zacząć korzystać z aplikacji.

Kryteria akceptacji:

- Formularz rejestracji zawiera pola: email, password, confirm password
- Email jest walidowany jako prawidłowy format email
- Hasło musi mieć minimum 8 znaków
- Confirm password musi być identyczne z password
- Po udanej rejestracji użytkownik jest automatycznie zalogowany
- Po udanej rejestracji użytkownik jest przekierowany do /snippets
- W przypadku błędu (np. email już istnieje) wyświetlany jest komunikat błędu
- Hasło jest haszowane i nigdy nie przechowywane w plain text

US-002: Logowanie użytkownika
Jako zarejestrowany użytkownik chcę móc się zalogować używając mojego email i hasła, aby uzyskać dostęp do moich snippetów.

Kryteria akceptacji:

- Formularz logowania zawiera pola: email, password
- Po poprawnym zalogowaniu użytkownik jest przekierowany do /snippets
- Sesja jest zachowana (użytkownik pozostaje zalogowany po odświeżeniu strony)
- Token sesji jest automatycznie odświeżany
- W przypadku błędnych danych wyświetlany jest komunikat "Invalid email or password"
- Link "Forgot password?" jest dostępny na stronie logowania

US-003: Wylogowanie użytkownika
Jako zalogowany użytkownik chcę móc się wylogować, aby zakończyć sesję i zabezpieczyć moje konto.

Kryteria akceptacji:

- Przycisk "Logout" jest widoczny w nagłówku aplikacji
- Po kliknięciu "Logout" sesja użytkownika jest kończona
- Użytkownik jest przekierowany do strony /login
- Po wylogowaniu próba dostępu do /snippets przekierowuje do /login
- Token sesji jest usuwany

US-005: Przekierowanie niezalogowanych użytkowników
Jako niezalogowany użytkownik, gdy próbuję uzyskać dostęp do chronionej strony, chcę być przekierowany do strony logowania, aby najpierw się zalogować.

Kryteria akceptacji:

- Wszystkie route /snippets/\* wymagają autentykacji
- Próba dostępu do /snippets bez logowania przekierowuje do /login
- Po zalogowaniu użytkownik jest przekierowany do pierwotnie żądanej strony
- Strona /login jest dostępna bez autentykacji

US-006: Dodanie nowego snippetu
Jako zalogowany użytkownik chcę móc dodać nowy snippet z tytułem, treścią, językiem i opcjonalnymi tagami, aby zapisać fragment kodu lub notatkę.

Kryteria akceptacji:

- Przycisk "New Snippet" lub "+" jest widoczny na stronie listy
- Kliknięcie prowadzi do /snippets/new
- Formularz zawiera wszystkie wymagane pola: title, content, language
- Formularz zawiera opcjonalne pola: description, tags
- Title jest required, 1-200 znaków
- Content jest required, minimum 1 znak
- Language jest required, wybór z dropdown
- Description jest optional, max 500 znaków
- Tags są optional, można dodać wiele
- Real-time validation pokazuje błędy
- Przycisk "Save" jest disabled gdy są błędy walidacji
- Po zapisaniu wyświetlany jest toast "Snippet created successfully"
- Po zapisaniu użytkownik jest przekierowany do listy snippetów
- created_at i updated_at są automatycznie ustawiane

US-007: Wyświetlenie listy wszystkich snippetów
Jako zalogowany użytkownik chcę zobaczyć listę wszystkich moich snippetów w przejrzystym grid layout, aby szybko znaleźć interesujący mnie snippet.

Kryteria akceptacji:

- Lista snippetów jest wyświetlana na /snippets
- Grid layout jest responsywny (1/2/3 kolumny)
- Każda karta snippetu pokazuje: title, language badge, tags, preview (100-150 chars), date
- Snippety są sortowane od najnowszych (created_at DESC)
- Kliknięcie w kartę prowadzi do strony szczegółów
- Podczas ładowania wyświetlane są skeleton screens
- Gdy brak snippetów wyświetlany jest friendly empty state z przyciskiem "Add your first snippet"
- Spinner lub skeleton podczas ładowania danych

US-008: Wyświetlenie szczegółów snippetu
Jako zalogowany użytkownik chcę zobaczyć pełne szczegóły konkretnego snippetu, aby przeczytać całą treść i wszystkie metadane.

Kryteria akceptacji:

- Kliknięcie karty snippetu prowadzi do /snippets/:id
- Strona pokazuje pełną treść snippetu w monospace font
- Wyświetlane są wszystkie metadane: title, language, description, tags, created_at, updated_at
- Przyciski "Edit" i "Delete" są widoczne
- Przycisk "Back to list" lub breadcrumb prowadzi do listy
- Content jest wyświetlany z zachowaniem white space i line breaks
- Jeśli snippet nie istnieje lub należy do innego użytkownika, pokazywany jest error

US-009: Edycja istniejącego snippetu
Jako zalogowany użytkownik chcę móc edytować istniejący snippet, aby zaktualizować jego treść lub metadane.

Kryteria akceptacji:

- Przycisk "Edit" na stronie szczegółów prowadzi do /snippets/:id/edit
- Formularz jest pre-populated z aktualnymi danymi snippetu
- Wszystkie pola można edytować (title, content, language, description, tags)
- Walidacja działa tak samo jak przy tworzeniu
- Przycisk "Cancel" przekierowuje do szczegółów bez zapisywania zmian
- Przycisk "Save" zapisuje zmiany i aktualizuje updated_at
- Po zapisaniu wyświetlany jest toast "Snippet updated successfully"
- Po zapisaniu użytkownik jest przekierowany do szczegółów snippetu
- Jeśli użytkownik próbuje edytować snippet innego użytkownika, dostaje error (RLS)

US-010: Usunięcie snippetu
Jako zalogowany użytkownik chcę móc usunąć snippet, aby pozbyć się niepotrzebnych lub nieaktualnych fragmentów kodu.

Kryteria akceptacji:

- Przycisk "Delete" jest widoczny na stronie szczegółów
- Kliknięcie "Delete" otwiera modal confirmation
- Modal pokazuje tytuł snippetu do usunięcia
- Modal zawiera pytanie "Are you sure you want to delete '[title]'?"
- Modal ma przyciski: "Cancel" i "Confirm Delete"
- "Cancel" zamyka modal bez usuwania
- "Confirm Delete" trwale usuwa snippet z bazy danych
- Po usunięciu wyświetlany jest toast "Snippet deleted successfully"
- Po usunięciu użytkownik jest przekierowany do listy snippetów
- Jeśli użytkownik próbuje usunąć snippet innego użytkownika, dostaje error (RLS)

US-011: Wyszukiwanie snippetów po tytule lub treści
Jako zalogowany użytkownik chcę móc wyszukać snippety wpisując słowa kluczowe, aby szybko znaleźć konkretny fragment kodu.

Kryteria akceptacji:

- Search bar jest widoczny na stronie listy snippetów
- Search działa w title i content (full-text search)
- Wyniki są aktualizowane podczas wpisywania (live search)
- Search jest case-insensitive
- Gdy są wyniki, wyświetlane są wszystkie matching snippety
- Gdy brak wyników, wyświetlany jest "No snippets found matching '[query]'"
- Przycisk "Clear" (X) w search bar czyści search i pokazuje wszystkie snippety
- Search query jest zachowane w URL (można bookmarkować)

US-012: Filtrowanie snippetów po języku
Jako zalogowany użytkownik chcę móc filtrować snippety po języku programowania, aby zobaczyć tylko snippety w konkretnej technologii.

Kryteria akceptacji:

- Dropdown "Language" jest widoczny na stronie listy
- Dropdown zawiera wszystkie dostępne języki alfabetycznie + opcję "All"
- Domyślnie wybrany jest "All" (wszystkie snippety)
- Wybór języka filtruje listę do snippetów tylko tego języka
- Można łączyć filtr języka ze search query
- Liczba wyników jest widoczna (np. "Showing 5 MySQL snippets")
- Przycisk "Clear filters" resetuje filtr do "All" i czyści search

US-013: Sortowanie snippetów
Jako zalogowany użytkownik chcę widzieć moje snippety posortowane od najnowszych, aby najczęściej używane (nowo dodane) były na górze.

Kryteria akceptacji:

- Domyślne sortowanie to created_at DESC (najnowsze pierwsze)
- Sortowanie jest konsystentne przy search i filtrach
- Sortowanie działa zarówno dla pełnej listy jak i wyników search/filter

US-014: Wyświetlenie preview treści na karcie
Jako zalogowany użytkownik chcę widzieć fragment treści snippetu na karcie w liście, aby szybko rozpoznać snippet bez klikania w szczegóły.

Kryteria akceptacji:

- Każda karta pokazuje preview pierwszych 100-150 znaków content
- Jeśli content jest dłuższy, preview kończy się na "..."
- Preview zachowuje white space ale może łamać linie dla lepszego wyświetlania
- Preview jest w muted/secondary color (mniej prominent niż title)

US-015: Wyświetlenie pustego stanu (empty state)
Jako nowy użytkownik, gdy nie mam jeszcze żadnych snippetów, chcę zobaczyć przyjazny komunikat z informacją jak dodać pierwszy snippet.

Kryteria akceptacji:

- Gdy użytkownik nie ma snippetów, wyświetlany jest empty state zamiast pustej listy
- Empty state zawiera:
  - Ikonę lub ilustrację
  - Komunikat "No snippets yet"
  - Subtext "Start building your knowledge base by adding your first snippet"
  - Przycisk "Add your first snippet" prowadzący do /snippets/new
- Empty state jest również pokazywany gdy search/filter nie zwraca wyników (inny komunikat)

US-016: Walidacja formularza w czasie rzeczywistym
Jako użytkownik wypełniający formularz chcę widzieć błędy walidacji natychmiast po opuszczeniu pola, aby móc je szybko poprawić.

Kryteria akceptacji:

- Walidacja pola uruchamia się onBlur (po opuszczeniu pola)
- Error message jest wyświetlany pod polem w czerwonym kolorze
- Error message znika gdy pole jest poprawnie wypełnione
- Przycisk "Save" jest disabled gdy są jakiekolwiek błędy
- Required fields są oznaczone gwiazdką (\*)

US-017: Toast notifications dla akcji użytkownika
Jako użytkownik wykonujący akcje chcę otrzymywać feedback w postaci toast notifications, aby wiedzieć czy akcja się powiodła.

Kryteria akceptacji:

- Toast pojawia się w prawym górnym rogu po każdej akcji
- Success toast (zielony) dla: created, updated, deleted
- Error toast (czerwony) dla błędów
- Toast automatycznie znika po 3-5 sekundach
- Użytkownik może zamknąć toast klikając X
- Multiple toasts mogą być wyświetlane jednocześnie (stack)

US-018: Loading states podczas operacji
Jako użytkownik wykonujący akcje chcę widzieć visual feedback podczas przetwarzania, aby wiedzieć że aplikacja działa.

Kryteria akceptacji:

- Lista snippetów: skeleton screens podczas ładowania
- Przyciski akcji (Save, Delete): spinner w przycisku podczas processing
- Przyciski są disabled podczas processing
- Search: loading indicator jeśli query trwa > 200ms
- Brak możliwości podwójnego kliknięcia (double-submit prevention)

US-019: Responsywny grid layout
Jako użytkownik korzystający z różnych urządzeń chcę widzieć snippety w optymalnym layout dla mojego ekranu.

Kryteria akceptacji:

- Mobile (< 768px): 1 kolumna
- Tablet (768px - 1024px): 2 kolumny
- Desktop (> 1024px): 3 kolumny
- Karty mają stałą wysokość lub auto-height z max-height
- Layout płynnie przechodzi między breakpoints
- Touch targets są minimum 44x44px na mobile

US-020: Obsługa błędów sieciowych
Jako użytkownik chcę otrzymać jasny komunikat gdy operacja się nie powiedzie, aby wiedzieć co poszło nie tak i spróbować ponownie.

Kryteria akceptacji:

- Błąd sieciowy pokazuje toast "Unable to connect. Please check your connection."
- Błąd walidacji pokazuje konkretny komunikat pod polem
- Błąd serwera pokazuje toast "Something went wrong. Please try again."
- Błędy są logowane do console.error z pełnymi szczegółami
- Użytkownik może retry akcję bez refresh strony

US-021: Row Level Security - dostęp tylko do własnych snippetów
Jako zalogowany użytkownik chcę mieć pewność, że widzę tylko swoje snippety i nikt inny nie ma dostępu do moich danych.

Kryteria akceptacji:

- Wszystkie query SELECT zwracają tylko snippety gdzie user_id = auth.uid()
- INSERT automatycznie ustawia user_id na auth.uid()
- UPDATE jest możliwy tylko dla snippetów gdzie user_id = auth.uid()
- DELETE jest możliwy tylko dla snippetów gdzie user_id = auth.uid()
- Próba dostępu do snippetu innego użytkownika zwraca 403 lub empty result
- RLS policies są enforced na poziomie bazy danych (niemożliwe do obejścia)

US-022: Automatyczne timestamps
Jako użytkownik chcę widzieć kiedy snippet został utworzony i ostatnio zmodyfikowany, bez konieczności ręcznego ustawiania dat.

Kryteria akceptacji:

- created_at jest automatycznie ustawiane przy INSERT na NOW()
- updated_at jest automatycznie ustawiane przy INSERT na NOW()
- updated_at jest automatycznie aktualizowane przy UPDATE (PostgreSQL trigger)
- Timestamps są w formacie timestamptz (timezone-aware)
- Timestamps są wyświetlane w czytelnym formacie (np. "2 days ago", "Nov 24, 2024")

US-023: Wybór języka z predefiniowanej listy
Jako użytkownik dodający snippet chcę móc wybrać język z listy, aby snippet był odpowiednio skategoryzowany.

Kryteria akceptacji:

- Dropdown zawiera listę: Bash, CSS, Elixir, HTML, JavaScript, JSON, MySQL, Note, Other, PHP, Python, TypeScript, YAML
- Lista jest sortowana alfabetycznie
- Dropdown jest searchable (można wpisać literę i przeskoczyć)
- Pole jest required (nie można zapisać bez wyboru)
- Wybrany język jest wyświetlany jako badge na karcie i szczegółach

US-024: Dodawanie tagów do snippetu
Jako użytkownik chcę móc dodać własne tagi do snippetu, aby lepiej go kategoryzować według moich potrzeb.

Kryteria akceptacji:

- Pole tags jest optional
- Można dodać wiele tagów do jednego snippetu
- Tagi są wyświetlane jako pills/badges
- Tagi są zapisywane jako PostgreSQL array
- Brak limitu liczby tagów (reasonable usage)
- Puste tagi mogą być pomijane

US-025: Walidacja długości pól
Jako system chcę walidować długość pól, aby zapobiec zbyt długim lub pustym wartościom.

Kryteria akceptacji:

- Title: minimum 1 znak, maximum 200 znaków
- Content: minimum 1 znak, brak max limitu
- Description: brak minimum, maximum 500 znaków
- Walidacja działa client-side (Zod) i server-side (PostgreSQL CHECK)
- Komunikaty błędów są jasne i pomocne

US-026: Bezpieczne przechowywanie haseł
Jako użytkownik chcę mieć pewność, że moje hasło jest bezpiecznie przechowywane, aby chronić moje konto.

Kryteria akceptacji:

- Hasła są haszowane używając bcrypt (przez Supabase)
- Hasła nigdy nie są przechowywane w plain text
- Hasła nie są widoczne w logach ani responses
- Minimum length hasła to 8 znaków (Supabase default)

## 6. Metryki sukcesu

Metryki biznesowe (MVP - 3 tygodnie):

✅ Sukces końcowy MVP osiągnięty:

1. ✅ Aplikacja działa lokalnie bez krytycznych błędów
2. ✅ Wszystkie wymagania funkcjonalne są zaimplementowane
3. ✅ Testy E2E przechodzą poprawnie (Playwright + Page Object Model)
4. ✅ Testy jednostkowe działają (Vitest, 80%+ coverage dla utils)
5. ✅ CI/CD pipeline działa (GitHub Actions: build + type check + tests)
6. ✅ Dokumentacja jest kompletna (PRD, tech stack, architecture)
7. ✅ Rozszerzenia: syntax highlighting, AI explain, unit tests

Sukces użytkowy (personal):

1. Użytkownik (developer) dodał minimum 10 prawdziwych snippetów
2. Użytkownik aktywnie korzysta z aplikacji w codziennym workflow
3. Time to add snippet: mniej niż 30 sekund od otwarcia formularza do zapisania
4. Time to find snippet: mniej niż 10 sekund od wpisania search query do znalezienia
5. Aplikacja oszczędza czas vs poprzednie rozwiązanie (notatnik)

Metryki kursu 10xDevs (wymagania zaliczenia):

1. ✅ Mechanizm kontroli dostępu użytkownika (Supabase Auth + middleware)
2. ✅ Zarządzanie danymi CRUD (snippets management)
3. ✅ Logika biznesowa (validation, search, filtering, RLS, AI explain)
4. ✅ PRD i dokumenty kontekstowe (ten dokument + tech-stack.md + tech-architecture.md)
5. ✅ Testy (E2E z Playwright + testy jednostkowe z Vitest)
6. ✅ Pipeline CI/CD (GitHub Actions: build + type check + tests)

Metryki techniczne:

Performance metrics:

1. Page load time: < 2 sekundy dla /snippets
2. Search response time: < 500ms dla query
3. Form submission time: < 1 sekunda dla save
4. Time to interactive (TTI): < 3 sekundy

Quality metrics:

1. ✅ Zero critical bugs w core functionality
2. ✅ All E2E tests passing (100% pass rate)
3. ✅ TypeScript compilation bez errors
4. ✅ Build succeeds without errors
5. ✅ Code coverage: E2E tests + unit tests (80%+ dla utils)
6. ✅ ESLint bez errors
7. ✅ Page Object Model pattern dla maintainability

User experience metrics:

1. Zero javascript errors w console dla happy path
2. All forms have proper validation
3. All actions have loading states
4. All actions have success/error feedback
5. Empty states są implementowane

Security metrics:

1. Wszystkie hasła są hashed
2. Row Level Security działa dla wszystkich queries
3. Brak możliwości dostępu do snippetów innych użytkowników
4. Session tokens są secure (HTTP-only cookies)
5. No sensitive data w URL lub localStorage

Developer experience metrics:

1. Setup time dla nowego developera: < 30 minut
2. Build time: < 2 minuty
3. Hot reload działa poprawnie
4. TypeScript autocomplete działa
5. Clear error messages w development

Metryki adopcji (post-MVP, v2+):

- Daily active users (jeśli multi-user)
- Average number of snippets per user
- Most popular languages/types
- Search usage frequency
- Average session duration
- Retention rate (7-day, 30-day)

Metryki przyszłościowe (v2+):

1. AI feature usage (jeśli implementowane)
2. Import/export usage
3. Dark mode preference
4. Mobile vs desktop usage ratio
5. Average snippets created per week

KPIs do monitorowania w produkcji (jeśli wdrożone):

1. Uptime: > 99%
2. Error rate: < 1%
3. Average response time: < 500ms
4. Database query time: < 100ms
5. Failed authentication rate: < 5%

Definicja sukcesu dla różnych stakeholders:

Developer (Ty):

- Aplikacja rozwiązuje Twój problem z organizacją snippetów
- Używasz jej codziennie w pracy
- Oszczędza Ci czas vs poprzednie rozwiązanie
- Przyjemna w użyciu (good UX)

Kurs 10xDevs:

- Wszystkie wymagania kursu spełnione
- Projekt oddany na czas
- Dokumentacja kompletna
- Testy działają, CI/CD działa

Technical:

- Clean, maintainable code
- Proper architecture (Astro + Supabase)
- Security best practices (RLS, hashing)
- Good performance (fast load, fast search)

Future:

- Łatwo dodać nowe features (AI, syntax highlighting)
- Możliwość skalowania (jeśli potrzeba multi-user)
- Kod gotowy do rozbudowy w v2

Monitoring plan (post-MVP):

1. Application logs: console.error dla błędów
2. Supabase dashboard: database metrics
3. Browser DevTools: performance profiling
4. Manual testing: regular use case verification
5. User feedback: personal notes o UX issues

✅ Success milestones achieved:

Week 1:

- ✅ Setup kompletny, auth działa, basic UI gotowy

Week 2:

- ✅ Full CRUD działa, search działa, filters działają

Week 3:

- ✅ Tests działają, CI/CD działa, dokumentacja kompletna
- ✅ Dodatkowe features: syntax highlighting, AI explain

✅ Final success:

- ✅ Wszystkie user stories zaimplementowane
- ✅ Wszystkie acceptance criteria spełnione
- ✅ Projekt gotowy do prezentacji/oddania
- ✅ Rozszerzenia poza MVP zrealizowane
- ✅ Aplikacja gotowa do użycia w praktyce

---

**Document version:** 4.0  
**Created:** 2024-11-24  
**Last updated:** 2025-12-09  
**Status:** ✅ **Complete - MVP + Extensions Delivered**  
**Author:** Product Manager / Developer

**Changelog:**

- v4.0 (2025-12-09): Zaktualizowano status projektu - MVP Complete + rozszerzenia (syntax highlighting, AI explain, unit tests)
- v3.1 (2025-12-09): Aktualizacja tech stack (React 19, Tailwind 4)
- v3.0 (2025-11-28): Kompletny PRD dla MVP
- v2.0 (2024-11-25): Dodano szczegółowe user stories
- v1.0 (2024-11-24): Początkowy dokument wymagań
