# 🛰️ Mission Commander

**Mission Commander** est une application desktop moderne (basée sur Electron et React) conçue pour transformer des feuilles de calcul Excel brutes en un tableau de bord de planification interactif et intelligent. 

L'application utilise l'intelligence artificielle pour analyser votre charge de travail et générer des rapports PDF professionnels paginés.

## ✨ Fonctionnalités Clés

- **📥 Import Excel Intelligent** : Glissez-déposez vos fichiers `.xlsx` ou `.xls`. L'application extrait automatiquement les dates et les intitulés de missions, tout en conservant l'intégralité des colonnes personnalisées dans les détails.
- **📅 Calendrier Interactif** : Une vue mensuelle fluide pour visualiser la répartition des missions. Cliquez sur un jour pour voir les détails complets.
- **🧠 Analyse IA (Gemini 3 Pro)** : Intégration directe avec l'API Google Gemini pour détecter les conflits de planning, les périodes de forte activité et obtenir des conseils stratégiques sur la gestion des missions.
- **📄 Export PDF Professionnel** : Système d'exportation avancé qui gère automatiquement la pagination (multi-pages A4) pour garantir qu'aucune information n'est coupée, que ce soit pour un rapport global ou le détail d'une journée.
- **🌓 Mode Sombre/Clair** : Interface utilisateur adaptative pour un confort visuel optimal de jour comme de nuit.
- **🔍 Recherche & Filtres** : Moteur de recherche instantané pour retrouver une mission spécifique parmi des centaines d'entrées.

## 🚀 Installation et Démarrage

### Prérequis
- [Node.js](https://nodejs.org/) (version 18 ou supérieure)
- Une clé API Google Gemini (à configurer dans l'environnement)

### Étapes
1. **Installation des dépendances** :
   ```bash
   npm install
   ```

2. **Lancement en mode développement** :
   ```bash
   npm run dev
   ```

3. **Construction de l'exécutable (Windows)** :
   ```bash
   npm run dist
   ```

## 🛠️ Stack Technique

- **Frontend** : React 19, Tailwind CSS (Styling), Lucide React (Icons).
- **Runtime** : Electron (Application Desktop).
- **Intelligence Artificielle** : SDK @google/genai (Modèle Gemini 3 Pro).
- **Traitement de Données** : XLSX (Parsing Excel), date-fns (Gestion du temps).
- **Exportation** : jsPDF & html2canvas (Génération de documents paginés).

## 📊 Format Excel Attendu

Pour un fonctionnement optimal, votre fichier Excel doit contenir au minimum :
- Une colonne nommée **"date"** (formats supportés : JJ/MM/AAAA ou format Date Excel).
- Une colonne nommée **"mission"** (l'intitulé principal).
- *Toutes les autres colonnes sont importées automatiquement comme détails supplémentaires.*

---
*Développé avec précision pour les gestionnaires de missions exigeants.*
