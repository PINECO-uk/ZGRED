# Opisy Zespołów LEVEL UP

Ten plik zawiera instrukcje dotyczące zarządzania opisami zespołów używanymi przez system ZGRED do generowania dokumentów.

## Plik z opisami

Opisy zespołów znajdują się w pliku: `data/opisy-zespoly.json`

## Struktura pliku JSON

```json
{
  "teams": {
    "Nazwa Zespołu": {
      "description": "Krótki opis czym zajmuje się zespół",
      "mainActivities": [
        "Działanie 1",
        "Działanie 2",
        "Działanie 3"
      ]
    }
  }
}
```

## Jak dodać nowy zespół

1. Otwórz plik `data/opisy-zespoly.json`
2. Dodaj nowy wpis w obiekcie `teams`:

```json
"Nowy Zespół Masters": {
  "description": "Zespół zajmujący się...",
  "mainActivities": [
    "Główne zadanie 1",
    "Główne zadanie 2",
    "Główne zadanie 3"
  ]
}
```

3. Zapisz plik

## Jak edytować istniejący zespół

1. Znajdź nazwę zespołu w pliku `opisy-zespoly.json`
2. Zaktualizuj `description` i/lub `mainActivities`
3. Zapisz plik

## Jak system wykorzystuje opisy

System ZGRED automatycznie wczytuje opisy zespołów i dodaje je do promptów dla LLM przy generowaniu:
- **Referencji** - LLM wykorzystuje opisy do szczegółowego opisywania zadań wolontariusza
- **Zaświadczeń** - Opisy pomagają w tworzeniu konkretnych przykładów działań
- **Ocen praktyk** - System bazuje na działaniach zespołu przy opisywaniu zadań praktykanta

## Przykład użycia

Jeśli wolontariusz pracował w zespole "Marketing Masters", system automatycznie dostarczy LLM informacje:

```
Zespół: Marketing Masters
Opis: Zespół odpowiedzialny za strategię marketingową organizacji, prowadzenie mediów społecznościowych...
Główne działania zespołu:
1. Planowanie i realizacja strategii marketingowej
2. Zarządzanie kanałami w mediach społecznościowych
3. Tworzenie treści graficznych i video
...
```

LLM wykorzysta te informacje do wygenerowania szczegółowego opisu zadań wolontariusza, nawet jeśli koordynator nie podał wszystkich szczegółów.

## Wskazówki

- **Używaj konkretnych nazw**: Dokładnie takich jak w pliku Excel (kolumna "Team - od 1.08.2022")
- **Bądź szczegółowy**: Im więcej szczegółów, tym lepsze opisy wygeneruje LLM
- **Aktualizuj regularnie**: Gdy zespoły zmieniają zakres działań, zaktualizuj opisy
- **Zachowaj format JSON**: Upewnij się, że plik jest poprawnym JSON (przecinki, cudzysłowy)

## Testowanie

Po dodaniu/edycji opisów zespołów, przetestuj generowanie dokumentu dla wolontariusza z tego zespołu, aby zobaczyć czy LLM poprawnie wykorzystuje nowe informacje.

## Dostępne zespoły

Aktualna lista zespołów w systemie:
- Marketing Masters
- Projects & Partnership Masters
- E-volunteering & Team Development Masters
- Blog & Content Masters
- Events & Community Masters

## Importowanie z DOCX

Jeśli masz plik `opisy-ZESPOLY-LEVEL-UP.docx`:

1. Otwórz plik DOCX
2. Skopiuj treści dla każdego zespołu
3. Wklej do odpowiednich sekcji w `opisy-zespoly.json`
4. Upewnij się, że zachowujesz strukturę JSON

## Problemy?

Jeśli opisy zespołów nie działają:
1. Sprawdź logi w konsoli - szukaj `[TEAM-DESC]`
2. Upewnij się, że nazwy zespołów w JSON dokładnie odpowiadają nazwom w Excelu
3. Zweryfikuj czy plik JSON jest poprawny (użyj JSON validator online)
