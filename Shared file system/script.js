// Admin users list
const ADMIN_USERS = ['admin@example.com', 'superuser@example.com', 'manager@example.com'];

// Google Drive configuration
const GOOGLE_DRIVE_FOLDER_ID = '19wUQclQIsYucELwsw5gd0yKA83qwXDrg';
const GOOGLE_API_KEY = 'AIzaSyDGflU3Mu1PiGdpqvJHPtCrAV1EffLv3Yo';

// Global variables
let currentUser = null;
let isAdmin = false;
let gapiInitialized = false;

// DOM elements
const usernameInput = document.getElementById('username');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const loggedInUserSpan = document.getElementById('logged-in-user');
const adminControls = document.getElementById('admin-controls');
const addFileBtn = document.getElementById('add-file-btn');
const filesContainer = document.getElementById('files-container');
const uploadModal = document.getElementById('upload-modal');
const closeModal = document.querySelector('.close');
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-btn');
const progressContainer = document.getElementById('progress-container');
const uploadProgress = document.getElementById('upload-progress');
const progressText = document.getElementById('progress-text');

// Event listeners
loginBtn.addEventListener('click', handleLogin);
logoutBtn.addEventListener('click', handleLogout);
addFileBtn.addEventListener('click', () => uploadModal.style.display = 'block');
closeModal.addEventListener('click', () => uploadModal.style.display = 'none');
uploadBtn.addEventListener('click', handleUpload);

// Drag and drop events
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
});

['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
});

dropArea.addEventListener('drop', handleDrop, false);
dropArea.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFiles);

// Initialize Google API
function initGoogleAPI() {
    gapi.load('client:auth2', () => {
        gapi.client.init({
            apiKey: GOOGLE_API_KEY,
            clientId: 'YOUR_CLIENT_ID.apps.googleusercontent.com', // You'll need to provide this
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            scope: 'https://www.googleapis.com/auth/drive.file'
        }).then(() => {
            gapiInitialized = true;
            console.log('Google API initialized');
            // Load files after API is initialized
            if (currentUser) loadFiles();
        }).catch(error => {
            console.error('Error initializing Google API', error);
        });
    });
}

// Initialize the app
function initApp() {
    // Check if user is already logged in (from sessionStorage)
    const savedUser = sessionStorage.getItem('driveFileManagerUser');
    if (savedUser) {
        currentUser = savedUser;
        isAdmin = ADMIN_USERS.includes(savedUser);
        updateUI();
        // Files will be loaded after Google API initializes
    }
    
    // Initialize Google API
    initGoogleAPI();
}

// Handle login
function handleLogin() {
    const username = usernameInput.value.trim();
    if (!username) {
        alert('Please enter a username');
        return;
    }
    
    currentUser = username;
    isAdmin = ADMIN_USERS.includes(username);
    
    // Save to session storage
    sessionStorage.setItem('driveFileManagerUser', username);
    
    updateUI();
    
    // Load files if API is ready, otherwise it will load when API initializes
    if (gapiInitialized) {
        loadFiles();
    }
}

// Handle logout
function handleLogout() {
    currentUser = null;
    isAdmin = false;
    sessionStorage.removeItem('driveFileManagerUser');
    filesContainer.innerHTML = '';
    updateUI();
}

// Update UI based on login state
function updateUI() {
    if (currentUser) {
        usernameInput.style.display = 'none';
        loginBtn.style.display = 'none';
        loggedInUserSpan.textContent = `Logged in as: ${currentUser}`;
        loggedInUserSpan.style.display = 'inline';
        logoutBtn.style.display = 'inline';
        
        if (isAdmin) {
            adminControls.style.display = 'block';
        } else {
            adminControls.style.display = 'none';
        }
    } else {
        usernameInput.style.display = 'inline';
        loginBtn.style.display = 'inline';
        loggedInUserSpan.style.display = 'none';
        logoutBtn.style.display = 'none';
        adminControls.style.display = 'none';
    }
}

// Load files from Google Drive
function loadFiles() {
    if (!gapiInitialized) {
        console.error('Google API not initialized');
        return;
    }
    
    // Clear existing files
    filesContainer.innerHTML = '<div class="loading">Loading files...</div>';
    
    // Query files from the specific folder
    gapi.client.drive.files.list({
        q: `'${GOOGLE_DRIVE_FOLDER_ID}' in parents`,
        pageSize: 100,
        fields: 'files(id, name, webViewLink, createdTime, mimeType, iconLink)',
        orderBy: 'createdTime desc'
    }).then(response => {
        filesContainer.innerHTML = ''; // Clear loading message
        
        const files = response.result.files;
        if (files.length === 0) {
            filesContainer.innerHTML = '<div class="no-files">No files found in this folder.</div>';
            return;
        }
        
        files.forEach(file => {
            const fileElement = createFileElement(file);
            filesContainer.appendChild(fileElement);
        });
    }).catch(error => {
        console.error('Error loading files', error);
        filesContainer.innerHTML = '<div class="error">Error loading files. Please try again.</div>';
    });
}

