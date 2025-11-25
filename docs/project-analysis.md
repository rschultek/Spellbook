# Spellbook - Analiza Projektu

## 📋 Opis projektu

**Spellbook** to aplikacja webowa służąca jako ujednolicone miejsce do przechowywania:
- Notatek programistycznych
- Snippetów kodu (różne języki)
- Zapytań MySQL
- Skryptów bashowych
- Innych fragmentów kodu i dokumentacji

### Cel
Centralizacja rozproszonych notatek i snippetów w jednym miejscu z możliwością łatwego wyszukiwania i organizacji.

### Przyszłe rozszerzenia (v2+)
- Tłumaczenie notatek przy użyciu AI
- Konwersja między językami programowania
- Zaawansowany syntax highlighting

---

## 🎯 Analiza wykonalności

### ✅ Czy rozwiązuje realny problem?
**TAK** - klasyczny "scratching your own itch":
- Problem: Rozproszenie notatek w różnych miejscach (notatnik, pliki lokalne)
- Rozwiązanie: Single source of truth dla wszystkich snippetów
- Użytkownik: Ty sam (łatwa weryfikacja czy działa)

### ✅ Czy można skupić się na 1-2 kluczowych funkcjach?
**TAK** - MVP jest bardzo jasny:

**Funkcja #1: Zarządzanie snippetami**
- Dodawanie (tytuł, treść, język/typ, tagi)
- Przeglądanie listy
- Edycja i usuwanie

**Funkcja #2: Organizacja**
- Wyszukiwanie po tytule/treści
- Kategoryzacja (MySQL, Bash, Notatki, etc.)
- Filtrowanie

**Co pominąć w MVP:**
- Zaawansowany edytor kodu
- Syntax highlighting (można później)
- AI features
- Współdzielenie

---

## ⏱️ Timeline: 3 tygodnie (42 godziny)

> [!IMPORTANT]
> Supabase oszczędza ~10-13 godzin vs custom backend, dając przewagę czasową

### 📅 Tydzień 1 (14h): Fundament + Auth
- **4h** - Setup projektu (Astro 5 + React 18 + TypeScript 5 + Tailwind 3 + Shadcn/ui)
- **4h** - Supabase setup (projekt, schema DB, RLS policies, env variables)
- **4h** - Autentykacja (Supabase Auth integration, login UI, protected routes)
- **2h** - Podstawowy UI (layout, navigation, empty state)

### 📅 Tydzień 2 (14h): CRUD + Features
- **4h** - Create snippet (form + Zod validation + Supabase insert)
- **4h** - Read & Update (lista, detail page, edit form, Supabase update)
- **2h** - Delete (modal confirmacji + Supabase delete)
- **2h** - Search & Filter (full-text search PostgreSQL, filtry)
- **2h** - Polish (loading states, error handling, toasts)

### 📅 Tydzień 3 (14h): Tests + CI/CD + Buffer
- **2h** - Playwright setup + E2E test (login → create → edit → delete)
- **4h** - GitHub Actions (CI/CD pipeline: build + TypeScript + tests)
- **4h** - Dokumentacja (finalizacja PRD, README, tech docs)
- **4h** - **BUFFER** (bugfixy, refactoring, final testing)

---

## 🏗️ Stack technologiczny

> [!NOTE]
> Pełna analiza decyzji technologicznych dostępna w [tech-stack.md](../.ai/tech-stack.md)

### Frontend
- **Astro 5** - najnowsza stabilna wersja
- **React 18.3** - stabilny (nie bleeding edge 19)
- **TypeScript 5** - liberal config dla łatwiejszej nauki
- **Tailwind CSS 3.x** - stabilny (nie beta v4)
- **Shadcn/ui** - gotowe, dostępne komponenty
- **React Hook Form** - zarządzanie formularzami
- **Zod** - walidacja schema

### Backend (BaaS)
- **Supabase** - kompleksowe rozwiązanie Backend-as-a-Service
- **PostgreSQL** - zarządzana baza danych (Supabase)
- **Supabase SDK** - zamiast custom API routes
- **Supabase Auth** - wbudowana autentykacja

### Testing
- **Playwright** - testy E2E

### CI/CD
- **GitHub Actions** - build + testy

### Deployment
- **Rozwój:** Localhost tylko (npm run dev)
- **Produkcja:** POMINIĘTE (nie wymagane przez kurs)
- **Baza danych:** Supabase Cloud (free tier)

---

## ✅ Kryteria zaliczenia kursu

| Wymaganie | Realizacja w Spellbook |
|-----------|------------------------|
| **Kontrola dostępu** | Ekran logowania (Clerk/Auth.js) |
| **CRUD** | Pełne zarządzanie snippetami (Create, Read, Update, Delete) |
| **Logika biznesowa** | Walidacja, wyszukiwanie, filtrowanie, kategoryzacja |
| **PRD i dokumenty** | Dokumentacja w `docs/` |
| **Testy** | Min. 1 test E2E (Playwright): logowanie + dodanie snippetu |
| **CI/CD Pipeline** | GitHub Actions: build + run tests |

---

## ⚠️ Potencjalne trudności i rozwiązania

### 1. Frontend learning curve
**Problem:** React + TypeScript to nowy stack dla backend deva (PHP/Elixir)

**Rozwiązanie:**
- Używaj AI (Claude Sonnet 4.5) do generowania komponentów
- Trzymaj się prostych patterns
- Nie komplikuj state management (Context API wystarczy)

