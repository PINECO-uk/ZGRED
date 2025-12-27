# 🐳 Instrukcja Docker Compose

## Szybki Start

### 1. Uruchom wszystko

```bash
# W folderze projektu
docker-compose up -d
```

To uruchomi:
- ✅ Kontener Ollama (zgred-ollama)
- ✅ Aplikację web (zgred-web) na http://localhost:3000
- ✅ Automatyczne pobieranie modelu qwen2.5:7b

### 2. Sprawdź status

```bash
docker-compose ps
```

### 3. Sprawdź czy model się pobrał

```bash
docker exec -it zgred-ollama ollama list
```

---

## 📋 Podstawowe Komendy

**Uruchom:**
```bash
docker-compose up -d
```

**Zatrzymaj:**
```bash
docker-compose down
```

**Zobacz logi:**
```bash
docker-compose logs -f
```

**Restart:**
```bash
docker-compose restart
```

---

## 🔍 Dostęp

- Aplikacja: http://localhost:3000
- Ollama API: http://localhost:11434

---

**Więcej info:** Zobacz pełną dokumentację w pliku
