# System Agentów AI - Dokumentacja

## Przegląd

Aplikacja została zmieniona z prostego systemu opartego na promptach na zaawansowany system agentów AI. Każdy typ dokumentu (referencje, zaświadczenia, oceny praktyk) ma teraz dedykowanego agenta z własną osobowością, zasadami i przykładami.

## Architektura

### Przed zmianą
- Hardcoded prompty w `llm-handler.js`
- Brak separacji między różnymi typami dokumentów
- Trudne w utrzymaniu i modyfikacji

### Po zmianie
- 3 dedykowane agenty AI
- Każdy agent w osobnym module ([src/agents.js](src/agents.js))
- Łatwa modyfikacja i rozszerzanie

## Agenci AI

### 1. Agent Referencji - "Profesjonalny Specjalista HR ds. Referencji"

**Osobowość:**
- Szczegółowy i dokładny
- Profesjonalny ale ciepły
- Obiektywny - nie wymyśla informacji
- Empatyczny i rozumiejący wartość wolontariuszy

**Zadanie:**
Tworzy szczegółowe referencje (3-4 akapity) dla wolontariuszy i praktykantów.

**Kluczowe frazy:**
- "wykazywała się / wykazywał się"
- "w czasie współpracy"
- "z pełnym przekonaniem rekomenduje współpracę"

**Przykłady:** 2 wzorcowe referencje

### 2. Agent Zaświadczeń - "Rzeczowy Koordynator ds. Zaświadczeń"

**Osobowość:**
- Konkretny i zwięzły
- Rzeczowy i pozytywny
- Dyplomatyczny w trudnych sytuacjach
- Skupiony na faktach

**Zadanie:**
Tworzy zwięzłe zaświadczenia (2-3 zdania) opisujące współpracę.

**Kluczowe frazy:**
- "pomagała / pomagał w"
- "brała / brał czynny udział w"
- "współpraca została zakończona"

**Przykłady:** 5 wzorcowych zaświadczeń (w tym przypadki problemowe)

### 3. Agent Praktyk - "Analityczny Koordynator Praktyk"

**Osobowość:**
- Analityczny i systematyczny
- Sprawiedliwy i konstruktywny
- Precyzyjny w strukturze

**Zadanie:**
Tworzy profesjonalne oceny praktyk składające się z 5 sekcji.

**Kluczowe frazy:**
- "wykonywała / wykonywał"
- "najlepiej odnajdywała się / najlepiej odnajdywał się w"
- "w trakcie praktyki"

**Przykłady:** 1 wzorcowa ocena praktyki

## Jak to działa

### 1. Wybór agenta

```javascript
import { getAgentByTaskType } from './src/agents.js';

const agent = getAgentByTaskType('references'); // lub 'cert' lub 'internship'
```

### 2. Budowanie prompta

System automatycznie buduje prompt używając:
- Osobowości agenta
- Zasad i wytycznych agenta
- Wzorcowych przykładów
- Informacji o pracowniku
- Opisu zespołu

```javascript
const prompt = buildAgentPrompt(agent, employee, additionalInfo, teamDescription, options);
```

### 3. Generowanie treści

Agent generuje treść zgodnie ze swoją osobowością i przykładami:

```javascript
const result = await generateReferences(employee, additionalInfo);
// lub
const result = await generateCert(employee, additionalInfo);
// lub
const result = await generateInternship(employee, additionalInfo);
```

## Struktura agenta

Każdy agent zawiera:

```javascript
{
  name: "Nazwa agenta",

  personality: `Opis osobowości i misji agenta...`,

  guidelines: [
    "Zasada 1",
    "Zasada 2",
    // ...
  ],

  keyPhrases: [
    "fraza kluczowa 1",
    "fraza kluczowa 2",
    // ...
  ],

  examples: [
    {
      description: "Opis przykładu",
      output: "Wzorcowa odpowiedź..."
    },
    // ...
  ],

  structureTemplate: `Szablon struktury dokumentu...`
}
```

## Jak modyfikować agentów

### Zmiana osobowości agenta

Edytuj plik [src/agents.js](src/agents.js):

```javascript
export const ReferencesAgent = {
  name: "Twoja nowa nazwa",
  personality: `Twój nowy opis osobowości...`,
  // ...
}
```

### Dodanie nowych zasad

```javascript
guidelines: [
  "Istniejące zasady...",
  "Twoja nowa zasada",
],
```

### Dodanie nowych przykładów

```javascript
examples: [
  // Istniejące przykłady...
  {
    description: "Opis nowego przykładu",
    team: "Nazwa zespołu",
    gender: "K", // lub "M"
    status: "aktywny", // lub "nieaktywny"
    output: `Wzorcowa odpowiedź...`
  }
],
```

### Zmiana fraz kluczowych

```javascript
keyPhrases: [
  "istniejące frazy...",
  "nowa fraza kluczowa",
],
```

## Testowanie

Uruchom test systemu agentów:

```bash
node test-agents-system.js
```

Ten test sprawdzi:
- ✓ Czy wszyscy agenci są dostępni
- ✓ Czy mają unikalne osobowości
- ✓ Czy zawierają wszystkie wymagane elementy
- ✓ Czy przykłady są w poprawnym formacie

## Pliki zmodyfikowane

1. **[src/agents.js](src/agents.js)** - NOWY plik z definicjami agentów
2. **[src/llm-handler.js](src/llm-handler.js)** - Zrefaktoryzowany do użycia agentów
3. **[src/llm-handler.js.backup](src/llm-handler.js.backup)** - Backup oryginalnego pliku
4. **[test-agents-system.js](test-agents-system.js)** - Test systemu agentów

## Zalety nowego systemu

### 1. Łatwość modyfikacji
- Każdy agent w jednym miejscu
- Jasna struktura i separacja
- Nie trzeba szukać w długich promptach

### 2. Konsystencja
- Każdy typ dokumentu ma spójny styl
- Przykłady są częścią definicji agenta
- Łatwo dodawać nowe przykłady

### 3. Skalowalność
- Łatwo dodać nowego agenta (np. dla nowego typu dokumentu)
- Możliwość tworzenia agentów dla konkretnych zespołów w przyszłości

### 4. Testowalność
- Agenci mogą być testowani niezależnie
- Przykłady służą jako testy akceptacyjne

## Przyszłe rozszerzenia

System można rozszerzyć o:

1. **Agenty dla konkretnych zespołów**
   - Każdy zespół może mieć swojego agenta
   - Specjalistyczne przykłady i frazy

2. **Wersjonowanie agentów**
   - Możliwość A/B testingu różnych osobowości
   - Historia zmian w agentach

3. **Dynamiczna konfiguracja**
   - Przechowywanie agentów w bazie danych
   - Interfejs do edycji agentów

4. **Metryki jakości**
   - Śledzenie jakości generowanych dokumentów
   - Automatyczna optymalizacja agentów

## Podsumowanie

System agentów AI zapewnia:
- ✅ Lepszą organizację kodu
- ✅ Łatwiejszą modyfikację i utrzymanie
- ✅ Spójność w generowanych dokumentach
- ✅ Możliwość łatwego rozszerzania
- ✅ Jasną separację między różnymi typami dokumentów

Każdy agent ma teraz swoją "osobowość" i "ekspertyzę", co przekłada się na lepszą jakość generowanych dokumentów.
