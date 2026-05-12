use anyhow::Result;
use clap::Parser;
use indicatif::{ProgressBar, ProgressStyle};
use rdm_core::{DownloadConfig, Downloader};
use std::path::PathBuf;
use tokio::sync::mpsc;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// URL to download
    url: String,

    /// Output file path
    #[arg(short, long)]
    output: Option<PathBuf>,

    /// Number of parallel segments
    #[arg(short, long, default_value_t = 8)]
    segments: usize,

    /// Allow insecure server connections when using SSL
    #[arg(short, long)]
    insecure: bool,
}

#[tokio::main]
async fn main() -> Result<()> {
    let args = Args::parse();
    
    let url = args.url.clone();
    let file_name = args.output.unwrap_or_else(|| {
        PathBuf::from(url.split('/').last().unwrap_or("download.bin"))
    });

    let config = DownloadConfig {
        url: args.url,
        output_path: file_name.clone(),
        num_segments: args.segments,
        allow_insecure: args.insecure,
    };

    println!("Downloading to: {:?}", file_name);

    let downloader = Downloader::new(args.insecure)?;
    let (tx, mut rx) = mpsc::channel::<rdm_core::ProgressUpdate>(100);

    let pb = ProgressBar::new(0);
    pb.set_style(ProgressStyle::default_bar()
        .template("{spinner:.green} [{elapsed_precise}] [{bar:40.cyan/blue}] {bytes}/{total_bytes} ({bytes_per_sec}, {eta})")?
        .progress_chars("#>-"));

    let pb_clone = pb.clone();
    tokio::spawn(async move {
        while let Some(update) = rx.recv().await {
            pb_clone.set_length(update.total_bytes);
            pb_clone.set_position(update.downloaded_bytes);
        }
    });

    downloader.download(config, tx).await?;

    pb.finish_with_message("Download complete!");

    Ok(())
}
