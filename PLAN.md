# Plan de Développement : RDM "Ultra Puissant"

Ce plan vise à transformer le MVP actuel de **rdm** en un gestionnaire de téléchargement de classe mondiale, capable de gérer les erreurs réseau, de reprendre les téléchargements interrompus et d'atteindre des vitesses extrêmes.

## Phase 1 : Robustesse et Fiabilité (Terminée ✅)
*   **Correction du bug de taille (391B)** : ✅ (HEAD fallback, User-Agent, Redirections)
*   **Gestion SSL/TLS** : ✅ (Option --insecure)
*   **Logique de Retry (Réessai)** : ✅ (Backoff exponentiel par segment)

## Phase 2 : Persistence et Reprise (Terminée ✅)
*   **Fichiers d'état (.rdm)** : ✅ (Sauvegarde JSON auto)
*   **Détection de reprise** : ✅ (Auto-reprise au démarrage)

## Phase 3 : Performance "Ultra Rapide" (En cours ⏳)
*   **Buffers Dynamiques** : Optimiser la taille des buffers.
*   **Pipeline HTTP** : S'assurer que les connexions `keep-alive` sont réutilisées.

## Phase 4 : Expérience Utilisateur (CLI Pro) (Partiellement Terminée ✅)
*   **Statistiques en temps réel** : ✅ (Mo/s, ETA dans la barre)
*   **Multi-fichiers** : À faire.
*   **Interface Interactive** : À faire.
## Phase 5 : Finalisation Desktop
*   **Synchronisation Core/UI** : Porter toutes les améliorations de robustesse dans le plugin Tauri.
*   **Visualiseur de Segments** : Afficher graphiquement quels segments sont en train de se remplir.

---
**Prochaine étape immédiate :** Corriger la détection de taille et ajouter l'option `--insecure` pour débloquer vos tests.
