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
    pub allow_insecure: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProgressUpdate {
    pub downloaded_bytes: u64,
    pub total_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SegmentState {
    pub start: u64,
    pub end: u64,
    pub current: u64,
    pub finished: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadState {
    pub url: String,
    pub total_size: u64,
    pub segments: Vec<SegmentState>,
}

impl DownloadState {
    pub async fn save(&self, path: &std::path::Path) -> Result<()> {
        let content = serde_json::to_string(self)?;
        tokio::fs::write(path, content).await?;
        Ok(())
    }

    pub async fn load(path: &std::path::Path) -> Result<Self> {
        let content = tokio::fs::read_to_string(path).await?;
        let state = serde_json::from_str(&content)?;
        Ok(state)
    }
}

pub struct Downloader {
    client: reqwest::Client,
}

impl Downloader {
    pub fn new(allow_insecure: bool) -> Result<Self> {
        let client = reqwest::Client::builder()
            .danger_accept_invalid_certs(allow_insecure)
            .user_agent("rdm/0.1.0")
            .build()?;
        Ok(Self { client })
    }

    pub async fn download(
        &self,
        config: DownloadConfig,
        progress_tx: mpsc::Sender<ProgressUpdate>,
    ) -> Result<()> {
        let state_path = config.output_path.with_extension("rdm");
        
        let state = if state_path.exists() {
            DownloadState::load(&state_path).await?
        } else {
            let res = self.client.head(&config.url).send().await?;
            let res = if !res.status().is_success() {
                self.client.get(&config.url).header(RANGE, "bytes=0-0").send().await?
            } else {
                res
            };

            let total_size = res
                .headers()
                .get(CONTENT_LENGTH)
                .and_then(|v| v.to_str().ok())
                .and_then(|s| s.parse::<u64>().ok())
                .ok_or_else(|| anyhow!("Could not determine file size (Status: {})", res.status()))?;

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

            let num_segments = if supports_ranges { config.num_segments } else { 1 };
            let segment_size = total_size / num_segments as u64;
            let mut segments = Vec::new();

            for i in 0..num_segments {
                let start = i as u64 * segment_size;
                let end = if i == num_segments - 1 {
                    total_size - 1
                } else {
                    (i as u64 + 1) * segment_size - 1
                };
                segments.push(SegmentState {
                    start,
                    end,
                    current: start,
                    finished: false,
                });
            }

            DownloadState {
                url: config.url.clone(),
                total_size,
                segments,
            }
        };

        let state = Arc::new(tokio::sync::Mutex::new(state));
        self.download_with_state(state, config.output_path.clone(), state_path, progress_tx).await?;

        Ok(())
    }

    async fn download_with_state(
        &self,
        state: Arc<tokio::sync::Mutex<DownloadState>>,
        output_path: PathBuf,
        state_path: PathBuf,
        progress_tx: mpsc::Sender<ProgressUpdate>,
    ) -> Result<()> {
        let (total_size, num_segments) = {
            let s = state.lock().await;
            (s.total_size, s.segments.len())
        };

        let mut handles = Vec::new();
        
        for i in 0..num_segments {
            let state = Arc::clone(&state);
            let client = self.client.clone();
            let output_path = output_path.clone();
            let progress_tx = progress_tx.clone();

            let handle = tokio::spawn(async move {
                let (url, _start, end, mut current, finished) = {
                    let s = state.lock().await;
                    let seg = &s.segments[i];
                    (s.url.clone(), seg.start, seg.end, seg.current, seg.finished)
                };

                if finished {
                    return Ok::<(), anyhow::Error>(());
                }

                let mut attempts = 0;
                let max_attempts = 10;

                loop {
                    let range = format!("bytes={}-{}", current, end);
                    let result = async {
                        let mut response = client.get(url.clone()).header(RANGE, range).send().await?;
                        
                        let file = OpenOptions::new()
                            .write(true)
                            .open(path.clone())
                            .await?;
                        let mut writer = tokio::io::BufWriter::with_capacity(64 * 1024, file);
                        writer.seek(std::io::SeekFrom::Start(current)).await?;

                        while let Some(chunk) = response.chunk().await? {
                            writer.write_all(&chunk).await?;
                            current += chunk.len() as u64;

                            // Update state
                            let mut s = state.lock().await;
                            s.segments[i].current = current;
                            let total_downloaded: u64 = s.segments.iter().map(|seg| seg.current - seg.start).sum();
                            drop(s);

                            let _ = progress_tx.send(ProgressUpdate {
                                downloaded_bytes: total_downloaded,
                                total_bytes: total_size,
                            }).await;
                        }
                        writer.flush().await?;

                        let mut s = state.lock().await;
                        s.segments[i].finished = true;
                        Ok::<(), anyhow::Error>(())
                    }.await;

                    if result.is_ok() {
                        return result;
                    }

                    attempts += 1;
                    if attempts >= max_attempts {
                        return result;
                    }

                    let delay = std::time::Duration::from_secs(2u64.pow(attempts.min(5)));
                    tokio::time::sleep(delay).await;
                }
            });

            handles.push(handle);
        }

        // Periodic state saving task
        let state_clone = Arc::clone(&state);
        let state_path_clone = state_path.clone();
        let saver_handle = tokio::spawn(async move {
            loop {
                tokio::time::sleep(std::time::Duration::from_secs(2)).await;
                let s = state_clone.lock().await;
                let _ = s.save(&state_path_clone).await;
                if s.segments.iter().all(|seg| seg.finished) {
                    break;
                }
            }
        });

        for handle in handles {
            handle.await??;
        }
        
        saver_handle.await?;
        
        // Final save and cleanup
        let s = state.lock().await;
        s.save(&state_path).await?;
        if s.segments.iter().all(|seg| seg.finished) {
            let _ = tokio::fs::remove_file(state_path).await;
        }

        Ok(())
    }
}
