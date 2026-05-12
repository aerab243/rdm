use anyhow::Result;
use clap::Parser;
use indicatif::{MultiProgress, ProgressBar, ProgressStyle};
use rdm_core::{DownloadConfig, Downloader};
use std::path::PathBuf;
use tokio::sync::mpsc;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// URLs to download
    #[arg(required = false)]
    urls: Vec<String>,

    /// File containing a list of URLs (one per line)
    #[arg(short, long)]
    file: Option<PathBuf>,

    /// Output directory
    #[arg(short, long, default_value = ".")]
    output_dir: PathBuf,

    /// Number of parallel segments per download
    #[arg(short, long, default_value_t = 8)]
    segments: usize,

    /// Allow insecure server connections when using SSL
    #[arg(short, long)]
    insecure: bool,
}

#[tokio::main]
async fn main() -> Result<()> {
    let args = Args::parse();
    
    let mut urls = args.urls;

    if let Some(file_path) = args.file {
        let content = tokio::fs::read_to_string(file_path).await?;
        for line in content.lines() {
            let line = line.trim();
            if !line.is_empty() && !line.starts_with('#') {
                urls.push(line.to_string());
            }
        }
    }

    if urls.is_empty() {
        println!("No URLs provided. Use 'rdm-cli <URL>' or 'rdm-cli --file <FILE>'.");
        return Ok(());
    }

    let downloader = Downloader::new(args.insecure)?;
    let mp = MultiProgress::new();
    
    let global_pb = if urls.len() > 1 {
        let pb = mp.add(ProgressBar::new(urls.len() as u64));
        pb.set_style(ProgressStyle::default_bar()
            .template("{spinner:.green} Global Progress: [{bar:40.magenta/red}] {pos}/{len} files ({elapsed_precise})")?);
        Some(pb)
    } else {
        None
    };

    for url in urls {
        let file_name = url.split('/').last().unwrap_or("download.bin");
        let output_path = args.output_dir.join(file_name);

        let config = DownloadConfig {
            url: url.clone(),
            output_path: output_path.clone(),
            num_segments: args.segments,
            allow_insecure: args.insecure,
        };

        let (tx, mut rx) = mpsc::channel::<rdm_core::ProgressUpdate>(100);

        let pb = mp.add(ProgressBar::new(0));
        pb.set_style(ProgressStyle::default_bar()
            .template("{spinner:.green} [{bar:40.cyan/blue}] {bytes}/{total_bytes} ({bytes_per_sec}, {eta}) - {msg}")?
            .progress_chars("#>-"));
        
        pb.set_message(file_name.to_string());

        let pb_clone = pb.clone();
        let progress_handle = tokio::spawn(async move {
            while let Some(update) = rx.recv().await {
                pb_clone.set_length(update.total_bytes);
                pb_clone.set_position(update.downloaded_bytes);
            }
        });

        if let Err(e) = downloader.download(config, tx).await {
            pb.abandon_with_message(format!("Error: {}", e));
        } else {
            pb.finish_with_message(format!("Done: {}", file_name));
        }
        
        progress_handle.await?;
        if let Some(ref gpb) = global_pb {
            gpb.inc(1);
        }
    }

    Ok(())
}
