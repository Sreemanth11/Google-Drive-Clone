import React, { useState, useRef, useEffect } from 'react';
import { 
  FaFolder, 
  FaImage, 
  FaFilePdf, 
  FaFileAlt, 
  FaFilm, 
  FaMusic, 
  FaArchive,
  FaStar,
  FaRegStar,
  FaDownload,
  FaShare,
  FaTrash,
  FaEllipsisV,
  FaSearch,
  FaUpload,
  FaFolderPlus,
  FaArrowLeft,
  FaBroom,
  FaUsers,
  FaClock,
  FaTrashAlt,
  FaHdd,
  FaUser,
  FaCloud,
  FaList,
  FaTh,
  FaUndo,
  FaPlus,
  FaTimes,
  FaInfoCircle,
  FaFile
} from 'react-icons/fa';

const Dashboard = ({ user, onLogout }) => {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [binItems, setBinItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('my-drive');
  const [viewMode, setViewMode] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);

  // Folder navigation states
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderStack, setFolderStack] = useState([]);

  // Action menu state
  const [activeActionMenu, setActiveActionMenu] = useState(null);

  // Extra states for Google Drive UX features
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetails, setShowDetails] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);
  const [showNewDropdown, setShowNewDropdown] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.action-menu') && !event.target.closest('.action-menu-btn')) {
        setActiveActionMenu(null);
      }
      if (!event.target.closest('.new-dropdown-menu') && !event.target.closest('.new-btn-sidebar')) {
        setShowNewDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Toggle action menu
  const toggleActionMenu = (itemId, event) => {
    if (event) {
      event.stopPropagation();
    }
    setActiveActionMenu(activeActionMenu === itemId ? null : itemId);
  };

  // Close action menu
  const closeActionMenu = () => {
    setActiveActionMenu(null);
  };

  // Load data when component mounts or user changes
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = () => {
    try {
      const userId = user?._id || user?.id || 'default';
      console.log('Loading data for user:', userId);
      
      const savedFiles = localStorage.getItem(`drive_files_${userId}`);
      const savedFolders = localStorage.getItem(`drive_folders_${userId}`);
      const savedShared = localStorage.getItem(`shared_files_${userId}`);
      const savedStarred = localStorage.getItem(`starred_items_${userId}`);
      const savedBin = localStorage.getItem(`bin_items_${userId}`);
      
      if (savedFiles) {
        const parsedFiles = JSON.parse(savedFiles);
        const filesWithIds = parsedFiles.map(file => ({
          ...file,
          id: file.id || file._id || `file_${Date.now()}_${Math.random()}`,
          _id: file._id || file.id,
          starred: file.starred || false,
          parentId: file.parentId || null
        }));
        setFiles(filesWithIds);
      }
      
      if (savedFolders) {
        const parsedFolders = JSON.parse(savedFolders);
        const foldersWithIds = parsedFolders.map(folder => ({
          ...folder,
          id: folder.id || folder._id || `folder_${Date.now()}_${Math.random()}`,
          _id: folder._id || folder.id,
          starred: folder.starred || false,
          parentId: folder.parentId || null
        }));
        setFolders(foldersWithIds);
      }
      
      if (savedShared) {
        setSharedFiles(JSON.parse(savedShared));
      }

      if (savedBin) {
        setBinItems(JSON.parse(savedBin));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize with sample data if no files exist
  useEffect(() => {
    if (!loading && user && files.length === 0) {
      const sampleFiles = [
        {
          id: 'sample_1',
          _id: 'sample_1',
          name: 'Welcome to Drive.pdf',
          originalName: 'Welcome to Drive.pdf',
          type: 'pdf',
          size: 1024000,
          owner: user._id || 'local',
          uploadedBy: user?.name || 'You',
          location: 'My Drive',
          lastModified: 'Just now',
          createdAt: new Date(),
          starred: false,
          parentId: null
        }
      ];
      setFiles(sampleFiles);
    }
  }, [loading, user, files.length]);

  // Save files whenever they change
  useEffect(() => {
    if (user && files.length > 0) {
      const userId = user._id || user.id || 'default';
      localStorage.setItem(`drive_files_${userId}`, JSON.stringify(files));
    }
  }, [files, user]);

  // Save folders whenever they change
  useEffect(() => {
    if (user && folders.length > 0) {
      const userId = user._id || user.id || 'default';
      localStorage.setItem(`drive_folders_${userId}`, JSON.stringify(folders));
    }
  }, [folders, user]);

  // Save shared files whenever they change
  useEffect(() => {
    if (user && sharedFiles.length > 0) {
      const userId = user._id || user.id || 'default';
      localStorage.setItem(`shared_files_${userId}`, JSON.stringify(sharedFiles));
    }
  }, [sharedFiles, user]);

  // Save starred items whenever they change
  useEffect(() => {
    if (user) {
      const userId = user._id || user.id || 'default';
      const starredItems = getStarredItems();
      localStorage.setItem(`starred_items_${userId}`, JSON.stringify(starredItems));
    }
  }, [files, folders, user]);

  // Save bin items whenever they change
  useEffect(() => {
    if (user) {
      const userId = user._id || user.id || 'default';
      localStorage.setItem(`bin_items_${userId}`, JSON.stringify(binItems));
    }
  }, [binItems, user]);

  // Folder navigation functions
  const handleFolderClick = (folderId) => {
    setFolderStack(prev => [...prev, currentFolder]);
    setCurrentFolder(folderId);
    closeActionMenu();
  };

  const handleBackClick = () => {
    if (folderStack.length > 0) {
      const previousFolder = folderStack[folderStack.length - 1];
      setFolderStack(prev => prev.slice(0, -1));
      setCurrentFolder(previousFolder);
    } else {
      setCurrentFolder(null);
      setFolderStack([]);
    }
    closeActionMenu();
  };

  const handleRootClick = () => {
    setCurrentFolder(null);
    setFolderStack([]);
    closeActionMenu();
  };

  const getFolderName = (folderId) => {
    const folder = folders.find(f => f._id === folderId || f.id === folderId);
    return folder ? folder.name : 'Unknown Folder';
  };

  const getCurrentPath = () => {
    if (!currentFolder) return 'My Drive';
    
    const path = [];
    let current = folders.find(f => f._id === currentFolder || f.id === currentFolder);
    
    while (current) {
      path.unshift(current.name);
      current = folders.find(f => f._id === current.parentId || f.id === current.parentId);
    }
    
    return ['My Drive', ...path].join(' / ');
  };

  const getCurrentFolderFiles = () => {
    return files.filter(file => file.parentId === currentFolder);
  };

  const getCurrentFolderFolders = () => {
    return folders.filter(folder => folder.parentId === currentFolder);
  };

  // Calculate storage usage based on localStorage
  const calculateStorageUsed = () => {
    try {
      const userId = user?._id || user?.id || 'default';
      let totalSize = 0;
      
      const keys = [
        `drive_files_${userId}`,
        `drive_folders_${userId}`,
        `shared_files_${userId}`,
        `starred_items_${userId}`,
        `bin_items_${userId}`
      ];
      
      keys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          totalSize += data.length * 2;
        }
      });
      
      return totalSize;
    } catch (error) {
      console.error('Error calculating storage:', error);
      return 0;
    }
  };

  const calculateStoragePercentage = () => {
    try {
      const storageLimit = 5 * 1024 * 1024;
      const used = calculateStorageUsed();
      const percentage = (used / storageLimit) * 100;
      return Math.min(percentage, 100);
    } catch (error) {
      console.error('Error calculating storage percentage:', error);
      return 0;
    }
  };

  // Get recent files sorted by upload time (newest first)
  const getRecentFiles = () => {
    const allItems = [
      ...files.map(file => ({ ...file, itemType: 'file' })),
      ...folders.map(folder => ({ ...folder, itemType: 'folder' }))
    ];
    
    return allItems
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 50);
  };

  // Get starred items (both files and folders)
  const getStarredItems = () => {
    const starredFiles = files.filter(file => file.starred);
    const starredFolders = folders.filter(folder => folder.starred);
    
    return [
      ...starredFiles.map(file => ({ ...file, itemType: 'file' })),
      ...starredFolders.map(folder => ({ ...folder, itemType: 'folder' }))
    ];
  };

  // Toggle star for file or folder
  const handleToggleStar = (itemId, itemType) => {
    if (itemType === 'file') {
      setFiles(prevFiles => 
        prevFiles.map(file => 
          (file._id === itemId || file.id === itemId) 
            ? { ...file, starred: !file.starred }
            : file
        )
      );
    } else if (itemType === 'folder') {
      setFolders(prevFolders => 
        prevFolders.map(folder => 
          (folder._id === itemId || folder.id === itemId) 
            ? { ...folder, starred: !folder.starred }
            : folder
        )
      );
    }
    closeActionMenu();
  };

  // File Upload Functionality
  const handleFileUpload = async (event) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles.length) return;

    setUploading(true);
    try {
      const newFiles = Array.from(selectedFiles).map((file, index) => ({
        id: `file_${Date.now()}_${index}`,
        _id: `file_${Date.now()}_${index}`,
        name: file.name,
        originalName: file.name,
        type: getFileTypeFromMime(file.type),
        size: file.size,
        owner: user?._id || 'local',
        uploadedBy: user?.name || 'You',
        location: currentFolder ? `Inside "${getFolderName(currentFolder)}"` : 'My Drive',
        parentId: currentFolder,
        lastModified: 'Just now',
        createdAt: new Date(),
        starred: false,
        path: URL.createObjectURL(file)
      }));

      setFiles(prevFiles => [...newFiles, ...prevFiles]);
      
      if (currentFolder) {
        setFolders(prevFolders => 
          prevFolders.map(folder => 
            (folder._id === currentFolder || folder.id === currentFolder)
              ? { ...folder, fileCount: (folder.fileCount || 0) + newFiles.length }
              : folder
          )
        );
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      alert(`${selectedFiles.length} file(s) uploaded successfully to ${currentFolder ? getFolderName(currentFolder) : 'My Drive'}!`);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Error uploading files');
    } finally {
      setUploading(false);
    }
  };

  // New Folder Creation
  const handleCreateFolder = () => {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;

    const newFolder = {
      id: `folder_${Date.now()}`,
      _id: `folder_${Date.now()}`,
      name: folderName,
      type: 'folder',
      location: currentFolder ? `Inside "${getFolderName(currentFolder)}"` : 'My Drive',
      parentId: currentFolder,
      createdAt: new Date(),
      fileCount: 0,
      owner: user?._id || 'local',
      uploadedBy: user?.name || 'You',
      starred: false
    };

    setFolders(prev => [newFolder, ...prev]);
    alert(`Folder "${folderName}" created successfully in ${currentFolder ? getFolderName(currentFolder) : 'My Drive'}!`);
  };

  // Bin Functions
  const handleMoveToBin = (itemId, itemName, itemType) => {
    if (itemType === 'file') {
      const fileToBin = files.find(f => f._id === itemId || f.id === itemId);
      if (fileToBin) {
        setBinItems(prev => [...prev, { ...fileToBin, itemType: 'file', deletedAt: new Date() }]);
        setFiles(prevFiles => prevFiles.filter(file => file._id !== itemId && file.id !== itemId));
      }
    } else if (itemType === 'folder') {
      const folderToBin = folders.find(f => f._id === itemId || f.id === itemId);
      if (folderToBin) {
        setBinItems(prev => [...prev, { ...folderToBin, itemType: 'folder', deletedAt: new Date() }]);
        setFolders(prevFolders => prevFolders.filter(folder => folder._id !== itemId && folder.id !== itemId));
      }
    }
    closeActionMenu();
    alert(`${itemType === 'file' ? 'File' : 'Folder'} moved to bin!`);
  };

  const handleRestore = (itemId) => {
    const itemToRestore = binItems.find(item => (item._id === itemId || item.id === itemId));
    if (itemToRestore) {
      if (itemToRestore.itemType === 'file') {
        setFiles(prev => [...prev, { ...itemToRestore }]);
      } else {
        setFolders(prev => [...prev, { ...itemToRestore }]);
      }
      setBinItems(prev => prev.filter(item => item._id !== itemId && item.id !== itemId));
      closeActionMenu();
      alert('Item restored successfully!');
    }
  };

  const handlePermanentDelete = (itemId, itemName) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${itemName}"? This action cannot be undone.`)) return;
    
    setBinItems(prev => prev.filter(item => item._id !== itemId && item.id !== itemId));
    closeActionMenu();
    alert('Item permanently deleted!');
  };

  const handleEmptyBin = () => {
    if (!window.confirm('Are you sure you want to empty the bin? All items will be permanently deleted.')) return;
    
    setBinItems([]);
    alert('Bin emptied successfully!');
  };

  // File Download - Fixed version
  const handleDownload = async (fileId, fileName) => {
    try {
      const file = files.find(f => f._id === fileId || f.id === fileId);
      if (file && file.path) {
        const link = document.createElement('a');
        link.href = file.path;
        link.setAttribute('download', fileName || file.name || file.originalName);
        link.setAttribute('target', '_blank');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert(`Download feature: ${fileName || file?.name || 'File'}\n\nIn a real application, this would download the file from the server.`);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Download failed. The file may not be available for download.');
    }
    closeActionMenu();
  };

  // File Delete - Updated to move to bin
  const handleDeleteFile = (fileId, fileName) => {
    if (!window.confirm(`Are you sure you want to move "${fileName}" to bin?`)) return;
    handleMoveToBin(fileId, fileName, 'file');
  };

  // Folder Delete - Updated to move to bin
  const handleDeleteFolder = (folderId, folderName) => {
    if (!window.confirm(`Are you sure you want to move folder "${folderName}" to bin?`)) return;
    handleMoveToBin(folderId, folderName, 'folder');
  };

  // File Share - Fixed version
  const handleShare = async (fileId, fileName) => {
  try {
    // Create a fake shareable link for demo
    const shareUrl = `${window.location.origin}/shared/${fileId}`;
    
    // Copy to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareUrl);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    
    // Add to shared files list
    const fileToShare = files.find(f => f._id === fileId || f.id === fileId);
    if (fileToShare) {
      const sharedFile = {
        ...fileToShare,
        sharedAt: new Date(),
        sharedBy: user?.name || 'You',
        shareUrl: shareUrl
      };
      
      const updatedSharedFiles = [sharedFile, ...sharedFiles.filter(f => f._id !== fileId && f.id !== fileId)];
      setSharedFiles(updatedSharedFiles);
      
      const userId = user._id || user.id || 'default';
      localStorage.setItem(`shared_files_${userId}`, JSON.stringify(updatedSharedFiles));
    }
    
    // Show clear success message
    alert(`✅ Share link copied to clipboard!\n\nShare this link with others:\n${shareUrl}\n\nNote: This is a demo link. In a real app, this would allow others to access the file.`);
  } catch (error) {
    console.error('Error sharing file:', error);
    alert('❌ Error sharing file. Please try again.');
  }
  closeActionMenu();
};
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const event = { target: { files: droppedFiles } };
      handleFileUpload(event);
    }
  };

  // Helper function to get file type
  const getFileTypeFromMime = (mimeType) => {
    if (!mimeType) return 'file';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
    if (mimeType.includes('video')) return 'video';
    if (mimeType.includes('audio')) return 'audio';
    if (mimeType.includes('zip')) return 'archive';
    return 'file';
  };

  // File Type Icons with React Icons
  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'folder': return <FaFolder className="file-icon" />;
      case 'image': return <FaImage className="file-icon" />;
      case 'pdf': return <FaFilePdf className="file-icon" />;
      case 'document': return <FaFileAlt className="file-icon" />;
      case 'video': return <FaFilm className="file-icon" />;
      case 'audio': return <FaMusic className="file-icon" />;
      case 'archive': return <FaArchive className="file-icon" />;
      default: return <FaFileAlt className="file-icon" />;
    }
  };

  // Star Icon based on starred status
  const getStarIcon = (isStarred) => {
    return isStarred ? <FaStar className="star-icon" /> : <FaRegStar className="star-icon" />;
  };

  // Format File Size
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format Date
  const formatDate = (date) => {
    if (!date) return '';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format relative time (e.g., "2 hours ago", "Yesterday")
  const formatRelativeTime = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return formatDate(date);
  };

  // Action Menu Component
  const ActionMenu = ({ itemId, itemType, itemName, isStarred, onClose }) => {
    const handleAction = (action, e) => {
      if (e) e.stopPropagation();
      
      switch (action) {
        case 'download':
          if (itemType === 'file') {
            handleDownload(itemId, itemName);
          }
          break;
        case 'share':
          if (itemType === 'file') {
            handleShare(itemId, itemName);
          }
          break;
        case 'star':
          handleToggleStar(itemId, itemType);
          break;
        case 'delete':
          if (itemType === 'file') {
            handleDeleteFile(itemId, itemName);
          } else {
            handleDeleteFolder(itemId, itemName);
          }
          break;
        case 'restore':
          handleRestore(itemId);
          break;
        case 'permanent-delete':
          handlePermanentDelete(itemId, itemName);
          break;
        default:
          break;
      }
    };

    const getMenuItems = () => {
      if (activeView === 'bin') {
        return [
          { label: 'Restore', action: 'restore', icon: <FaUndo /> },
          { label: 'Delete Permanently', action: 'permanent-delete', icon: <FaTrash />, danger: true }
        ];
      }

      const items = [];
      
      if (itemType === 'file') {
        items.push(
          { label: 'Download', action: 'download', icon: <FaDownload /> },
          { label: 'Share', action: 'share', icon: <FaShare /> }
        );
      }
      
      items.push(
        { label: isStarred ? 'Unstar' : 'Star', action: 'star', icon: isStarred ? <FaStar /> : <FaRegStar /> },
        { label: 'Move to Bin', action: 'delete', icon: <FaTrash />, danger: true }
      );

      return items;
    };

    return (
      <div className="action-menu">
        {getMenuItems().map((menuItem, index) => (
          <button
            key={index}
            className={`action-menu-item ${menuItem.danger ? 'danger' : ''}`}
            onClick={(e) => handleAction(menuItem.action, e)}
          >
            <span className="action-icon">{menuItem.icon}</span>
            <span>{menuItem.label}</span>
          </button>
        ))}
      </div>
    );
  };

  // Filter files and folders based on search
  const filteredFiles = (activeView === 'my-drive' && currentFolder) 
    ? getCurrentFolderFiles().filter(file => 
        file.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.originalName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : files.filter(file => 
        file.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.originalName?.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const filteredFolders = (activeView === 'my-drive' && currentFolder)
    ? getCurrentFolderFolders().filter(folder =>
        folder.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : folders.filter(folder =>
        folder.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const filteredSharedFiles = sharedFiles.filter(file =>
    file.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.originalName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter recent items based on search
  const filteredRecentItems = getRecentFiles().filter(item =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.originalName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter starred items based on search
  const filteredStarredItems = getStarredItems().filter(item =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.originalName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter bin items based on search
  const filteredBinItems = binItems.filter(item =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.originalName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Quick Access - Recently uploaded files (last 3)
  const quickAccessFiles = files.slice(0, 3);

  // Sidebar click handler
  const handleSidebarClick = (view) => {
    setActiveView(view);
    if (view !== 'my-drive') {
      setCurrentFolder(null);
      setFolderStack([]);
    }
    closeActionMenu();
    setSelectedItem(null);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading your files...</p>
      </div>
    );
  }

  return (
    <div className="drive-container">
      {/* Header */}
      <header className="drive-header">
        <div className="header-left">
          <div className="drive-logo">
  <img 
    src="/images/drive-logo.jpg" 
    alt="Drive Logo" 
    className="logo-image"
  />
  <span className="logo-text">Drive</span>
</div>
        </div>

        <div className="header-search">
          <div className="search-box">
            <div className="search-icon"><FaSearch /></div>
            <input 
              type="text" 
              placeholder="Search in Drive" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="header-right">
          <div className="user-info">
            <span>Welcome, {user?.name}</span>
          </div>
          <div className="user-avatar" onClick={onLogout}>
            <FaUser />
          </div>
        </div>
      </header>

      <div className="drive-content">
        {/* Sidebar */}
        <nav className="drive-sidebar">
          <div className="new-dropdown-container">
            <button 
              className="new-btn-sidebar"
              onClick={(e) => {
                e.stopPropagation();
                setShowNewDropdown(!showNewDropdown);
              }}
            >
              <FaPlus className="new-plus-icon" />
              <span className="new-text">New</span>
            </button>
            {showNewDropdown && (
              <div className="new-dropdown-menu">
                <button 
                  className="dropdown-item" 
                  onClick={() => {
                    handleCreateFolder();
                    setShowNewDropdown(false);
                  }}
                >
                  <FaFolderPlus className="dropdown-icon" />
                  <span>New folder</span>
                </button>
                <button 
                  className="dropdown-item" 
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowNewDropdown(false);
                  }}
                >
                  <FaUpload className="dropdown-icon" />
                  <span>File upload</span>
                </button>
              </div>
            )}
          </div>

          <div className="sidebar-section">
            <button 
              className={`sidebar-item ${activeView === 'my-drive' ? 'active' : ''}`}
              onClick={() => handleSidebarClick('my-drive')}
            >
              <span className="item-icon"><FaHdd /></span>
              <span>My Drive</span>
            </button>
            <button 
              className={`sidebar-item ${activeView === 'shared' ? 'active' : ''}`}
              onClick={() => handleSidebarClick('shared')}
            >
              <span className="item-icon"><FaUsers /></span>
              <span>Shared with me</span>
            </button>
            <button 
              className={`sidebar-item ${activeView === 'recent' ? 'active' : ''}`}
              onClick={() => handleSidebarClick('recent')}
            >
              <span className="item-icon"><FaClock /></span>
              <span>Recent</span>
            </button>
            <button 
              className={`sidebar-item ${activeView === 'starred' ? 'active' : ''}`}
              onClick={() => handleSidebarClick('starred')}
            >
              <span className="item-icon"><FaStar /></span>
              <span>Starred</span>
              <span className="starred-count">({getStarredItems().length})</span>
            </button>
            <button 
              className={`sidebar-item ${activeView === 'bin' ? 'active' : ''}`}
              onClick={() => handleSidebarClick('bin')}
            >
              <span className="item-icon"><FaTrashAlt /></span>
              <span>Bin</span>
              <span className="starred-count">({binItems.length})</span>
            </button>
          </div>

          <div className="storage-section">
            <div className="storage-info">
              <div className="storage-icon"><FaHdd /></div>
              <div className="storage-details">
                <div className="storage-text">Storage</div>
                <div className="storage-bar">
                  <div 
                    className="storage-progress" 
                    style={{ 
                      width: `${calculateStoragePercentage()}%`,
                      backgroundColor: calculateStoragePercentage() > 80 ? '#f44336' : 
                                      calculateStoragePercentage() > 60 ? '#ff9800' : '#4285f4'
                    }}
                  ></div>
                </div>
                <div className="storage-stats">
                  {formatFileSize(calculateStorageUsed())} of Local Storage used
                  {calculateStoragePercentage() > 80 && (
                    <span style={{color: '#f44336', marginLeft: '4px'}}>⚠️</span>
                  )}
                </div>
                <div className="storage-count">
                  {files.length} files • {folders.length} folders
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main 
          className="drive-main" 
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => setSelectedItem(null)}
        >
          {/* Toolbar */}
          <div className="main-toolbar">
            <div className="toolbar-left">
              {/* Breadcrumb navigation */}
              {activeView === 'my-drive' && (currentFolder || folderStack.length > 0) && (
                <div className="breadcrumb">
                  <button 
                    className="breadcrumb-item root" 
                    onClick={handleRootClick}
                    title="Go to My Drive"
                  >
                    <FaHdd /> My Drive
                  </button>
                  {currentFolder && (
                    <>
                      <span className="breadcrumb-separator">/</span>
                      <span className="breadcrumb-item current">
                        {getFolderName(currentFolder)}
                      </span>
                    </>
                  )}
                </div>
              )}
              
              <h1 className="page-title">
                {activeView === 'my-drive' 
                  ? (currentFolder ? getFolderName(currentFolder) : 'My Drive')
                  : activeView === 'shared' ? 'Shared with me' :
                  activeView === 'recent' ? 'Recent' :
                  activeView === 'starred' ? 'Starred' :
                  activeView === 'bin' ? 'Bin' : 'My Drive'
                }
              </h1>
              
              <div className="content-stats">
                {activeView === 'my-drive' 
                  ? `${(currentFolder ? getCurrentFolderFiles() : files).length} files • ${(currentFolder ? getCurrentFolderFolders() : folders).length} folders${currentFolder ? ' in this folder' : ''}`
                  : activeView === 'shared'
                  ? `${sharedFiles.length} shared files`
                  : activeView === 'recent'
                  ? `${getRecentFiles().length} recent items`
                  : activeView === 'starred'
                  ? `${getStarredItems().length} starred items`
                  : activeView === 'bin'
                  ? `${binItems.length} items in bin`
                  : `${files.length} files • ${folders.length} folders`
                }
              </div>
            </div>
            <div className="toolbar-right">
              {/* Back button for folder navigation */}
              {activeView === 'my-drive' && (currentFolder || folderStack.length > 0) && (
                <button 
                  className="toolbar-btn back-btn"
                  onClick={handleBackClick}
                  title="Go back"
                >
                  <span className="btn-icon"><FaArrowLeft /></span>
                  Back
                </button>
              )}
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                style={{ display: 'none' }}
              />

              {activeView === 'bin' && binItems.length > 0 && (
                <button 
                  className="toolbar-btn empty-bin-btn"
                  onClick={handleEmptyBin}
                >
                  <span className="btn-icon"><FaBroom /></span>
                  Empty Bin
                </button>
              )}

              {/* View controls */}
              {(activeView === 'my-drive' || activeView === 'recent' || activeView === 'starred') && (
                <div className="view-controls">
                  <button 
                    className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewMode('list');
                    }}
                    title="List view"
                  >
                    <FaList />
                  </button>
                  <button 
                    className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewMode('grid');
                    }}
                    title="Grid view"
                  >
                    <FaTh />
                  </button>
                </div>
              )}

              {/* Info details toggle */}
              <button 
                className={`toolbar-btn info-toggle-btn ${showDetails ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(!showDetails);
                }}
                title="View details"
              >
                <FaInfoCircle />
              </button>
            </div>
          </div>

          <div className="drive-main-container">
            <div className="drive-main-canvas">
              {/* My Drive View */}
              {activeView === 'my-drive' && (
                <>
                  {/* Quick Access - Only show if there are files and we're in root */}
                  {quickAccessFiles.length > 0 && !currentFolder && (
                    <section className="quick-access">
                      <h2 className="section-title">Quick access</h2>
                      <div className="quick-access-grid">
                        {quickAccessFiles.map(file => (
                          <div 
                            key={file._id || file.id} 
                            className={`quick-item ${selectedItem && (selectedItem._id === file._id || selectedItem.id === file.id) ? 'selected' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem({ ...file, itemType: 'file' });
                            }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setPreviewFile(file);
                            }}
                          >
                            <div className={`item-icon ${file.type}`}>
                              {getFileIcon(file.type)}
                            </div>
                            <div className="item-info">
                              <div className="item-name">{file.name || file.originalName}</div>
                              <div className="item-details">
                                <span className="file-type-badge">{file.type.toUpperCase()}</span>
                                <span>Uploaded {formatDate(file.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Folders Section - Only show if there are folders */}
                  {filteredFolders.length > 0 && (
                    <section className="folders-section">
                      <h2 className="section-title">Folders</h2>
                      <div className="folders-grid">
                        {filteredFolders.map(folder => (
                          <div 
                            key={folder._id || folder.id} 
                            className={`folder-card ${selectedItem && (selectedItem._id === folder._id || selectedItem.id === folder.id) ? 'selected' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem({ ...folder, itemType: 'folder' });
                            }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              handleFolderClick(folder._id || folder.id);
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="folder-icon">
                              {getFileIcon('folder')}
                            </div>
                            <div className="folder-info">
                              <div className="folder-name">{folder.name}</div>
                              <div className="folder-details">
                                {folder.fileCount || 0} items • Created {formatDate(folder.createdAt)}
                              </div>
                            </div>
                            <div className="folder-actions">
                              <button 
                                className="action-btn star-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleStar(folder._id || folder.id, 'folder');
                                }}
                                title={folder.starred ? 'Unstar' : 'Star'}
                              >
                                {getStarIcon(folder.starred)}
                              </button>
                              <div className="action-menu-container">
                                <button 
                                  className="action-menu-btn"
                                  onClick={(e) => toggleActionMenu(folder._id || folder.id, e)}
                                  title="More actions"
                                >
                                  <FaEllipsisV />
                                </button>
                                {activeActionMenu === (folder._id || folder.id) && (
                                  <ActionMenu
                                    itemId={folder._id || folder.id}
                                    itemType="folder"
                                    itemName={folder.name}
                                    isStarred={folder.starred}
                                    onClose={closeActionMenu}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Files Section */}
                  <section className="files-section">
                    <div className="files-header">
                      <h2 className="section-title">
                        Files {filteredFiles.length > 0 && `(${filteredFiles.length})`}
                      </h2>
                    </div>

                    {files.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon"><FaFolder /></div>
                        <h3>No files uploaded yet</h3>
                        <p>Upload your first file to get started</p>
                        <button 
                          className="upload-btn"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Upload Your First File
                        </button>
                      </div>
                    ) : filteredFiles.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon"><FaSearch /></div>
                        <h3>No files found</h3>
                        <p>Try a different search term</p>
                      </div>
                    ) : viewMode === 'list' ? (
                      // List View
                      <div className="files-table">
                        <div className="table-header">
                          <div className="col-star"></div>
                          <div className="col-name">Name</div>
                          <div className="col-type">Type</div>
                          <div className="col-owner">Owner</div>
                          <div className="col-modified">Last modified</div>
                          <div className="col-size">File size</div>
                          <div className="col-actions">Actions</div>
                        </div>
                        
                        <div className="table-body">
                          {filteredFiles.map(file => (
                            <div 
                              key={file._id || file.id} 
                              className={`table-row ${selectedItem && (selectedItem._id === file._id || selectedItem.id === file.id) ? 'selected' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedItem({ ...file, itemType: 'file' });
                              }}
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                setPreviewFile(file);
                              }}
                            >
                              <div className="col-star">
                                <button 
                                  className="star-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleStar(file._id || file.id, 'file');
                                  }}
                                  title={file.starred ? 'Unstar' : 'Star'}
                                >
                                  {getStarIcon(file.starred)}
                                </button>
                              </div>
                              <div className="col-name">
                                <div className="file-item">
                                  <div className="file-icon">
                                    {getFileIcon(file.type)}
                                  </div>
                                  <div className="file-info">
                                    <div className="file-name">{file.name || file.originalName}</div>
                                  </div>
                                </div>
                              </div>
                              <div className="col-type">
                                <span className="file-type-badge">{file.type.toUpperCase()}</span>
                              </div>
                              <div className="col-owner">
                                <span className="owner-badge">{file.uploadedBy || 'You'}</span>
                              </div>
                              <div className="col-modified">
                                {file.lastModified || formatDate(file.updatedAt) || formatDate(file.createdAt)}
                              </div>
                              <div className="col-size">
                                {formatFileSize(file.size)}
                              </div>
                              <div className="col-actions">
                                <div className="action-menu-container">
                                  <button 
                                    className="action-menu-btn"
                                    onClick={(e) => toggleActionMenu(file._id || file.id, e)}
                                    title="More actions"
                                  >
                                    <FaEllipsisV />
                                  </button>
                                  {activeActionMenu === (file._id || file.id) && (
                                    <ActionMenu
                                      itemId={file._id || file.id}
                                      itemType="file"
                                      itemName={file.name || file.originalName}
                                      isStarred={file.starred}
                                      onClose={closeActionMenu}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      // Grid View - Files Only
                      <div className="files-grid-view">
                        {filteredFiles.map(file => (
                          <div 
                            key={file._id || file.id} 
                            className={`grid-item ${selectedItem && (selectedItem._id === file._id || selectedItem.id === file.id) ? 'selected' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem({ ...file, itemType: 'file' });
                            }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setPreviewFile(file);
                            }}
                          >
                            <div className="grid-header">
                              <button 
                                className="star-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleStar(file._id || file.id, 'file');
                                }}
                                title={file.starred ? 'Unstar' : 'Star'}
                              >
                                {getStarIcon(file.starred)}
                              </button>
                            </div>
                            <div className="grid-icon">
                              {getFileIcon(file.type)}
                            </div>
                            <div className="grid-content">
                              <div className="grid-name" title={file.name || file.originalName}>
                                {file.name || file.originalName}
                              </div>
                              <div className="grid-type">
                                <span className="type-badge">{file.type.toUpperCase()}</span>
                              </div>
                              <div className="grid-details">
                                <span className="grid-size">{formatFileSize(file.size)}</span>
                                <span className="grid-date">
                                  {formatDate(file.createdAt)}
                                </span>
                              </div>
                            </div>
                            <div className="grid-actions">
                              <div className="action-menu-container">
                                <button 
                                  className="action-menu-btn"
                                  onClick={(e) => toggleActionMenu(file._id || file.id, e)}
                                  title="More actions"
                                >
                                  <FaEllipsisV />
                                </button>
                                {activeActionMenu === (file._id || file.id) && (
                                  <ActionMenu
                                    itemId={file._id || file.id}
                                    itemType="file"
                                    itemName={file.name || file.originalName}
                                    isStarred={file.starred}
                                    onClose={closeActionMenu}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              )}

              {/* Shared with me View */}
              {activeView === 'shared' && (
                <section className="files-section">
                  <div className="files-header">
                    <h2 className="section-title">
                      Shared with me {sharedFiles.length > 0 && `(${sharedFiles.length})`}
                    </h2>
                  </div>

                  {sharedFiles.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon"><FaUsers /></div>
                      <h3>No shared files</h3>
                      <p>Files shared with you will appear here</p>
                    </div>
                  ) : filteredSharedFiles.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon"><FaSearch /></div>
                      <h3>No shared files found</h3>
                      <p>Try a different search term</p>
                    </div>
                  ) : (
                    <div className="files-table">
                      <div className="table-header">
                        <div className="col-name">Name</div>
                        <div className="col-type">Type</div>
                        <div className="col-shared-by">Shared by</div>
                        <div className="col-shared-date">Shared on</div>
                        <div className="col-size">File size</div>
                        <div className="col-actions">Actions</div>
                      </div>
                      
                      <div className="table-body">
                        {filteredSharedFiles.map(file => (
                          <div 
                            key={file._id || file.id} 
                            className={`table-row ${selectedItem && (selectedItem._id === file._id || selectedItem.id === file.id) ? 'selected' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem({ ...file, itemType: 'file', shared: true });
                            }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setPreviewFile(file);
                            }}
                          >
                            <div className="col-name">
                              <div className="file-item">
                                <div className="file-icon">
                                  {getFileIcon(file.type)}
                                </div>
                                <div className="file-info">
                                  <div className="file-name">{file.name || file.originalName}</div>
                                  <div className="file-type-badge">{file.type.toUpperCase()}</div>
                                </div>
                              </div>
                            </div>
                            <div className="col-type">
                              <span className="file-type-badge">{file.type.toUpperCase()}</span>
                            </div>
                            <div className="col-shared-by">
                              <span className="shared-by-badge">{file.sharedBy}</span>
                            </div>
                            <div className="col-shared-date">
                              {formatDate(file.sharedAt)}
                            </div>
                            <div className="col-size">
                              {formatFileSize(file.size)}
                            </div>
                            <div className="col-actions">
                              <div className="action-menu-container">
                                <button 
                                  className="action-menu-btn"
                                  onClick={(e) => toggleActionMenu(file._id || file.id, e)}
                                  title="More actions"
                                >
                                  <FaEllipsisV />
                                </button>
                                {activeActionMenu === (file._id || file.id) && (
                                  <ActionMenu
                                    itemId={file._id || file.id}
                                    itemType="file"
                                    itemName={file.name || file.originalName}
                                    isStarred={file.starred}
                                    onClose={closeActionMenu}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Recent View - List view only */}
              {activeView === 'recent' && (
                <section className="files-section">
                  <div className="files-header">
                    <h2 className="section-title">
                      Recent Files {getRecentFiles().length > 0 && `(${getRecentFiles().length})`}
                    </h2>
                  </div>

                  {getRecentFiles().length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon"><FaClock /></div>
                      <h3>No recent files</h3>
                      <p>Your recently uploaded files will appear here</p>
                    </div>
                  ) : filteredRecentItems.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon"><FaSearch /></div>
                      <h3>No recent files found</h3>
                      <p>Try a different search term</p>
                    </div>
                  ) : (
                    // List View for Recent Files
                    <div className="files-table">
                      <div className="table-header">
                        <div className="col-star"></div>
                        <div className="col-name">Name</div>
                        <div className="col-type">Type</div>
                        <div className="col-owner">Owner</div>
                        <div className="col-uploaded">Uploaded</div>
                        <div className="col-size">File size</div>
                        <div className="col-actions">Actions</div>
                      </div>
                      
                      <div className="table-body">
                        {filteredRecentItems.map(item => (
                          <div 
                            key={item._id || item.id} 
                            className={`table-row ${selectedItem && (selectedItem._id === item._id || selectedItem.id === item.id) ? 'selected' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem(item);
                            }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              if (item.itemType === 'folder') {
                                handleFolderClick(item._id || item.id);
                              } else {
                                setPreviewFile(item);
                              }
                            }}
                          >
                            <div className="col-star">
                              <button 
                                className="star-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleStar(item._id || item.id, item.itemType);
                                }}
                                title={item.starred ? 'Unstar' : 'Star'}
                              >
                                {getStarIcon(item.starred)}
                              </button>
                            </div>
                            <div className="col-name">
                              <div className="file-item">
                                <div className="file-icon">
                                  {getFileIcon(item.type)}
                                </div>
                                <div className="file-info">
                                  <div className="file-name">{item.name || item.originalName}</div>
                                  {item.itemType === 'folder' && (
                                    <div className="folder-badge">Folder</div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="col-type">
                              <span className="file-type-badge">
                                {item.itemType === 'folder' ? 'FOLDER' : item.type.toUpperCase()}
                              </span>
                            </div>
                            <div className="col-owner">
                              <span className="owner-badge">{item.uploadedBy || 'You'}</span>
                            </div>
                            <div className="col-uploaded">
                              {formatRelativeTime(item.createdAt)}
                            </div>
                            <div className="col-size">
                              {item.itemType === 'folder' ? '-' : formatFileSize(item.size)}
                            </div>
                            <div className="col-actions">
                              <div className="action-menu-container">
                                <button 
                                  className="action-menu-btn"
                                  onClick={(e) => toggleActionMenu(item._id || item.id, e)}
                                  title="More actions"
                                >
                                  <FaEllipsisV />
                                </button>
                                {activeActionMenu === (item._id || item.id) && (
                                  <ActionMenu
                                    itemId={item._id || item.id}
                                    itemType={item.itemType}
                                    itemName={item.name || item.originalName}
                                    isStarred={item.starred}
                                    onClose={closeActionMenu}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Starred View - List view only */}
              {activeView === 'starred' && (
                <section className="files-section">
                  <div className="files-header">
                    <h2 className="section-title">
                      Starred Items {getStarredItems().length > 0 && `(${getStarredItems().length})`}
                    </h2>
                  </div>

                  {getStarredItems().length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon"><FaStar /></div>
                      <h3>No starred items</h3>
                      <p>Star important files and folders to see them here</p>
                    </div>
                  ) : filteredStarredItems.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon"><FaSearch /></div>
                      <h3>No starred items found</h3>
                      <p>Try a different search term</p>
                    </div>
                  ) : (
                    // List View for Starred Items
                    <div className="files-table">
                      <div className="table-header">
                        <div className="col-star"></div>
                        <div className="col-name">Name</div>
                        <div className="col-type">Type</div>
                        <div className="col-owner">Owner</div>
                        <div className="col-modified">Last modified</div>
                        <div className="col-size">File size</div>
                        <div className="col-actions">Actions</div>
                      </div>
                      
                      <div className="table-body">
                        {filteredStarredItems.map(item => (
                          <div 
                            key={item._id || item.id} 
                            className={`table-row ${selectedItem && (selectedItem._id === item._id || selectedItem.id === item.id) ? 'selected' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem(item);
                            }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              if (item.itemType === 'folder') {
                                handleFolderClick(item._id || item.id);
                              } else {
                                setPreviewFile(item);
                              }
                            }}
                          >
                            <div className="col-star">
                              <button 
                                className="star-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleStar(item._id || item.id, item.itemType);
                                }}
                                title="Unstar"
                              >
                                {getStarIcon(true)}
                              </button>
                            </div>
                            <div className="col-name">
                              <div className="file-item">
                                <div className="file-icon">
                                  {getFileIcon(item.type)}
                                </div>
                                <div className="file-info">
                                  <div className="file-name">{item.name || item.originalName}</div>
                                  {item.itemType === 'folder' && (
                                    <div className="folder-badge">Folder</div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="col-type">
                              <span className="file-type-badge">
                                {item.itemType === 'folder' ? 'FOLDER' : item.type.toUpperCase()}
                              </span>
                            </div>
                            <div className="col-owner">
                              <span className="owner-badge">{item.uploadedBy || 'You'}</span>
                            </div>
                            <div className="col-modified">
                              {item.lastModified || formatDate(item.updatedAt) || formatDate(item.createdAt)}
                            </div>
                            <div className="col-size">
                              {item.itemType === 'folder' ? '-' : formatFileSize(item.size)}
                            </div>
                            <div className="col-actions">
                              <div className="action-menu-container">
                                <button 
                                  className="action-menu-btn"
                                  onClick={(e) => toggleActionMenu(item._id || item.id, e)}
                                  title="More actions"
                                >
                                  <FaEllipsisV />
                                </button>
                                {activeActionMenu === (item._id || item.id) && (
                                  <ActionMenu
                                    itemId={item._id || item.id}
                                    itemType={item.itemType}
                                    itemName={item.name || item.originalName}
                                    isStarred={item.starred}
                                    onClose={closeActionMenu}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Bin View - List view only */}
              {activeView === 'bin' && (
                <section className="files-section">
                  <div className="files-header">
                    <h2 className="section-title">
                      Bin {binItems.length > 0 && `(${binItems.length})`}
                    </h2>
                  </div>

                  {binItems.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon"><FaTrashAlt /></div>
                      <h3>Bin is empty</h3>
                      <p>Deleted files and folders will appear here</p>
                    </div>
                  ) : filteredBinItems.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon"><FaSearch /></div>
                      <h3>No items found in bin</h3>
                      <p>Try a different search term</p>
                    </div>
                  ) : (
                    <div className="files-table">
                      <div className="table-header">
                        <div className="col-name">Name</div>
                        <div className="col-type">Type</div>
                        <div className="col-deleted">Deleted</div>
                        <div className="col-size">File size</div>
                        <div className="col-actions">Actions</div>
                      </div>
                      
                      <div className="table-body">
                        {filteredBinItems.map(item => (
                          <div 
                            key={item._id || item.id} 
                            className={`table-row ${selectedItem && (selectedItem._id === item._id || selectedItem.id === item.id) ? 'selected' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem(item);
                            }}
                          >
                            <div className="col-name">
                              <div className="file-item">
                                <div className="file-icon">
                                  {getFileIcon(item.type)}
                                </div>
                                <div className="file-info">
                                  <div className="file-name">{item.name || item.originalName}</div>
                                  {item.itemType === 'folder' && (
                                    <div className="folder-badge">Folder</div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="col-type">
                              <span className="file-type-badge">
                                {item.itemType === 'folder' ? 'FOLDER' : item.type.toUpperCase()}
                              </span>
                            </div>
                            <div className="col-deleted">
                              {formatRelativeTime(item.deletedAt)}
                            </div>
                            <div className="col-size">
                              {item.itemType === 'folder' ? '-' : formatFileSize(item.size)}
                            </div>
                            <div className="col-actions">
                              <div className="action-menu-container">
                                <button 
                                  className="action-menu-btn"
                                  onClick={(e) => toggleActionMenu(item._id || item.id, e)}
                                  title="More actions"
                                >
                                  <FaEllipsisV />
                                </button>
                                {activeActionMenu === (item._id || item.id) && (
                                  <ActionMenu
                                    itemId={item._id || item.id}
                                    itemType={item.itemType}
                                    itemName={item.name || item.originalName}
                                    isStarred={item.starred}
                                    onClose={closeActionMenu}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* Right Collapsible Details Panel */}
            {showDetails && (
              <div className="details-panel" onClick={(e) => e.stopPropagation()}>
                <div className="details-panel-header">
                  <h3>Details</h3>
                  <button className="details-close-btn" onClick={() => setShowDetails(false)}>
                    <FaTimes />
                  </button>
                </div>
                {selectedItem ? (
                  <div className="details-panel-body">
                    <div className="details-item-preview">
                      <div className={`details-preview-icon ${selectedItem.type}`}>
                        {getFileIcon(selectedItem.type)}
                      </div>
                      <div className="details-item-title">{selectedItem.name || selectedItem.originalName}</div>
                    </div>
                    
                    <div className="details-section-info">
                      <h4>Properties</h4>
                      <div className="details-row">
                        <span className="details-label">Type</span>
                        <span className="details-value">{selectedItem.itemType === 'folder' ? 'Folder' : selectedItem.type.toUpperCase()}</span>
                      </div>
                      <div className="details-row">
                        <span className="details-label">Size</span>
                        <span className="details-value">{selectedItem.itemType === 'folder' ? '-' : formatFileSize(selectedItem.size)}</span>
                      </div>
                      <div className="details-row">
                        <span className="details-label">Location</span>
                        <span className="details-value">{selectedItem.location || 'My Drive'}</span>
                      </div>
                      <div className="details-row">
                        <span className="details-label">Owner</span>
                        <span className="details-value">{selectedItem.uploadedBy || 'You'}</span>
                      </div>
                      <div className="details-row">
                        <span className="details-label">Created</span>
                        <span className="details-value">{formatDate(selectedItem.createdAt)}</span>
                      </div>
                      <div className="details-row">
                        <span className="details-label">Last Modified</span>
                        <span className="details-value">{selectedItem.lastModified || formatDate(selectedItem.createdAt)}</span>
                      </div>
                      <div className="details-row">
                        <span className="details-label">Starred</span>
                        <span className="details-value">{selectedItem.starred ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                    
                    <div className="details-panel-actions">
                      {selectedItem.itemType === 'file' && (
                        <>
                          <button 
                            className="details-action-btn primary"
                            onClick={() => handleDownload(selectedItem._id || selectedItem.id, selectedItem.name)}
                          >
                            <FaDownload /> Download
                          </button>
                          <button 
                            className="details-action-btn"
                            onClick={() => handleShare(selectedItem._id || selectedItem.id, selectedItem.name)}
                          >
                            <FaShare /> Share Link
                          </button>
                        </>
                      )}
                      <button 
                        className="details-action-btn danger"
                        onClick={() => {
                          if (selectedItem.itemType === 'file') {
                            handleDeleteFile(selectedItem._id || selectedItem.id, selectedItem.name);
                          } else {
                            handleDeleteFolder(selectedItem._id || selectedItem.id, selectedItem.name);
                          }
                          setSelectedItem(null);
                        }}
                      >
                        <FaTrash /> Move to Bin
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="details-panel-empty">
                    <FaInfoCircle className="details-empty-icon" />
                    <p>Select a file or folder to view details</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* File Preview Modal */}
          {previewFile && (
            <div className="preview-modal-overlay" onClick={() => setPreviewFile(null)}>
              <div className="preview-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="preview-modal-header">
                  <div className="preview-modal-title">
                    {getFileIcon(previewFile.type)}
                    <span>{previewFile.name || previewFile.originalName}</span>
                  </div>
                  <div className="preview-modal-actions">
                    <button 
                      className="preview-action-btn"
                      onClick={() => handleDownload(previewFile._id || previewFile.id, previewFile.name || previewFile.originalName)}
                      title="Download"
                    >
                      <FaDownload />
                    </button>
                    <button 
                      className="preview-action-btn"
                      onClick={() => handleShare(previewFile._id || previewFile.id, previewFile.name || previewFile.originalName)}
                      title="Share"
                    >
                      <FaShare />
                    </button>
                    <button 
                      className="preview-close-btn"
                      onClick={() => setPreviewFile(null)}
                      title="Close"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>
                <div className="preview-modal-body">
                  {previewFile.type === 'image' && (
                    <img src={previewFile.path || '/images/default-image.png'} alt={previewFile.name} className="modal-image-preview" />
                  )}
                  {previewFile.type === 'pdf' && (
                    <iframe src={previewFile.path} className="modal-pdf-preview" title="PDF Preview"></iframe>
                  )}
                  {previewFile.type === 'video' && (
                    <video src={previewFile.path} controls className="modal-video-preview"></video>
                  )}
                  {previewFile.type === 'audio' && (
                    <div className="modal-audio-container">
                      <FaMusic className="audio-large-icon" />
                      <audio src={previewFile.path} controls className="modal-audio-preview"></audio>
                    </div>
                  )}
                  {previewFile.type !== 'image' && previewFile.type !== 'pdf' && previewFile.type !== 'video' && previewFile.type !== 'audio' && (
                    <div className="preview-no-support">
                      <div className="preview-no-support-icon">
                        {getFileIcon(previewFile.type)}
                      </div>
                      <h3>No preview available</h3>
                      <p>Preview is not supported for this file type ({previewFile.type.toUpperCase()}).</p>
                      <button 
                        className="g-button g-button-primary"
                        onClick={() => handleDownload(previewFile._id || previewFile.id, previewFile.name || previewFile.originalName)}
                      >
                        <FaDownload /> Download to View
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Drag & Drop Visual Overlay */}
          {isDragging && (
            <div className="drag-drop-overlay" onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
              <div className="drag-drop-message">
                <FaCloud className="upload-cloud-icon" />
                <h3>Drop files to upload them to {currentFolder ? `"${getFolderName(currentFolder)}"` : 'My Drive'}</h3>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;