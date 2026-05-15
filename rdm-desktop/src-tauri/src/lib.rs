// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use rdm_core::{DownloadConfig, Downloader, ProgressUpdate};
use std::collections::HashMap;
use tauri::{AppHandle, Emitter};
use tokio::sync::mpsc;

struct DownloadHandle {
    sender: mpsc::Sender<()>,
}

static DOWNLOAD_HANDLES: std::sync::LazyLock<tokio::sync::Mutex<HashMap<String, DownloadHandle>>> =
    std::sync::LazyLock::new(|| tokio::sync::Mutex::new(HashMap::new()));

#[tauri::command]
async fn start_download(
    app: AppHandle,
    url: String,
    path: String,
    segments: usize,
    allow_insecure: bool,
    download_id: String,
) -> Result<(), String> {
    let config = DownloadConfig {
        url: url.clone(),
        output_path: std::path::PathBuf::from(&path),
        num_segments: segments,
        allow_insecure,
    };

    let downloader = Downloader::new(allow_insecure).map_err(|e| e.to_string())?;
    let (tx, mut rx) = mpsc::channel::<ProgressUpdate>(100);
    let (stop_tx, mut stop_rx) = mpsc::channel::<()>(1);

    {
        let mut handles = DOWNLOAD_HANDLES.lock().await;
        handles.insert(download_id.clone(), DownloadHandle { sender: stop_tx });
    }

    let app_handle = app.clone();
    let id = download_id.clone();

    tokio::spawn(async move {
        tokio::select! {
            _ = async {
                while let Some(update) = rx.recv().await {
                    let payload = serde_json::json!({
                        "id": id,
                        "downloaded_bytes": update.downloaded_bytes,
                        "total_bytes": update.total_bytes,
                    });
                    let _ = app_handle.emit("download-progress", payload);
                }
            } => {}
            _ = stop_rx.recv() => {
                let payload = serde_json::json!({ "id": id, "status": "cancelled" });
                let _ = app_handle.emit("download-cancelled", payload);
            }
        }
    });

    downloader
        .download(config, tx)
        .await
        .map_err(|e| e.to_string())?;

    {
        let mut handles = DOWNLOAD_HANDLES.lock().await;
        handles.remove(&download_id);
    }

    Ok(())
}

#[tauri::command]
async fn cancel_download(download_id: String) -> Result<(), String> {
    if let Some(handle) = DOWNLOAD_HANDLES.lock().await.remove(&download_id) {
        let _ = handle.sender.send(()).await;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![start_download, cancel_download])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
