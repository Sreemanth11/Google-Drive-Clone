import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaDownload, FaFile, FaImage, FaFilePdf, FaFileAlt, FaFilm, FaMusic, FaArchive, FaCheck, FaTimes, FaCloud } from 'react-icons/fa';

const ShareFile = () => {
  const { token } = useParams();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    const findAndDownloadFile = async () => {
      try {
        // Search through all users' shared files in localStorage
        const keys = Object.keys(localStorage);
        const sharedKeys = keys.filter(key => key.startsWith('shared_files_'));
        
        let foundFile = null;
        
        for (const key of sharedKeys) {
          const sharedFiles = JSON.parse(localStorage.getItem(key));
          if (sharedFiles && Array.isArray(sharedFiles)) {
            foundFile = sharedFiles.find(f => 
              f._id === token || 
              f.id === token || 
              f.shareUrl?.includes(token)
            );
            if (foundFile) break;
          }
        }
        
        if (foundFile) {
          setFile(foundFile);
          
          // AUTO-DOWNLOAD THE FILE
          await handleAutoDownload(foundFile);
        } else {
          setError('File not found or share link has expired');
        }
      } catch (err) {
        console.error('Error finding shared file:', err);
        setError('Error loading shared file');
      } finally {
        setLoading(false);
      }
    };

    const handleAutoDownload = async (fileToDownload) => {
      try {
        if (fileToDownload.path) {
          // For files with actual file paths (uploaded files)
          const link = document.createElement('a');
          link.href = fileToDownload.path;
          link.setAttribute('download', fileToDownload.name || fileToDownload.originalName);
          link.setAttribute('target', '_blank');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setDownloaded(true);
        } else {
          // For demo files without actual file content
          // Create a dummy download for demo purposes
          const blob = new Blob(['This is a demo file content for: ' + (fileToDownload.name || fileToDownload.originalName)], { type: 'text/plain' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', fileToDownload.name || fileToDownload.originalName);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          setDownloaded(true);
        }
      } catch (err) {
        console.error('Error auto-downloading file:', err);
        setError('Auto-download failed. Please try manual download.');
      }
    };

    findAndDownloadFile();
  }, [token]);

  const handleManualDownload = () => {
    if (!file) return;

    try {
      if (file.path) {
        const link = document.createElement('a');
        link.href = file.path;
        link.setAttribute('download', file.name || file.originalName);
        link.setAttribute('target', '_blank');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setDownloaded(true);
      } else {
        // Create dummy download for demo files
        const blob = new Blob(['This is a demo file content for: ' + (file.name || file.originalName)], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', file.name || file.originalName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        setDownloaded(true);
      }
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Download failed. Please try again.');
    }
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'folder': return <FaFile className="file-icon-large" />;
      case 'image': return <FaImage className="file-icon-large" />;
      case 'pdf': return <FaFilePdf className="file-icon-large" />;
      case 'document': return <FaFileAlt className="file-icon-large" />;
      case 'video': return <FaFilm className="file-icon-large" />;
      case 'audio': return <FaMusic className="file-icon-large" />;
      case 'archive': return <FaArchive className="file-icon-large" />;
      default: return <FaFileAlt className="file-icon-large" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="share-container">
        <div className="share-card">
          <div className="loading-spinner"></div>
          <h2>Preparing Download</h2>
          <p>Your file will download automatically...</p>
        </div>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="share-container">
        <div className="share-card error">
          <div className="status-icon">
            <FaTimes />
          </div>
          <h2>Download Failed</h2>
          <p>{error || 'The shared file could not be found.'}</p>
          <div className="share-actions">
            <Link to="/" className="g-button g-button-primary">
              Go to Drive
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (downloaded) {
    return (
      <div className="share-container">
        <div className="share-card success">
          <div className="status-icon">
            <FaCheck />
          </div>
          <h2>Download Complete!</h2>
          <p>"{file.name || file.originalName}" has been downloaded to your device.</p>
          <div className="file-info">
            <div className="file-icon-section">
              {getFileIcon(file.type)}
            </div>
            <div className="file-details-mini">
              <strong>{file.name || file.originalName}</strong>
              <span>{file.type.toUpperCase()} • {formatFileSize(file.size)}</span>
            </div>
          </div>
          <div className="share-actions">
            <Link to="/" className="g-button g-button-primary">
              Go to Drive
            </Link>
            <button 
              onClick={handleManualDownload}
              className="g-button g-button-secondary"
            >
              <FaDownload /> Download Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // This state should rarely be shown since auto-download happens immediately
  return (
    <div className="share-container">
      <div className="share-card">
        <div className="loading-spinner"></div>
        <h2>Starting Download...</h2>
        <p>If download doesn't start automatically, click below:</p>
        <button 
          onClick={handleManualDownload}
          className="download-btn primary"
        >
          <FaDownload /> Download Now
        </button>
      </div>
    </div>
  );
};

export default ShareFile;