### 2. Autentykacja
**Problem:** Setup od zera może być czasochłonny

**Rozwiązanie:**
- Użyj **Supabase Auth** (wbudowane w Supabase)
- Zero dodatkowego setupu (już w platformie)
- Gotowe UI patterns i dokumentacja

**Oszczędność czasu:** ~3-5 godzin vs custom auth

### 3. Brak doświadczenia z deploymentem
**Problem:** Hosting może być wyzwaniem

**Rozwiązanie:**
- **Deployment NIE jest wymagany** przez kurs (tylko CI/CD pipeline)
- Aplikacja działa lokalnie (localhost)
- Supabase Cloud hostuje bazę danych (free tier)
- Zero complexity związanej z Docker/DigitalOcean

**Oszczędność czasu:** ~15-20 godzin vs Docker + DigitalOcean

### 4. Scope creep
**Problem:** Pokusa dodawania featury (syntax highlighting, AI, etc.)

**Rozwiązanie:**
- Żelazna reguła MVP
- Notuj pomysły na v2, ale NIE implementuj teraz
- Focus na kryteriach zaliczenia

---

## 🤖 Strategia wykorzystania AI

### Co AI może zrobić za Ciebie (80% kodu):
- ✅ Generowanie komponentów React
- ✅ Boilerplate i setup projektów
- ✅ Rozwiązywanie błędów TypeScript
- ✅ Pisanie testów E2E
- ✅ Setup CI/CD (GitHub Actions config)
- ✅ Generowanie dokumentacji

### Co MUSISZ rozumieć:
- 🎯 Architektura ogólna (gdzie co leży)
- 🎯 Flow danych (formularz → API → baza)
- 🎯 Jak debugować
- 🎯 Podstawy React (component, props, state)

### Nie musisz rozumieć:
- ❌ TypeScript generics i advanced types
- ❌ Wszystkich React hooks
- ❌ Szczegółów bundlera
- ❌ Implementacji bibliotek

### Efektywne promptowanie:
```
✅ "Stwórz komponent formularza do dodawania snippetu z polami: 
   title, content, language, tags"
✅ "Dodaj walidację do formularza snippetu"
✅ "Wygeneruj test E2E dla dodawania snippetu"
```

---

## 🚨 Największe ryzyka

| Ryzyko | Prawdopodobieństwo | Mitygacja |
|--------|-------------------|-----------|
| Supabase learning curve | 🟢 Niskie | Supabase ma dobrą dokumentację i course examples |
| TypeScript errors | 🟡 Średnie | Liberal tsconfig, React 18 (stabilny), AI assistance |
| Brak czasu na CI/CD | 🟢 Niskie | Prosty GH Actions template |
| Scope creep (AI features) | 🔴 Wysokie | Żelazna dyscyplina - AI w v2, nie MVP |
| Feature creep | 🔴 Wysokie | Żelazna dyscyplina MVP |

---

## 🎯 Warunki sukcesu

### Wyrobisz się w 3 tygodnie jeśli:
- ✅ Konsekwentnie pracujesz 2h dziennie
- ✅ Używasz AI do generowania kodu (80% kodu)
- ✅ "Done > Perfect" - nie jesteś perfecjonistą
- ✅ Trzymasz się MVP (zero feature creep, NO AI features!)
- ✅ Używasz Supabase (oszczędza ~10-13h vs custom backend)
- ✅ Pomijasz deployment (oszczędza ~15-20h vs Docker)

### MVP Definition of Done:
1. ✅ Działające logowanie (Supabase Auth)
2. ✅ Można dodać snippet (Supabase insert)
3. ✅ Można wyświetlić listę snippetów (Supabase select)
4. ✅ Można edytować snippet (Supabase update)
5. ✅ Można usunąć snippet (Supabase delete)
6. ✅ Można wyszukać snippet (PostgreSQL full-text search)
7. ✅ Filtry działają (language, tags)
8. ✅ Min. 1 test E2E działa (Playwright)
9. ✅ CI/CD pipeline się wykonuje (GitHub Actions)
10. ✅ Dokumentacja kompletna (PRD, tech stack, architecture)

---

## 📝 Profil projektu

**Developer:** Backend dev (PHP, Elixir, 8 lat)  
**Doświadczenie z projektem:** Głównie rozwój istniejących projektów  
**Nowy stack:** Astro, React, TypeScript (uczenie się)  
**Czas:** 2h dziennie, 3 tygodnie  
**Cel:** Stworzenie aplikacji do zarządzania snippetami
**Deployment:** Opcjonalnie, aplikacja głównie dla siebie

---

## 🚀 Następne kroki

1. ⬜ Setup Astro + React + TypeScript
2. ⬜ Wybór auth solution (Clerk vs Auth.js)
3. ⬜ Setup bazy danych (SQLite + ORM)
4. ⬜ Pierwszy komponent (formularz snippet)
5. ⬜ PRD szczegółowy
**Wersja:** 2.0  
**Utworzono:** 2025-11-24  
**Zaktualizowano:** 2025-11-24  
**Status:** ✅ Analiza zakończona + finalizacja stacku - Ready to implement

**Changelog:**
- v2.0 (2025-11-24): Zaktualizowano stack na Supabase BaaS, finalizacja wszystkich decyzji technicznych
- v1.0 (2025-11-24): Początkowa analiza wykonalności
