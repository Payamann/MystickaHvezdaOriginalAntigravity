# 📊 Jak Získat Measurement ID z Google Analytics 4

## 🎯 Step-by-Step Návod

### KROK 1: Jdi na Google Analytics
```
URL: https://analytics.google.com
```

---

### KROK 2: Přihlaš se účtem Google
- Pokud nejsi přihlášený, klikni na **"Sign in"**
- Vyber účet (nebo vytvoř nový)

---

### KROK 3: Vytvoř novou Property

**Pokud je to tvůj PRVNÍ setup:**

1. Na domovské stránce Analytics uvidíš něco jako:
```
┌─────────────────────────────────┐
│  Welcome to Google Analytics    │
│  [CREATE] (tlačítko)            │
└─────────────────────────────────┘
```

2. Klikni na **"Create"** → **"Create Account"**

3. Vyplň formulář:
```
Account name: Mystická Hvězda
               (nebo co chceš)

☑ Share anonymized usage data
```

4. Klikni **"Next"**

---

### KROK 4: Vytvoř Property (Asset)

```
Property name: Mystická Hvězda

Reporting timezone: 🌍 Europe/Prague (DŮLEŽITÉ!)

Currency: CZK (Koruna česká)

Industry category: Arts & Entertainment
                   (nebo Lifestyle)
```

5. Klikni **"Create"**

---

### KROK 5: Přidej Web Stream

Nyní vidíš obrazovku "Data Collection":

1. Klikni na **"Web"** (webová aplikace)

2. Vyplň:
```
Website URL: https://mystickahvezda.cz
             (nebo tvá aktuální domain)

Stream name: Main Website
```

3. Klikni **"Create stream"**

---

### KROK 6: 🎯 ZKOPÍRUJ MEASUREMENT ID

**TO JE NEJDŮLEŽITĚJŠÍ!**

Po vytvoření vidíš obrazovku "Stream details":

```
┌──────────────────────────────────────┐
│  STREAM DETAILS                      │
├──────────────────────────────────────┤
│                                      │
│  Measurement ID:                     │
│  ┌──────────────────────────────┐   │
│  │ G-XXXXXXXXXX                 │   │
│  └──────────────────────────────┘   │
│         ☝️ ZKOPÍRUJ TOTO!            │
│                                      │
├──────────────────────────────────────┤
│  Property ID:                        │
│  ┌──────────────────────────────┐   │
│  │ 123456789                    │   │
│  └──────────────────────────────┘   │
│                                      │
└──────────────────────────────────────┘
```

**ZKOPÍRUJ:** `G-XXXXXXXXXX` (jen G-... část!)

---

## ✅ ALTERNATIVA: Pokud máš EXISTUJÍCÍ property

Pokud jsi v Analytics a vidíš "Switch property":

1. V levém sloupci nahoře klikni na **"Admin"**

2. Vlevo vidíš **"Property"** → Klikni

3. V tabulce najdi svou property → Klikni

4. V menu vlevo najdi **"Data Streams"**

5. Klikni na svůj Web stream

6. Vidíš **"Measurement ID"** → Zkopíruj!

---

## 🔍 ALE POČKEJ - Máš tam být v správném místě!

Zkontroluj že vidíš:

```
Google Analytics 4 (GA4)
↳ Admin
  ├─ Account (vlevo)
  ├─ Property (vlevo)
  │  ├─ Data Streams ← TADY!
  │  │  └─ Measurement ID (G-...)
  │  └─ ...
  └─ ...
```

**NE Google Analytics 3 (Universal Analytics)** - to je stará verze!

---

## 📋 KONTROLA CHECKLIST

- [ ] Přihlášen v Google Analytics
- [ ] Property vytvořena (jméno: Mystická Hvězda)
- [ ] Web stream vytvořen
- [ ] Measurement ID zkopírován (G-XXXXXXXXXX)
- [ ] Measurement ID je 12 znaků po G-

---

## ❓ POKUD SE ZTRÁCÍŠ

### Nejrychlejší cestu:

1. Jdi na: https://analytics.google.com
2. V levém menu → **"Admin"**
3. Uprostřed → **"Data Streams"** (pod svojí property)
4. Klikni na stream (obvykle "Web")
5. **Measurement ID** je vidět v horní sekci

---

## 💡 TIPS

- Measurement ID začíná vždy: **G-**
- Máš co 1 Measurement ID per website
- Pokud máš dev/staging, dělej odlišný stream
- Nesmaž Measurement ID později, bude ti trvat připojení dat

---

## 🎯 JAKMILE MÁŠ MEASUREMENT ID

Řekni mi toto:

```
Measurement ID: G-XXXXXXXXXX
```

A já hned:
1. Vygeneruji HTML snippet
2. Přidám do tvých HTML files
3. Otestuju v DevTools
4. Pushnu do Git

---

## ⏱️ POTŘEBUJEŠ HELP?

Pokud se ztrácíš:
- Pošli mi screenshot
- Řekni jakou chybu vidíš
- Řekni na jaké stránce jsi

Budu ti pomoct! 💪

---

**Status:** Čekáme na tvůj Measurement ID 👇
