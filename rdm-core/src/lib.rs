use anyhow::{anyhow, Result};
use reqwest::header::{ACCEPT_RANGES, CONTENT_LENGTH, RANGE};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;
use tokio::fs::OpenOptions;
use tokio::io::{AsyncSeekExt, AsyncWriteExt};
use tokio::sync::mpsc;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadConfig {
    pub url: String,
    pub output_path: PathBuf,
    pub num_segments: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProgressUpdate {
    pub downloaded_bytes: u64,
    pub total_bytes: u64,
}

pub struct Downloader {
    client: reqwest::Client,
}

impl Downloader {
    pub fn new() -> Self {
        Self {
            client: reqwest::Client::new(),
        }
    }

    pub async fn download(
        &self,
        config: DownloadConfig,
        progress_tx: mpsc::Sender<ProgressUpdate>,
    ) -> Result<()> {
        let res = self.client.head(&config.url).send().await?;
        
        let total_size = res
            .headers()
            .get(CONTENT_LENGTH)
            .and_then(|v| v.to_str().ok())
            .and_then(|s| s.parse::<u64>().ok())
            .ok_or_else(|| anyhow!("Could not determine file size"))?;

        let supports_ranges = res
            .headers()
            .get(ACCEPT_RANGES)
            .map(|v| v == "bytes")
            .unwrap_or(false);

        // Pre-allocate file
        let file = OpenOptions::new()
            .write(true)
            .create(true)
            .truncate(true)
            .open(&config.output_path)
            .await?;
        file.set_len(total_size).await?;

        if !supports_ranges || config.num_segments <= 1 {
            self.download_single(config, total_size, progress_tx).await?;
        } else {
            self.download_multi_segments(config, total_size, progress_tx).await?;
        }

        Ok(())
    }

    async fn download_single(
        &self,
        config: DownloadConfig,
        total_size: u64,
        progress_tx: mpsc::Sender<ProgressUpdate>,
    ) -> Result<()> {
        let mut response = self.client.get(&config.url).send().await?;
        let mut file = OpenOptions::new()
            .write(true)
            .open(&config.output_path)
            .await?;

        let mut downloaded = 0;
        while let Some(chunk) = response.chunk().await? {
            file.write_all(&chunk).await?;
            downloaded += chunk.len() as u64;
            let _ = progress_tx.send(ProgressUpdate {
                downloaded_bytes: downloaded,
                total_bytes: total_size,
            }).await;
        }

        Ok(())
    }

    async fn download_multi_segments(
        &self,
        config: DownloadConfig,
        total_size: u64,
        progress_tx: mpsc::Sender<ProgressUpdate>,
    ) -> Result<()> {
        let segment_size = total_size / config.num_segments as u64;
        let mut handles = Vec::new();
        let total_downloaded = Arc::new(tokio::sync::Mutex::new(0u64));

        for i in 0..config.num_segments {
            let start = i as u64 * segment_size;
            let end = if i == config.num_segments - 1 {
                total_size - 1
            } else {
                (i as u64 + 1) * segment_size - 1
            };

            let client = self.client.clone();
            let url = config.url.clone();
            let path = config.output_path.clone();
            let progress_tx = progress_tx.clone();
            let total_downloaded = Arc::clone(&total_downloaded);

            let handle = tokio::spawn(async move {
                let range = format!("bytes={}-{}", start, end);
                let mut response = client.get(url).header(RANGE, range).send().await?;
                
                let mut file = OpenOptions::new()
                    .write(true)
                    .open(path)
                    .await?;
                file.seek(std::io::SeekFrom::Start(start)).await?;

                while let Some(chunk) = response.chunk().await? {
                    file.write_all(&chunk).await?;
                    let mut lock = total_downloaded.lock().await;
                    *lock += chunk.len() as u64;
                    let current = *lock;
                    drop(lock);

                    let _ = progress_tx.send(ProgressUpdate {
                        downloaded_bytes: current,
                        total_bytes: total_size,
                    }).await;
                }
                Ok::<(), anyhow::Error>(())
            });

            handles.push(handle);
        }

        for handle in handles {
            handle.await??;
        }

        Ok(())
    }
}
