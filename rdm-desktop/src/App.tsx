import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./App.css";

interface ProgressUpdate {
  downloaded_bytes: number;
  total_bytes: number;
}

function App() {
  const [url, setUrl] = useState("");
  const [path, setPath] = useState("download.bin");
  const [segments, setSegments] = useState(8);
  const [progress, setProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [status, setStatus] = useState("Ready");

  useEffect(() => {
    const unlisten = listen<ProgressUpdate>("download-progress", (event) => {
      const { downloaded_bytes, total_bytes } = event.payload;
      const percentage = (downloaded_bytes / total_bytes) * 100;
      setProgress(percentage);
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  async function startDownload() {
    setDownloading(true);
    setStatus("Downloading...");
    setProgress(0);
    try {
      await invoke("start_download", { url, path, segments });
      setStatus("Download Complete!");
    } catch (e) {
      setStatus(`Error: ${e}`);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="container">
      <h1>RDM - Download Manager</h1>
      
      <div className="row">
        <input
          placeholder="Enter URL..."
          value={url}
          onChange={(e) => setUrl(e.currentTarget.value)}
        />
      </div>

      <div className="row">
        <input
          placeholder="Save as..."
          value={path}
          onChange={(e) => setPath(e.currentTarget.value)}
        />
      </div>

      <div className="row">
        <label>Segments: {segments}</label>
        <input
          type="range"
          min="1"
          max="32"
          value={segments}
          onChange={(e) => setSegments(parseInt(e.currentTarget.value))}
        />
      </div>

      <div className="row">
        <button onClick={startDownload} disabled={downloading}>
          {downloading ? "Downloading..." : "Start Download"}
        </button>
      </div>

      <div className="progress-container">
        <div 
          className="progress-bar" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <p>{status}</p>
    </div>
  );
}

export default App;