// Create file element
function createFileElement(file) {
    const fileElement = document.createElement('div');
    fileElement.className = 'file-item';
    fileElement.dataset.id = file.id;
    
    const fileIcon = document.createElement('img');
    fileIcon.src = file.iconLink || 'https://drive-thirdparty.googleusercontent.com/16/type/application/vnd.google-apps.document';
    fileIcon.alt = 'File icon';
    fileIcon.style.width = '40px';
    fileIcon.style.height = '40px';
    fileIcon.style.marginBottom = '10px';
    
    const fileName = document.createElement('div');
    fileName.className = 'file-name';
    fileName.textContent = file.name;
    
    const fileDate = document.createElement('div');
    fileDate.className = 'file-date';
    fileDate.textContent = new Date(file.createdTime).toLocaleDateString();
    
    const fileActions = document.createElement('div');
    fileActions.className = 'file-actions';
    
    const viewBtn = document.createElement('button');
    viewBtn.className = 'view-btn';
    viewBtn.textContent = 'View';
    viewBtn.addEventListener('click', () => {
        window.open(file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`, '_blank');
    });
    
    fileActions.appendChild(viewBtn);
    
    if (isAdmin) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => {
            if (confirm(`Are you sure you want to delete ${file.name}?`)) {
                deleteFile(file.id, fileElement);
            }
        });
        fileActions.appendChild(deleteBtn);
    }
    
    fileElement.appendChild(fileIcon);
    fileElement.appendChild(fileName);
    fileElement.appendChild(fileDate);
    fileElement.appendChild(fileActions);
    
    return fileElement;
}

// Delete file
function deleteFile(fileId, fileElement) {
    gapi.client.drive.files.delete({
        fileId: fileId
    }).then(() => {
        fileElement.remove();
    }).catch(error => {
        console.error('Error deleting file', error);
        alert('Error deleting file');
    });
}

// Upload file
function handleUpload() {
    if (!fileInput.files.length) {
        alert('Please select a file to upload');
        return;
    }
    
    const file = fileInput.files[0];
    uploadFile(file);
}

// Upload file to Google Drive
function uploadFile(file) {
    // Show progress
    progressContainer.style.display = 'block';
    uploadProgress.value = 0;
    progressText.textContent = '0%';
    
    // Create file element in uploading state
    const fileElement = document.createElement('div');
    fileElement.className = 'file-item uploading';
    fileElement.dataset.id = 'uploading-' + Date.now();
    
    const fileIcon = document.createElement('img');
    fileIcon.src = 'https://drive-thirdparty.googleusercontent.com/16/type/application/octet-stream';
    fileIcon.alt = 'File icon';
    fileIcon.style.width = '40px';
    fileIcon.style.height = '40px';
    fileIcon.style.marginBottom = '10px';
    
    const fileName = document.createElement('div');
    fileName.className = 'file-name';
    fileName.textContent = file.name;
    
    const fileDate = document.createElement('div');
    fileDate.className = 'file-date';
    fileDate.textContent = 'Uploading...';
    
    fileElement.appendChild(fileIcon);
    fileElement.appendChild(fileName);
    fileElement.appendChild(fileDate);
    filesContainer.prepend(fileElement);
    
    const metadata = {
        name: file.name,
        mimeType: file.type,
        parents: [GOOGLE_DRIVE_FOLDER_ID]
    };
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const base64Data = e.target.result.split(',')[1];
        
        gapi.client.drive.files.create({
            resource: metadata,
            media: {
                mimeType: file.type,
                body: base64Data
            },
            fields: 'id,name,webViewLink,createdTime,mimeType,iconLink'
        }).then(response => {
            // Upload complete
            progressContainer.style.display = 'none';
            uploadModal.style.display = 'none';
            
            // Remove the uploading element
            fileElement.remove();
            
            // Create and add the new file element
            const newFileElement = createFileElement(response.result);
            filesContainer.prepend(newFileElement);
            
            // Reset file input
            fileInput.value = '';
        }).catch(error => {
            console.error('Error uploading file', error);
            alert('Error uploading file');
            progressContainer.style.display = 'none';
            fileElement.remove();
        });
    };
    reader.readAsDataURL(file);
    
    // Track upload progress (simulated since gapi doesn't provide progress events)
    let progress = 0;
    const interval = setInterval(() => {
        progress += 5;
        if (progress > 90) return;
        uploadProgress.value = progress;
        progressText.textContent = `${progress}%`;
    }, 200);
    
    // Clear interval when upload completes
    setTimeout(() => {
        clearInterval(interval);
    }, 10000);
}

// Drag and drop functions
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight() {
    dropArea.classList.add('highlight');
}

function unhighlight() {
    dropArea.classList.remove('highlight');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    fileInput.files = files;
    handleFiles();
}

function handleFiles() {
    if (fileInput.files.length) {
        uploadBtn.disabled = false;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);