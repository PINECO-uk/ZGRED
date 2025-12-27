# Przewodnik zmiany modelu na Qwen 2.5:7b

## ✅ Co zostało zrobione automatycznie

1. **Zaktualizowano [src/config.js](src/config.js)**
   ```javascript
   ollamaModel: process.env.OLLAMA_MODEL || "qwen2.5:7b"
   ```

2. **Zaktualizowano [.env.example](.env.example)**
   ```bash
   OLLAMA_MODEL=qwen2.5:7b
   ```

3. **Utworzono plik [.env](.env)**
   - Skopiowano z `.env.example` z nowym modelem

4. **Utworzono skrypt [download-qwen.sh](download-qwen.sh)**
   - Automatyczne pobieranie modelu Qwen 2.5:7b

## 📋 Co musisz zrobić teraz

### Krok 1: Pobierz model Qwen 2.5:7b

Wybierz jedną z metod:

#### Metoda A: Użyj gotowego skryptu (zalecane)
```bash
./download-qwen.sh
```

#### Metoda B: Ręcznie przez Ollama CLI
```bash
ollama pull qwen2.5:7b
```

#### Metoda C: Przez Docker (jeśli używasz Docker Compose)
```bash
docker exec -it <ollama-container-name> ollama pull qwen2.5:7b
```

### Krok 2: Sprawdź czy model został pobrany
```bash
ollama list
```

Powinieneś zobaczyć:
```
NAME            ID              SIZE      MODIFIED
qwen2.5:7b      abc123...       4.7 GB    X minutes ago
llama3.2:3b     def456...       2.0 GB    X days ago
...
```

### Krok 3: Uruchom aplikację
```bash
npm start
# lub
node src/cli.js
# lub
docker-compose up
```

## 📊 Informacje o modelu Qwen 2.5:7b

### Specyfikacja
- **Rozmiar**: ~4.7 GB
- **Parametry**: 7 miliardów
- **Kwantyzacja**: Q4_K_M (domyślnie)
- **Rodzina**: Qwen 2.5
- **Kontekst**: 32K tokenów

### Wymagania systemowe
- **RAM**: minimum 8 GB (zalecane 16 GB)
- **Wolne miejsce**: ~5 GB na dysku
- **GPU**: opcjonalne (NVIDIA z CUDA lub AMD z ROCm)

### Zalety Qwen 2.5:7b vs Llama 3.2:3b

| Funkcja | Llama 3.2:3b | Qwen 2.5:7b |
|---------|--------------|-------------|
| Parametry | 3.2B | 7B |
| Jakość tekstu | Dobra | Bardzo dobra |
| Rozumienie polskiego | Średnie | Bardzo dobre |
| Szybkość | Szybki | Średni |
| Rozmiar | 2 GB | 4.7 GB |
| **Polecane dla** | Testy, szybkie iteracje | Produkcja, najlepsza jakość |

### Wydajność dla naszych agentów

Qwen 2.5:7b jest **szczególnie dobry** w:
- ✅ Generowaniu długich, spójnych tekstów (referencje)
- ✅ Rozumieniu kontekstu i instrukcji w języku polskim
- ✅ Przestrzeganiu formatów JSON
- ✅ Poprawnej odmianie przez przypadki i rodzaje
- ✅ Zachowaniu profesjonalnego tonu

## 🔧 Troubleshooting

### Problem: "Model not found"
```bash
# Sprawdź czy Ollama działa
curl http://localhost:11434/api/tags

# Jeśli nie działa, uruchom Ollama
ollama serve
```

### Problem: "Out of memory"
Zmień na mniejszy wariant:
```bash
# W .env lub config.js zmień na:
OLLAMA_MODEL=qwen2.5:3b  # tylko 2GB RAM
```

### Problem: Zbyt wolne generowanie
Opcje:
1. Użyj GPU jeśli dostępne
2. Zmniejsz rozmiar modelu na `qwen2.5:3b`
3. Zwiększ RAM systemu

### Problem: Model nie odpowiada po polsku
Upewnij się że:
1. Używasz najnowszej wersji Ollama (`ollama --version`)
2. Model został w pełni pobrany (`ollama list`)
3. Prompty w agentach są po polsku (sprawdź [src/agents.js](src/agents.js))

## 🎯 Testowanie nowego modelu

### Test 1: Sprawdź podstawowe działanie
```bash
ollama run qwen2.5:7b "Napisz krótkie powitanie po polsku"
```

### Test 2: Test systemu agentów
```bash
node test-agents-system.js
```

### Test 3: Wygeneruj przykładowy dokument
Użyj aplikacji do wygenerowania testowego dokumentu i sprawdź jakość.

## 📝 Cofnięcie zmian

Jeśli chcesz wrócić do Llama 3.2:3b:

### Metoda 1: Zmień zmienną środowiskową
```bash
# W pliku .env
OLLAMA_MODEL=llama3.2:3b
```

### Metoda 2: Zmień w konfiguracji
Edytuj [src/config.js](src/config.js):
```javascript
ollamaModel: process.env.OLLAMA_MODEL || "llama3.2:3b"
```

## 🚀 Inne warianty Qwen 2.5

Jeśli chcesz spróbować innych rozmiarów:

```bash
# Mniejszy, szybszy (2GB)
ollama pull qwen2.5:3b
OLLAMA_MODEL=qwen2.5:3b

# Większy, lepsza jakość (9GB)
ollama pull qwen2.5:14b
OLLAMA_MODEL=qwen2.5:14b

# Największy, najlepsza jakość (20GB)
ollama pull qwen2.5:32b
OLLAMA_MODEL=qwen2.5:32b

# Specjalistyczny dla kodu
ollama pull qwen2.5-coder:7b
OLLAMA_MODEL=qwen2.5-coder:7b
```

## 📚 Dodatkowe informacje

- **Dokumentacja Qwen**: https://qwenlm.github.io/
- **Ollama dokumentacja**: https://ollama.ai/library/qwen2.5
- **Model card**: https://huggingface.co/Qwen/Qwen2.5-7B

## ✨ Podsumowanie

Po wykonaniu kroków 1-3, twoja aplikacja będzie używać modelu **Qwen 2.5:7b**, który zapewni:
- Lepszą jakość generowanych dokumentów
- Lepsze rozumienie języka polskiego
- Bardziej spójne i profesjonalne teksty
- Lepsze przestrzeganie formatów i zasad agentów

Wszystkie agenty AI (Referencje, Zaświadczenia, Praktyki) będą działać z nowym modelem bez żadnych dodatkowych zmian w kodzie!
