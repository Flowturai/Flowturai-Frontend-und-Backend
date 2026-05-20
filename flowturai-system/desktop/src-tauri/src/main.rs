// Flowturai Desktop App – Tauri 2.0
// Kein extra Fenster-Code nötig: Die App lädt das Admin-Dashboard
// direkt als Web-Oberfläche aus dem admin/ Ordner.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("Fehler beim Starten der Flowturai App");
}
