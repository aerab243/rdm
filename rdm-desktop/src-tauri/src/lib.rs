// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use rdm_core::{DownloadConfig, Downloader, ProgressUpdate};
use tauri::{AppHandle, Emitter};
use tokio::sync::mpsc;

#[tauri::command]
async fn start_download(
    app: AppHandle,
    url: String,
    path: String,
    segments: usize,
    allow_insecure: bool,
) -> Result<(), String> {
    let config = DownloadConfig {
        url,
        output_path: std::path::PathBuf::from(path),
        num_segments: segments,
        allow_insecure,
    };

    let downloader = Downloader::new(allow_insecure).map_err(|e| e.to_string())?;
    let (tx, mut rx) = mpsc::channel::<ProgressUpdate>(100);

    // Spawn a task to listen for progress and emit events to the frontend
    let app_handle = app.clone();
    tokio::spawn(async move {
        while let Some(update) = rx.recv().await {
            let _ = app_handle.emit("download-progress", update);
        }
    });

    downloader
        .download(config, tx)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![start_download])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
