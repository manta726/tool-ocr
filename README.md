# 🌟 LDB Paspor OCR - AI-Powered Passport Data Extractor

<div align="center">

![LDB Paspor OCR](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-purple?style=for-the-badge&logo=google)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Status](https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge)

**Ekstrak data paspor secara otomatis menggunakan Google Gemini AI**

[Demo Live](#demo) • [Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Demo](#demo)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Setup](#api-setup)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Browser Support](#browser-support)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [Contributing](#contributing)
- [License](#license)
- [Credits](#credits)

---

## 🎯 Overview

**LDB Paspor OCR** adalah aplikasi web modern yang dapat mengekstrak data dari foto paspor secara otomatis menggunakan teknologi AI terbaru dari Google (Gemini 2.5 Flash). Aplikasi ini dirancang untuk mempermudah proses digitalisasi data paspor dengan akurasi tinggi dan antarmuka yang user-friendly.

### 🎪 Key Highlights

- ⚡ **Fast Processing**: Ekstraksi data dalam 5-15 detik
- 🎯 **High Accuracy**: Powered by Google Gemini 2.5 Flash AI
- 📊 **Excel Export**: Export data langsung ke format .xlsx
- 🎨 **Modern UI**: Dark theme with glassmorphism design
- 📱 **Responsive**: Works perfectly on desktop, tablet, and mobile
- 🔒 **Privacy First**: Semua processing di cloud Google, data tidak disimpan
- 🆓 **100% Free**: No hidden costs, completely free to use

---

## ✨ Features

### 🔍 Core Features

- ✅ **Automatic Data Extraction**
  - Passport Number
  - Full Name
  - Date of Birth
  - Place of Birth
  - Date of Issue
  - Date of Expiry
  - Nationality
  - Gender
  - Issuing Authority

- 📤 **Multi-File Upload**
  - Drag & drop support
  - Multiple files at once
  - Supported formats: JPG, PNG, WebP

- 📊 **Data Management**
  - Real-time table display
  - Export to Excel (.xlsx)
  - Auto-numbered rows
  - Status tracking (Success/Processing/Failed)

- 🎨 **User Experience**
  - Beautiful dark theme UI
  - Animated gradients
  - Loading indicators
  - Toast notifications
  - Responsive design

### 🚀 Advanced Features

- **Auto Image Optimization**: Resize otomatis untuk hemat bandwidth
- **Smart Parsing**: Fallback extraction jika JSON parsing gagal
- **Error Handling**: User-friendly error messages
- **Local Storage**: API key tersimpan aman di browser
- **No Backend Required**: Pure frontend application

---

## 🎬 Demo

### Live Demo
**Coming Soon** - Deploy aplikasi dan tambahkan link di sini

### Local Demo
```bash
# Clone repository
git clone https://github.com/yourusername/ldb-passport-ocr.git

# Buka folder
cd ldb-passport-ocr

# Buka dengan Live Server atau HTTP server
# Option 1: VS Code Live Server
# Option 2: Python HTTP Server
python -m http.server 8080

# Buka browser: http://localhost:8080
