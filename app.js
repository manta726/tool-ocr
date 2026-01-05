// ==================== STATE ====================
const state = {
  apiKey: '',
  files: []
};

// ==================== DOM HELPERS ====================
const $ = (sel) => document.querySelector(sel);

// ==================== UTILITY FUNCTIONS ====================
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });
}

function resizeImage(file, maxWidth = 1536) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          const resizedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(resizedFile);
        }, 'image/jpeg', 0.9);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  setupEventListeners();
});

// ==================== SETTINGS ====================
function loadSettings() {
  try {
    const saved = localStorage.getItem('passportOcrSettings');
    if (saved) {
      const settings = JSON.parse(saved);
      state.apiKey = settings.apiKey || '';
      
      if ($('#apiKey')) {
        $('#apiKey').value = state.apiKey;
      }
      
      if (state.apiKey) {
        showMainApp();
      }
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
}

function saveSettings() {
  localStorage.setItem('passportOcrSettings', JSON.stringify({
    apiKey: state.apiKey
  }));
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
  // Settings
  $('#saveApiBtn')?.addEventListener('click', handleSaveApi);
  $('#toggleKey')?.addEventListener('click', togglePassword);
  $('#headerSettingsBtn')?.addEventListener('click', showSettings);
  
  // Upload
  const uploadArea = $('#uploadArea');
  if (uploadArea) {
    uploadArea.addEventListener('click', () => $('#fileInput')?.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
  }
  
  $('#fileInput')?.addEventListener('change', handleFileSelect);
  
  // Actions
  $('#exportBtn')?.addEventListener('click', exportExcel);
  $('#resetBtn')?.addEventListener('click', resetAll);
}

// ==================== API CONFIG ====================
function handleSaveApi() {
  let apiKey = $('#apiKey')?.value || '';
  apiKey = apiKey.trim();
  
  if (!apiKey) {
    showToast('Please enter your API key', 'error');
    return;
  }
  
  if (!apiKey.startsWith('AIza')) {
    showToast('Google AI key should start with "AIza..."', 'warning');
  }
  
  state.apiKey = apiKey;
  saveSettings();
  showMainApp();
  showToast('Settings saved! Ready to scan.');
}

function togglePassword() {
  const input = $('#apiKey');
  if (input) {
    input.type = input.type === 'password' ? 'text' : 'password';
  }
}

function showMainApp() {
  const apiSection = $('#apiSection');
  const mainApp = $('#mainApp');
  
  if (apiSection) apiSection.classList.add('hidden');
  if (mainApp) mainApp.classList.remove('hidden');
}

function showSettings() {
  const apiSection = $('#apiSection');
  const mainApp = $('#mainApp');
  
  if (apiSection) apiSection.classList.remove('hidden');
  if (mainApp) mainApp.classList.add('hidden');
}

// ==================== DRAG & DROP ====================
function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  $('#uploadArea')?.classList.add('dragover');
}

function handleDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  $('#uploadArea')?.classList.remove('dragover');
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  $('#uploadArea')?.classList.remove('dragover');
  
  if (e.dataTransfer?.files) {
    processFiles(e.dataTransfer.files);
  }
}

function handleFileSelect(e) {
  if (e.target?.files) {
    processFiles(e.target.files);
    e.target.value = '';
  }
}

// ==================== FILE PROCESSING ====================
async function processFiles(fileList) {
  if (!state.apiKey) {
    showToast('Please configure API key first', 'error');
    showSettings();
    return;
  }
  
  const validFiles = Array.from(fileList).filter(f => 
    f.type && f.type.startsWith('image/')
  );
  
  if (validFiles.length === 0) {
    showToast('Please upload image files (JPG, PNG, WebP)', 'error');
    return;
  }
  
  for (const file of validFiles) {
    const fileData = {
      id: generateId(),
      fileName: file.name,
      status: 'processing',
      data: {
        passportNo: '',
        fullName: '',
        dateOfBirth: '',
        placeOfBirth: '',
        dateOfIssue: '',
        dateOfExpiry: '',
        nationality: '',
        gender: '',
        issuingAuthority: ''
      },
      error: null
    };
    
    state.files.push(fileData);
    updateUI();
    
    try {
      const result = await extractWithGemini(file);
      fileData.data = result;
      fileData.status = 'success';
      showToast(`✅ Extracted: ${result.passportNo || file.name}`);
    } catch (err) {
      console.error('Extraction error:', err);
      fileData.error = err.message || 'Failed to extract';
      fileData.status = 'error';
      showToast(`❌ Failed: ${file.name}`, 'error');
    }
    
    updateUI();
  }
}

// ==================== GEMINI AI EXTRACTION ====================
async function extractWithGemini(imageFile) {
  showLoading('Analyzing with Gemini AI...', 'Extracting passport data...');
  
  try {
    // Resize image
    console.log('Original size:', (imageFile.size / 1024).toFixed(2), 'KB');
    const resizedImage = await resizeImage(imageFile, 1536);
    console.log('Resized size:', (resizedImage.size / 1024).toFixed(2), 'KB');
    
    const base64Full = await fileToBase64(resizedImage);
    const base64Only = base64Full.split(',')[1];
    
    // Short prompt
    const prompt = `Extract passport data. Respond with ONLY valid JSON, NO markdown:

{"passportNo":"","fullName":"","dateOfBirth":"DD MMM YYYY","placeOfBirth":"","dateOfIssue":"DD MMM YYYY","dateOfExpiry":"DD MMM YYYY","nationality":"","gender":"","issuingAuthority":""}

Read MRZ (bottom). Use "" for missing.`;
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${state.apiKey}`;
    
    const requestBody = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: resizedImage.type || 'image/jpeg',
              data: base64Only
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.05,
        maxOutputTokens: 4096,
        topP: 0.1,
        topK: 20
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ]
    };
    
    console.log('Sending request to Gemini AI...');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('API Error:', responseText);
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`API Error ${response.status}: ${responseText.substring(0, 200)}`);
      }
      
      const errorMsg = errorData.error?.message || errorData.message || `HTTP ${response.status}`;
      throw new Error(errorMsg);
    }
    
    const data = JSON.parse(responseText);
    console.log('Response received');
    
    // Extract content
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Invalid response:', data);
      
      if (data.candidates?.[0]?.finishReason === 'SAFETY') {
        throw new Error('Image blocked by safety filters');
      }
      
      throw new Error('Invalid response from Gemini AI');
    }
    
    let content = data.candidates[0].content.parts[0].text.trim();
    
    console.log('AI Response length:', content.length);
    console.log('Raw response:', content.substring(0, 300));
    
    // Parse JSON
    let structured;
    try {
      // Remove markdown code blocks
      if (content.includes('```')) {
        const match = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
        if (match) {
          content = match[1].trim();
        }
      }
      
      // Extract JSON object
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        content = jsonMatch[0];
      }
      
      structured = JSON.parse(content);
      console.log('✅ JSON parsed successfully:', structured);
    } catch (e) {
      console.warn('⚠️ JSON parse failed, using fallback');
      console.log('Failed content:', content);
      
      // Fallback: extract from text
      structured = {
        passportNo: extractPattern(content, /passport[^:]*:\s*"?([A-Z0-9]{6,12})/i) ||
                    extractPattern(content, /[A-Z]{1,2}[0-9]{7,9}/),
        fullName: extractPattern(content, /(?:name|surname)[^:]*:\s*"?([^"\n,]+(?:,\s*[^"\n,]+)?)/i),
        dateOfBirth: extractPattern(content, /birth[^:]*:\s*"?([0-9]{1,2}\s+[A-Z]{3}\s+[0-9]{4})/i),
        placeOfBirth: extractPattern(content, /place[^:]*:\s*"?([^"\n,]+)/i),
        dateOfIssue: extractPattern(content, /issue[^:]*:\s*"?([0-9]{1,2}\s+[A-Z]{3}\s+[0-9]{4})/i),
        dateOfExpiry: extractPattern(content, /expir[^:]*:\s*"?([0-9]{1,2}\s+[A-Z]{3}\s+[0-9]{4})/i),
        nationality: extractPattern(content, /nationality[^:]*:\s*"?([A-Z]{2,3})/i),
        gender: extractPattern(content, /gender[^:]*:\s*"?(Male|Female)/i),
        issuingAuthority: extractPattern(content, /(?:authority|issued by)[^:]*:\s*"?([^"\n,]+)/i)
      };
    }
    
    hideLoading();
    
    return normalizeData(structured);
    
  } catch (err) {
    hideLoading();
    console.error('Extraction error:', err);
    
    // User-friendly errors
    if (err.message.includes('401') || err.message.includes('API_KEY_INVALID')) {
      throw new Error('Invalid API key');
    } else if (err.message.includes('429') || err.message.includes('quota') || err.message.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('Quota exceeded. Please wait or try tomorrow.');
    } else if (err.message.includes('403')) {
      throw new Error('API access forbidden');
    } else if (err.message.includes('404')) {
      throw new Error('Model not found');
    } else if (err.message.includes('SAFETY')) {
      throw new Error('Image blocked by safety filters');
    }
    
    throw err;
  }
}

function extractPattern(text, pattern) {
  const match = text.match(pattern);
  return match ? match[1].trim().replace(/[",]/g, '') : '';
}

function normalizeData(data) {
  return {
    passportNo: String(data.passportNo || '').toUpperCase().trim(),
    fullName: String(data.fullName || '').trim(),
    dateOfBirth: String(data.dateOfBirth || '').trim(),
    placeOfBirth: String(data.placeOfBirth || '').trim(),
    dateOfIssue: String(data.dateOfIssue || '').trim(),
    dateOfExpiry: String(data.dateOfExpiry || '').trim(),
    nationality: String(data.nationality || '').trim(),
    gender: String(data.gender || '').trim(),
    issuingAuthority: String(data.issuingAuthority || '').trim()
  };
}

// ==================== UI UPDATES ====================
function updateUI() {
  const hasFiles = state.files.length > 0;
  
  $('#actionButtons')?.classList.toggle('hidden', !hasFiles);
  $('#resultsSection')?.classList.toggle('hidden', !hasFiles);
  
  const fileCount = $('#fileCount');
  if (fileCount) fileCount.textContent = state.files.length;
  
  renderTable();
}

function renderTable() {
  const tbody = $('#resultsBody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  state.files.forEach((f, index) => {
    const tr = document.createElement('tr');
    tr.className = f.status === 'error' ? 'row-error' : f.status === 'processing' ? 'row-processing' : '';
    
    const d = f.data;
    
    tr.innerHTML = `
      <td class="td-center">${index + 1}</td>
      <td class="td-file">
        <div class="file-info">
          <span class="file-name">${escapeHtml(f.fileName)}</span>
          ${f.status === 'processing' ? '<span class="file-status processing">Processing...</span>' : ''}
          ${f.status === 'error' ? `<span class="file-status error">${escapeHtml(f.error)}</span>` : ''}
        </div>
      </td>
      <td class="td-passport"><span class="passport-badge">${escapeHtml(d.passportNo)}</span></td>
      <td>${escapeHtml(d.fullName)}</td>
      <td>${escapeHtml(d.dateOfBirth)}</td>
      <td>${escapeHtml(d.placeOfBirth)}</td>
      <td>${escapeHtml(d.dateOfIssue)}</td>
      <td>${escapeHtml(d.dateOfExpiry)}</td>
      <td>${escapeHtml(d.nationality)}</td>
      <td>${escapeHtml(d.gender)}</td>
      <td>${escapeHtml(d.issuingAuthority)}</td>
      <td class="td-status">
        ${getStatusBadge(f.status)}
      </td>
    `;
    
    tbody.appendChild(tr);
  });
}

function getStatusBadge(status) {
  const badges = {
    processing: '<span class="badge badge-processing">⏳ Processing</span>',
    success: '<span class="badge badge-success">✅ Success</span>',
    error: '<span class="badge badge-error">❌ Failed</span>'
  };
  return badges[status] || '';
}

// ==================== EXPORT TO EXCEL ====================
function exportExcel() {
  if (state.files.length === 0) {
    showToast('No data to export', 'error');
    return;
  }
  
  try {
    // Check if XLSX library loaded
    if (typeof XLSX === 'undefined') {
      throw new Error('Excel library not loaded. Please refresh the page.');
    }
    
    // Prepare data untuk Excel
    const data = state.files.map((f, index) => {
      const d = f.data;
      return {
        'No': index + 1,
        'File Name': f.fileName,
        'Passport No': d.passportNo || '',
        'Full Name': d.fullName || '',
        'Date of Birth': d.dateOfBirth || '',
        'Place of Birth': d.placeOfBirth || '',
        'Date of Issue': d.dateOfIssue || '',
        'Date of Expiry': d.dateOfExpiry || '',
        'Nationality': d.nationality || '',
        'Gender': d.gender || '',
        'Issuing Authority': d.issuingAuthority || '',
        'Status': f.status === 'error' ? `ERROR: ${f.error}` : 
                  f.status === 'processing' ? 'Processing' : 'Success'
      };
    });
    
    // Buat workbook baru
    const wb = XLSX.utils.book_new();
    
    // Convert data ke worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Set column widths untuk readability
    const colWidths = [
      { wch: 5 },   // No
      { wch: 25 },  // File Name
      { wch: 15 },  // Passport No
      { wch: 25 },  // Full Name
      { wch: 15 },  // Date of Birth
      { wch: 20 },  // Place of Birth
      { wch: 15 },  // Date of Issue
      { wch: 15 },  // Date of Expiry
      { wch: 12 },  // Nationality
      { wch: 10 },  // Gender
      { wch: 30 },  // Issuing Authority
      { wch: 15 }   // Status
    ];
    ws['!cols'] = colWidths;
    
    // Tambahkan worksheet ke workbook dengan nama sheet
    XLSX.utils.book_append_sheet(wb, ws, 'Passport Data');
    
    // Generate filename dengan timestamp
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/T/, '_').replace(/:/g, '-');
    const filename = `LDB_Passport_OCR_${timestamp}.xlsx`;
    
    // Download file Excel
    XLSX.writeFile(wb, filename);
    
    console.log('✅ Excel exported:', filename);
    showToast(`Excel exported successfully! 📊 (${state.files.length} records)`);
    
  } catch (error) {
    console.error('Export error:', error);
    showToast(`Export failed: ${error.message}`, 'error');
  }
}

// ==================== RESET ALL ====================
function resetAll() {
  if (state.files.length === 0) return;
  if (!confirm('Delete all data? This cannot be undone.')) return;
  
  state.files = [];
  updateUI();
  showToast('All data cleared');
}

// ==================== LOADING ====================
function showLoading(title, subtitle) {
  const titleEl = $('#loadingTitle');
  const subtitleEl = $('#loadingSubtitle');
  const overlay = $('#loadingOverlay');
  
  if (titleEl) titleEl.textContent = title;
  if (subtitleEl) subtitleEl.textContent = subtitle;
  if (overlay) overlay.classList.remove('hidden');
}

function hideLoading() {
  const overlay = $('#loadingOverlay');
  if (overlay) {
    setTimeout(() => overlay.classList.add('hidden'), 300);
  }
}

// ==================== TOAST ====================
function showToast(message, type = 'success') {
  const toast = $('#toast');
  const toastMessage = $('#toastMessage');
  const toastIcon = $('#toastIcon');
  
  if (!toast || !toastMessage) return;
  
  toastMessage.textContent = message;
  
  if (toastIcon) {
    toastIcon.textContent = type === 'error' ? '✕' : type === 'warning' ? '⚠' : '✓';
  }
  
  toast.style.background = type === 'error' ? 'var(--red-500)' : 
                           type === 'warning' ? 'var(--amber-500)' : 
                           'var(--emerald-500)';
  
  toast.classList.remove('hidden');
  requestAnimationFrame(() => toast.classList.add('show'));
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, 3000);
}

// ==================== ERROR HANDLING ====================
window.addEventListener('error', (e) => {
  console.error('Global error:', e);
  hideLoading();
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled rejection:', e);
  hideLoading();
});

// ==================== CONSOLE INFO ====================
console.log(`
╔════════════════════════════════════╗
║  LDB Passport OCR v2.0             ║
║  Powered by Gemini 2.5 Flash       ║
║  Export: Excel (.xlsx)             ║
╚════════════════════════════════════╝
`);

// ==================== DEBUG ====================
window.passportOcr = {
  state,
  showToast,
  exportExcel,
  version: '2.0-excel'
};