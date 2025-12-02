# Tech Stack - Spellbook MVP

## Przegląd

**Projekt:** Spellbook - aplikacja do zarządzania snippetami kodu  
**Timeline:** 3 tygodnie (42 godziny, 2h/dzień)  
**Zakres:** MVP - autentykacja, CRUD, wyszukiwanie, testy, CI/CD  
**Deployment:** Lokalny (localhost) - bez produkcyjnego wdrożenia

---

## Stack Technologiczny

### Frontend - Astro z React dla komponentów interaktywnych

- **Astro 5** pozwala na tworzenie szybkich, wydajnych aplikacji z minimalną ilością JavaScript dzięki architekturze islands
- **React 18.3** zapewni interaktywność tam gdzie jest potrzebna (formularze, search, filtry) - stabilna wersja z pełnym wsparciem
- **TypeScript 5** dla statycznego typowania kodu i lepszego wsparcia IDE - z liberalną konfiguracją dla łatwiejszej nauki
- **Tailwind CSS 3.x** pozwala na wygodne stylowanie aplikacji z gotowymi utility classes i responsive design
- **Shadcn/ui** zapewnia bibliotekę dostępnych, pre-styled komponentów React (przyciski, inputy, dialogi, karty)
- **React Hook Form** do zarządzania formularzami z minimalnym boilerplate
- **Zod** dla walidacji schematów po stronie klienta i serwera z TypeScript inference

### Backend - Supabase jako kompleksowe rozwiązanie backendowe (BaaS)

- Zapewnia bazę danych **PostgreSQL** z pełnym wsparciem dla full-text search i zaawansowanych queries
- Zapewnia **SDK w JavaScript/TypeScript** (@supabase/supabase-js), które posłuży jako Backend-as-a-Service bez konieczności tworzenia własnych API routes
- Jest rozwiązaniem **open source**, które można hostować lokalnie lub na własnym serwerze w przyszłości
- Posiada **wbudowaną autentykację użytkowników** (email/password) z automatycznym haszowaniem haseł i zarządzaniem sesjami
- Oferuje **Row Level Security (RLS)** - polityki bezpieczeństwa enforced na poziomie bazy danych
- Zapewnia **Real-time subscriptions** (opcjonalna funkcja do wykorzystania w przyszłości)
- Free tier wystarczający dla projektu (500MB bazy, 50K użytkowników miesięcznie)

### Testing

- **Playwright** do testów End-to-End (E2E) - nowoczesne, szybkie narzędzie z świetnym wsparciem dla Astro
- Minimum 1 test weryfikujący pełny flow użytkownika (login → create → edit → delete snippet)

### CI/CD

- **GitHub Actions** do tworzenia pipeline'ów CI/CD
- Pipeline wykonuje: build aplikacji, TypeScript type check, uruchomienie testów Playwright
- Automatyczne uruchamianie przy push i pull request

### Hosting i Deployment

- **Development:** Localhost (npm run dev) - aplikacja działa tylko lokalnie
- **Baza danych:** Supabase Cloud (free tier) - zarządzana w chmurze
- **Production deployment:** Pominięty w MVP - nie jest wymagany przez kurs, focus na funkcjonalności
- **Przyszłość (opcjonalnie):** Vercel dla frontendu (darmowy, prosty setup w 15 minut)

---

## Czego NIE ma w MVP

### AI/Advanced Features - Odłożone do v2

- **Brak integracji AI w MVP** - proste reguły biznesowe wystarczą (walidacja, search, filtrowanie)
- **Przyszłość:** Openrouter.ai dla funkcji AI (auto-detect języka, tłumaczenie między językami, AI tagging)

### Inne funkcje poza zakresem MVP

- Syntax highlighting kodu (można dodać później: Prism.js, ~3h)
- Dark mode (można dodać później: Tailwind support, ~3h)
- Zaawansowany code editor (Monaco/CodeMirror)
- Import/export snippetów
- Deployment do produkcji (Docker, DigitalOcean)

---

## Uzasadnienie Wyboru

### Dlaczego ten stack?

**Oszczędność czasu:**

- Supabase (Auth + DB + SDK) oszczędza ~10-13 godzin vs custom backend
- Shadcn/ui oszczędza ~5-8 godzin vs custom komponenty
- Brak deploymentu oszczędza ~15-20 godzin vs Docker + DigitalOcean
- **Razem: ~30-43 godziny oszczędności** - krytyczne dla 42h budżetu

**Koszty:**

- Wszystkie narzędzia: **$0/miesiąc** w ramach free tiers
- Supabase Free: 500MB DB, 50K użytkowników/miesiąc
- GitHub Actions Free: 2,000 minut/miesiąc
- Localhost hosting: $0

**Zgodność z kursem:**

- React + TypeScript - zgodne z materiałami kursu
- Supabase - używany jako przykład w kursie
- Wszystkie wymagania spełnione (Auth, CRUD, testy, CI/CD, dokumentacja)

**Bezpieczeństwo:**

- Row Level Security (RLS) - enforced na poziomie bazy danych
- Automatyczne haszowanie haseł (bcrypt)
- Parametryzowane queries (brak SQL injection)
- React auto-escaping (ochrona XSS)

---

## Struktura Projektu

```
Frontend (Astro + React):
  - Astro pages dla routingu i SSR
  - React components dla interaktywności (islands pattern)
  - Tailwind dla stylowania
  - Shadcn/ui dla gotowych komponentów

Backend (Supabase):
  - PostgreSQL dla danych
  - Supabase Auth dla użytkowników
  - Row Level Security dla izolacji danych
  - SDK dla komunikacji frontend-backend

Walidacja:
  - Zod schemas (client + server)
  - React Hook Form dla UX
  - PostgreSQL constraints dla data integrity

Testing:
  - Playwright E2E tests
  - Manual testing checklist

CI/CD:
  - GitHub Actions
  - Automatyczny build + tests przy każdym push
```

---

## Wersjonowanie

**Wersja:** 2.0  
**Data:** 2025-11-24  
**Status:** ✅ Zatwierdzony - gotowy do implementacji

**Zmiany od v1.0:**

- Uproszczono dokument do kluczowych informacji
- Usunięto długie analizy i porównania
- Dodano jasną strukturę: co jest, czego nie ma, dlaczego
- Format dopasowany do przykładu ze zwięzłymi bullet points

---

## Powiązane Dokumenty

- [PRD](./prd.md) - Product Requirements Document (26 user stories, wymagania funkcjonalne)
- [Project Analysis](../docs/project-analysis.md) - Analiza wykonalności projektu
- [Tech Architecture](../docs/tech-architecture.md) - Szczegółowa architektura techniczna
