## 💻 Muse.ai Backend Service

This repository contains the server-side logic and API for **Muse.ai**, a full-stack AI SaaS platform. It handles all core functionalities, including user authentication, database management, usage metering, and integration with third-party AI/ML services.

### 📌 Architecture Overview

The backend is built using a **Node.js** and **Express.js** stack and follows a modular design. Key architectural features include:

* **Technology Stack:** Node.js, Express, Neon PostgreSQL, Clerk (Auth).
* **Service Integration:** It acts as an intermediary, managing API calls to Google Gemini, ClipDrop, and Cloudinary for AI features.
* **Middleware Pipeline:** All API requests pass through a robust middleware chain for:
    1.  **Authentication:** Using Clerk for session validation.
    2.  **Authorization:** Assigning user plan and usage data (`req.plan`, `req.free_usage`).
    3.  **Usage Limiting:** Enforcing the free/premium tier constraints.
    4.  **File Handling:** Using Multer for processing file uploads (images, PDFs).
* **Database:** **Neon PostgreSQL** is used for persistent storage of user and usage data.

### 🔗 API Endpoints

The server exposes the following endpoints, with authorization and usage checks enforced by middleware:

| Feature | Endpoint | Method | Authorization |
| :--- | :--- | :--- | :--- |
| **Article Generator** | `/api/article` | POST | Free Usage Check |
| **Blog Title Generator** | `/api/blog-title` | POST | Free Usage Check |
| **AI Image Generator** | `/api/generate-image` | POST | Premium Only |
| **Background Remover** | `/api/remove-bg` | POST | Premium Only |
| **Object Remover** | `/api/remove-object` | POST | Premium Only |
| **Resume Reviewer** | `/api/review-resume` | POST | Premium Only |

### 🛠️ Local Setup

1.  **Clone:** `git clone [this-repo-link] muse-backend`
2.  **Install:** `npm install`
3.  **Environment:** Configure your `.env` file with the required keys (PORT, CLERK\_SECRET\_KEY, NEON\_DB\_URL, GEMINI\_API\_KEY, CLIPDROP\_API\_KEY, CLOUDINARY\_* keys).
4.  **Run:** `npm start` (or `npm run dev` for development)

---

### 📚 Full Project Documentation

For a comprehensive overview of the entire Muse.ai platform, including the frontend setup, detailed feature list, and system design diagrams, please refer to the **main project repository**:

👉 **[Muse.ai Main Documentation Link](https://github.com/aradhyaxd-git/muse_ai_frontend)**
