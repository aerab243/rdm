# RDM - Rust Download Manager 🚀

**RDM** (Rust Download Manager) est un gestionnaire de téléchargement ultra-rapide, résilient et moderne, conçu en Rust. Il offre une interface en ligne de commande (CLI) puissante et une application de bureau (Desktop) légère basée sur Tauri.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Language](https://img.shields.io/badge/language-Rust-orange)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Caractéristiques

- **Vitesse Extrême** : Téléchargement multi-segments (multi-threading) pour saturer votre bande passante.
- **Résilience (Pause/Resume)** : Sauvegarde automatique de l'état dans un fichier `.rdm`. Reprenez vos téléchargements là où ils se sont arrêtés.
- **Robustesse** : Gestion intelligente des redirections HTTP, des erreurs réseau avec backoff exponentiel et des certificats SSL invalides (`--insecure`).
- **Performance Optimisée** : Utilisation de variables atomiques pour un suivi de progression sans verrou (lock-free) et buffers d'écriture de 1 Mo.
- **Multi-plateforme** : Fonctionne sur Linux, macOS et Windows.
- **Deux Interfaces** :
  - **rdm-cli** : Pour les puristes du terminal et l'automatisation.
  - **rdm-desktop** : Une interface graphique moderne en React + Tauri.

## 🚀 Installation

### Prérequis
- [Rust](https://www.rust-lang.org/) (cargo)
- [Node.js](https://nodejs.org/) (pour la version Desktop uniquement)

### Compilation
```bash
git clone https://github.com/aerab243/rdm.git
cd rdm
cargo build --release
```

## 🛠️ Utilisation de la CLI (`rdm-cli`)

La CLI est conçue pour être simple mais puissante.

### Téléchargement simple
```bash
./target/release/rdm-cli "https://exemple.com/fichier.zip"
```

### Options avancées
```bash
# Utiliser 16 segments en parallèle et ignorer les erreurs SSL
rdm-cli "https://speed.hetzner.de/100MB.bin" --segments 16 --insecure

# Télécharger plusieurs fichiers
rdm-cli "URL1" "URL2" "URL3"

# Télécharger depuis une liste dans un fichier texte
rdm-cli --file mes_liens.txt --output-dir ./telechargements
```

### Arguments
| Option | Description |
|--------|-------------|
| `<URLS>` | Une ou plusieurs URLs à télécharger. |
| `-f, --file` | Chemin vers un fichier `.txt` contenant une liste d'URLs. |
| `-o, --output-dir` | Répertoire de destination (défaut: `.`). |
| `-s, --segments` | Nombre de segments parallèles (défaut: 8). |
| `-i, --insecure` | Autorise les connexions SSL non sécurisées. |

## 🖥️ Utilisation du Desktop (`rdm-desktop`)

L'application de bureau offre une expérience visuelle pour gérer vos téléchargements.

1. Allez dans le dossier desktop : `cd rdm-desktop`
2. Installez les dépendances : `npm install`
3. Lancez en mode développement : `npm run tauri dev`

## 🏗️ Architecture du Projet

- `rdm-core` : Le moteur de téléchargement (bibliothèque partagée).
- `rdm-cli` : L'interface en ligne de commande.
- `rdm-desktop` : L'interface graphique (Tauri + React + TypeScript).

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---
Développé avec ❤️ en Rust.
