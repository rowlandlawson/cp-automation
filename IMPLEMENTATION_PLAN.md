# CP Automation - Complete Implementation Plan

**Stack:** Bun + Express | PostgreSQL (Neon) | Vanilla JS | Cloudinary

---

## 📋 PROJECT OVERVIEW

### Final Architecture

```
Public Website                Admin Dashboard             Backend Server
├── index.html        ←────→  ├── admin/               ├── Bun + Express
├── assets/                   │   ├── index.html        ├── PostgreSQL (Neon)
├── css/                      │   ├── css/              ├── JWT Auth
├── js/                       │   └── js/               ├── Image handling
└── main.js                   └── API calls             └── REST APIs
     ↓                                ↓                        ↓
  fetch()  ←─────────────────────────────────────────→ API Endpoints
```

---

## PHASE 1: SETUP & INFRASTRUCTURE (Days 1-2)

### 1.1 Create Backend Project Structure

**Goal:** Setup Bun project with all necessary folders

```bash
# Create backend directory
mkdir backend
cd backend
bun init -y

# Install dependencies
bun add express cors dotenv pg axios multer cloudinary sharp bcryptjs jsonwebtoken
bun add -d nodemon

# Create folder structure
mkdir routes controllers models middleware config
mkdir uploads
```

**Tasks:**

- [ ] Initialize Bun project
- [ ] Install all required packages
- [ ] Create folder structure
- [ ] Create `.env` file for secrets
- [ ] Create `.gitignore` file

### 1.2 Setup Environment Variables

**File:** `backend/.env`

```
DATABASE_URL=postgresql://user:password@neon.tech/dbname
PORT=5000
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=your_super_secret_jwt_key_here_change_this
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
NODE_ENV=development
```

**Tasks:**

- [ ] Get Neon Database connection string
- [ ] Get Cloudinary API credentials
- [ ] Create `.env` file
- [ ] Add to `.gitignore`

### 1.3 Setup Database (Neon)

**Tasks:**

- [ ] Create account at https://neon.tech
- [ ] Create new project
- [ ] Create database named `cp_automation`
- [ ] Copy connection string
- [ ] Test connection with psql CLI

**Database Naming Convention:**

```
Database: cp_automation
Tables:
- users (admins)
- projects (gallery projects)
- services (service offerings)
- products (product list)
- testimonials
- about (editable content)
- content_sections (reusable content blocks)
```

### 1.4 Setup Cloudinary

**Tasks:**

- [ ] Create account at https://cloudinary.com
- [ ] Navigate to Dashboard → Settings
- [ ] Copy: Cloud Name, API Key, API Secret
- [ ] Create upload preset (optional, for better security)

---

## PHASE 2: DATABASE DESIGN & MODELS (Days 3-4)

### 2.1 Database Schema Design

**File:** `backend/config/database.sql`

```sql
-- Users Table (Admins)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects Table (Gallery)
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  image_url VARCHAR(500),
  image_public_id VARCHAR(255),
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  features TEXT,
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services Table
CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon_name VARCHAR(100),
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content Sections Table (For editable text content)
CREATE TABLE content_sections (
  id SERIAL PRIMARY KEY,
  section_name VARCHAR(100) UNIQUE NOT NULL,
  content TEXT,
  updated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Testimonials Table
CREATE TABLE testimonials (
  id SERIAL PRIMARY KEY,
  quote TEXT NOT NULL,
  author VARCHAR(255),
  location VARCHAR(255),
  rating INTEGER DEFAULT 5,
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Tasks:**

- [ ] Review schema design
- [ ] Create tables in Neon database
- [ ] Setup indexes for performance
- [ ] Create backup strategy

### 2.2 Create Database Connection Module

**File:** `backend/config/db.ts`

```ts
import { Pool } from "pg";

import { env } from "./env";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("error", (error) => {
  console.error("Unexpected error on idle client", error);
});
```

**Tasks:**

- [ ] Create `db.ts` file
- [ ] Test database connection
- [ ] Create helper functions for queries

### 2.3 Create Models (Database Query Functions)

**Files to Create:**

- `backend/models/User.ts`
- `backend/models/Project.ts`
- `backend/models/Product.ts`
- `backend/models/Service.ts`
- `backend/models/ContentSection.ts`
- `backend/models/Testimonial.ts`

**Example:** `backend/models/Project.ts`

```ts
import { query, queryOne } from "../config/db";

export class Project {
  static async getAll() {
    const result = await query(
      "SELECT * FROM projects WHERE is_published = true ORDER BY order_index ASC",
    );
    return result.rows;
  }

  static async getById(id: number) {
    return queryOne("SELECT * FROM projects WHERE id = $1", [id]);
  }

  static async create(data: {
    title: string;
    description?: string | null;
    location?: string | null;
    image_url?: string | null;
    image_public_id?: string | null;
  }) {
    const result = await query(
      `
        INSERT INTO projects (title, description, location, image_url, image_public_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
      [
        data.title,
        data.description ?? null,
        data.location ?? null,
        data.image_url ?? null,
        data.image_public_id ?? null,
      ],
    );
    return result.rows[0];
  }
}
```

**Tasks:**

- [ ] Create all model files
- [ ] Implement CRUD methods for each model
- [ ] Test query functions

---

## PHASE 3: BACKEND API DEVELOPMENT (Days 5-8)

### 3.1 Authentication Setup

**File:** `backend/middleware/auth.ts`

```ts
import jwt from "jsonwebtoken";

export const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};
```

**Tasks:**

- [ ] Create authentication middleware
- [ ] Create login endpoint
- [ ] Create token generation function
- [ ] Test authentication flow

### 3.2 Create Route Files

**File:** `backend/routes/auth.ts` - Authentication

```ts
import { Router } from "express";
import bcryptjs from "bcryptjs";

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.getByUsername(username);

    if (!user || !(await bcryptjs.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**File:** `backend/routes/projects.ts` - Projects/Gallery

```ts
import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const projects = await Project.getAll();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const project = await Project.getById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", auth, uploadProjectImage, async (req, res) => {
  try {
    const projectData = {
      title: req.body.title,
      description: req.body.description,
      location: req.body.location,
      image_url: req.uploadedImage?.secureUrl || req.body.image_url,
      image_public_id: req.uploadedImage?.publicId || null,
    };
    const project = await Project.create(projectData);
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", auth, uploadProjectImage, async (req, res) => {
  try {
    const existingProject = await Project.getById(req.params.id);

    const projectData = {
      title: req.body.title || existingProject.title,
      description: req.body.description || existingProject.description,
      location: req.body.location || existingProject.location,
      image_url: req.uploadedImage?.secureUrl || req.body.image_url || existingProject.image_url,
      image_public_id: req.uploadedImage?.publicId || existingProject.image_public_id,
    };

    const project = await Project.update(req.params.id, projectData);
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const project = await Project.getById(req.params.id);
    if (project.image_public_id) {
      await deleteImageFromCloudinary(project.image_public_id);
    }
    await Project.delete(req.params.id);
    res.json({ message: "Project deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**File:** `backend/routes/products.ts` - Products
**File:** `backend/routes/services.ts` - Services
**File:** `backend/routes/testimonials.ts` - Testimonials
**File:** `backend/routes/content.ts` - Editable content

**Tasks:**

- [ ] Create all route files
- [ ] Implement GET, POST, PUT, DELETE endpoints
- [ ] Add authentication to admin routes
- [ ] Test all endpoints with Postman

### 3.3 Image Upload Handler

**File:** `backend/middleware/upload.ts`

```ts
import multer from "multer";
import sharp from "sharp";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// Then optimize with sharp and upload to Cloudinary in middleware
```

**Tasks:**

- [ ] Create upload handler
- [ ] Test image upload
- [ ] Setup image optimization

### 3.4 Main Express Server

**File:** `backend/index.ts`

```ts
import cors from "cors";
import express from "express";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/api/auth", authRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/products", productsRouter);
app.use("/api/services", servicesRouter);
app.use("/api/testimonials", testimonialsRouter);
app.use("/api/content", contentRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "API is running" });
});
```

**File:** `backend/package.json` - Add start script

```json
"scripts": {
  "start": "bun run index.ts",
  "dev": "bun --watch index.ts"
}
```

**Tasks:**

- [ ] Create main server file
- [ ] Test all API endpoints
- [ ] Setup error handling

---

## PHASE 4: ADMIN DASHBOARD FRONTEND (Days 9-11)

### 4.1 Create Admin Folder Structure

```bash
mkdir admin
mkdir admin/css
mkdir admin/js
mkdir admin/pages
```

### 4.2 Admin Dashboard Main Page

**File:** `admin/index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>CP Automation - Admin Dashboard</title>

    <!-- Bootstrap CSS -->
    <link
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
      rel="stylesheet"
    />
    <!-- Font Awesome -->
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
    />
    <!-- Custom CSS -->
    <link rel="stylesheet" href="css/admin.css" />
  </head>
  <body>
    <div class="container-fluid">
      <div class="row h-100">
        <!-- Sidebar Navigation -->
        <nav class="col-md-3 col-lg-2 d-md-block bg-dark sidebar p-0" id="sidebar">
          <div class="position-sticky">
            <div class="sidebar-heading p-3 border-bottom">
              <h5 class="text-white mb-0"><i class="fas fa-cogs"></i> Dashboard</h5>
            </div>
            <ul class="nav flex-column p-3">
              <li class="nav-item">
                <a class="nav-link active" href="#" data-page="overview">
                  <i class="fas fa-home"></i> Overview
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" data-page="projects">
                  <i class="fas fa-image"></i> Gallery/Projects
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" data-page="products">
                  <i class="fas fa-boxes"></i> Products
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" data-page="services">
                  <i class="fas fa-concierge-bell"></i> Services
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" data-page="testimonials">
                  <i class="fas fa-comments"></i> Testimonials
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" data-page="content">
                  <i class="fas fa-file-alt"></i> Content
                </a>
              </li>
              <li class="nav-item mt-3 border-top pt-3">
                <a class="nav-link text-danger" href="#" id="logoutBtn">
                  <i class="fas fa-sign-out-alt"></i> Logout
                </a>
              </li>
            </ul>
          </div>
        </nav>

        <!-- Main Content Area -->
        <main class="col-md-9 col-lg-10 px-4 py-4 main-content">
          <!-- Alert Messages -->
          <div id="alertContainer"></div>

          <!-- Content Placeholder -->
          <div id="contentArea">
            <!-- Pages loaded here -->
          </div>
        </main>
      </div>
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <!-- Admin JS -->
    <script src="js/auth.js"></script>
    <script src="js/api.js"></script>
    <script src="js/dashboard.js"></script>
    <script src="js/pages/projects.js"></script>
    <script src="js/pages/products.js"></script>
    <script src="js/pages/services.js"></script>
    <script src="js/pages/testimonials.js"></script>
    <script src="js/pages/content.js"></script>
  </body>
</html>
```

### 4.3 Admin CSS

**File:** `admin/css/admin.css`

```css
:root {
  --primary: #007bff;
  --dark: #0a0f1f;
  --light: #f8f9fa;
  --border: #dee2e6;
}

body {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background-color: var(--light);
}

body.logged-out {
  display: flex !important;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.container-fluid {
  height: 100vh;
}

.row {
  height: 100vh;
}

/* Sidebar */
.sidebar {
  border-right: 1px solid var(--border);
  overflow-y: auto;
}

.sidebar-heading {
  background-color: var(--dark);
}

.sidebar .nav-link {
  color: rgba(255, 255, 255, 0.8);
  padding: 0.75rem 1rem;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.sidebar .nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.sidebar .nav-link.active {
  background-color: var(--primary);
  color: white;
}

/* Main Content */
.main-content {
  overflow-y: auto;
  background-color: var(--light);
}

/* Forms */
.form-section {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-group label {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

/* Tables */
.table-responsive {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.table {
  margin-bottom: 0;
}

.table thead {
  background-color: var(--light);
  border-bottom: 2px solid var(--border);
}

.table th {
  font-weight: 600;
  color: #333;
  padding: 1rem;
}

.table td {
  padding: 1rem;
  vertical-align: middle;
}

.table tbody tr:hover {
  background-color: rgba(0, 123, 255, 0.05);
}

/* Buttons */
.btn {
  border-radius: 4px;
  font-weight: 600;
  padding: 0.5rem 1rem;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: var(--primary);
  border-color: var(--primary);
}

.btn-primary:hover {
  background-color: #0056b3;
  border-color: #0056b3;
}

.btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.875rem;
}

/* Image Preview */
.image-preview {
  max-width: 200px;
  margin-top: 1rem;
  border-radius: 4px;
  overflow: hidden;
}

.image-preview img {
  width: 100%;
  height: auto;
  display: block;
}

/* Alerts */
.alert {
  border-radius: 4px;
  border: none;
  padding: 1rem;
  margin-bottom: 1rem;
}

/* Login Page */
.login-container {
  background: white;
  border-radius: 8px;
  padding: 3rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.login-container h1 {
  color: var(--primary);
  margin-bottom: 2rem;
  text-align: center;
  font-weight: 800;
}

/* Responsive */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: -250px;
    width: 250px;
    height: 100vh;
    z-index: 1000;
    transition: left 0.3s ease;
  }

  .sidebar.show {
    left: 0;
  }

  .main-content {
    padding: 1rem;
  }
}
```

### 4.4 Authentication JavaScript

**File:** `admin/js/auth.js`

```javascript
class AuthManager {
  constructor() {
    this.token = localStorage.getItem("adminToken");
    this.init();
  }

  init() {
    if (!this.token) {
      this.showLoginPage();
    } else {
      this.showDashboard();
    }
  }

  showLoginPage() {
    document.body.classList.add("logged-out");
    document.querySelector(".container-fluid").innerHTML = `
            <div class="login-container">
                <h1>Admin Dashboard</h1>
                <form id="loginForm">
                    <div class="form-group mb-3">
                        <label>Username</label>
                        <input type="text" class="form-control" id="username" required>
                    </div>
                    <div class="form-group mb-3">
                        <label>Password</label>
                        <input type="password" class="form-control" id="password" required>
                    </div>
                    <button type="submit" class="btn btn-primary w-100">Login</button>
                    <div id="loginError" class="alert alert-danger mt-3" style="display:none;"></div>
                </form>
            </div>
        `;

    document.getElementById("loginForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.login(
        document.getElementById("username").value,
        document.getElementById("password").value,
      );
    });
  }

  showDashboard() {
    document.body.classList.remove("logged-out");
    // Dashboard will be loaded by dashboard.js
  }

  async login(username, password) {
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error("Invalid credentials");
      }

      const data = await response.json();
      this.token = data.token;
      localStorage.setItem("adminToken", this.token);
      window.location.reload();
    } catch (error) {
      const errorDiv = document.getElementById("loginError");
      errorDiv.textContent = error.message;
      errorDiv.style.display = "block";
    }
  }

  logout() {
    localStorage.removeItem("adminToken");
    window.location.reload();
  }
}

const auth = new AuthManager();
```

### 4.5 API Handler

**File:** `admin/js/api.js`

```javascript
class API {
  constructor(baseURL = "http://localhost:5000/api") {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (auth.token) {
      headers["Authorization"] = `Bearer ${auth.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        auth.logout();
      }
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  }

  // Projects
  async getProjects() {
    return this.request("/projects");
  }

  async getProject(id) {
    return this.request(`/projects/${id}`);
  }

  async createProject(data) {
    return this.request("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateProject(id, data) {
    return this.request(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id) {
    return this.request(`/projects/${id}`, {
      method: "DELETE",
    });
  }

  // Similar methods for Products, Services, Testimonials, Content
  // ... (follow same pattern)
}

const api = new API();
```

### 4.6 Dashboard Navigation

**File:** `admin/js/dashboard.js`

```javascript
document.addEventListener("DOMContentLoaded", () => {
  if (auth.token) {
    setupNavigation();
    setupLogout();
    loadPage("overview");
  }
});

function setupNavigation() {
  document.querySelectorAll("[data-page]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const page = e.currentTarget.getAttribute("data-page");

      // Update active state
      document.querySelectorAll("[data-page]").forEach((l) => {
        l.classList.remove("active");
      });
      e.currentTarget.classList.add("active");

      loadPage(page);
    });
  });
}

function setupLogout() {
  document.getElementById("logoutBtn").addEventListener("click", (e) => {
    e.preventDefault();
    if (confirm("Are you sure you want to logout?")) {
      auth.logout();
    }
  });
}

function loadPage(page) {
  const contentArea = document.getElementById("contentArea");

  switch (page) {
    case "overview":
      contentArea.innerHTML =
        "<h2>Dashboard Overview</h2><p>Welcome to CP Automation Admin Dashboard</p>";
      break;
    case "projects":
      ProjectsPage.init();
      break;
    case "products":
      ProductsPage.init();
      break;
    case "services":
      ServicesPage.init();
      break;
    case "testimonials":
      TestimonialsPage.init();
      break;
    case "content":
      ContentPage.init();
      break;
  }
}

function showAlert(message, type = "success") {
  const alertContainer = document.getElementById("alertContainer");
  const alertElement = document.createElement("div");
  alertElement.className = `alert alert-${type} alert-dismissible fade show`;
  alertElement.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
  alertContainer.appendChild(alertElement);
  setTimeout(() => alertElement.remove(), 5000);
}
```

### 4.7 Projects Page

**File:** `admin/js/pages/projects.js`

```javascript
class ProjectsPage {
  static async init() {
    const contentArea = document.getElementById("contentArea");
    contentArea.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>Gallery Projects</h2>
                <button class="btn btn-primary" id="addProjectBtn">
                    <i class="fas fa-plus"></i> Add Project
                </button>
            </div>

            <div class="form-section" id="projectForm" style="display:none;">
                <h4>Project Details</h4>
                <form id="submitForm">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Project Title</label>
                            <input type="text" class="form-control" id="projectTitle" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Location</label>
                            <input type="text" class="form-control" id="projectLocation">
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Description</label>
                        <textarea class="form-control" id="projectDesc" rows="3"></textarea>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Project Image</label>
                        <input type="file" class="form-control" id="projectImage" accept="image/*">
                        <div id="imagePreview"></div>
                    </div>
                    <div class="d-flex gap-2">
                        <button type="submit" class="btn btn-success">Save Project</button>
                        <button type="button" class="btn btn-secondary" id="cancelBtn">Cancel</button>
                    </div>
                </form>
            </div>

            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Location</th>
                            <th>Image</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="projectsTable">
                        <tr><td colspan="4" class="text-center">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        `;

    this.loadProjects();
    this.setupEventListeners();
  }

  static async loadProjects() {
    try {
      const projects = await api.getProjects();
      const tbody = document.getElementById("projectsTable");
      tbody.innerHTML = "";

      projects.forEach((project) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
                    <td>${project.title}</td>
                    <td>${project.location || "N/A"}</td>
                    <td>
                        ${project.image_url ? `<img src="${project.image_url}" style="max-width:100px; height:auto;">` : "No image"}
                    </td>
                    <td>
                        <button class="btn btn-sm btn-warning edit-btn" data-id="${project.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${project.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                `;
        tbody.appendChild(tr);
      });

      this.setupTableEventListeners();
    } catch (error) {
      showAlert("Failed to load projects", "danger");
    }
  }

  static setupEventListeners() {
    document.getElementById("addProjectBtn").addEventListener("click", () => {
      document.getElementById("projectForm").style.display = "block";
      document.getElementById("submitForm").reset();
      document.getElementById("submitForm").dataset.mode = "create";
    });

    document.getElementById("cancelBtn").addEventListener("click", () => {
      document.getElementById("projectForm").style.display = "none";
    });

    document.getElementById("submitForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.saveProject();
    });
  }

  static setupTableEventListeners() {
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.currentTarget.dataset.id;
        const project = await api.getProject(id);

        document.getElementById("projectTitle").value = project.title;
        document.getElementById("projectLocation").value = project.location || "";
        document.getElementById("projectDesc").value = project.description || "";

        if (project.image_url) {
          document.getElementById("imagePreview").innerHTML =
            `<div class="image-preview"><img src="${project.image_url}"></div>`;
        }

        document.getElementById("submitForm").dataset.mode = "edit";
        document.getElementById("submitForm").dataset.id = id;
        document.getElementById("projectForm").style.display = "block";
        window.scrollTo(0, 0);
      });
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.currentTarget.dataset.id;
        if (confirm("Delete this project?")) {
          try {
            await api.deleteProject(id);
            showAlert("Project deleted Successfully", "success");
            this.loadProjects();
          } catch (error) {
            showAlert("Failed to delete project", "danger");
          }
        }
      });
    });
  }

  static async saveProject() {
    try {
      const form = document.getElementById("submitForm");
      const formData = new FormData(form);

      const data = {
        title: document.getElementById("projectTitle").value,
        description: document.getElementById("projectDesc").value,
        location: document.getElementById("projectLocation").value,
      };

      const projectImage = document.getElementById("projectImage");
      if (projectImage.files.length > 0) {
        formData.append("image", projectImage.files[0]);
        // Handle file upload - would need special handling for multipart/form-data
      }

      const mode = form.dataset.mode;
      if (mode === "create") {
        await api.createProject(data);
        showAlert("Project created successfully", "success");
      } else {
        await api.updateProject(form.dataset.id, data);
        showAlert("Project updated successfully", "success");
      }

      document.getElementById("projectForm").style.display = "none";
      this.loadProjects();
    } catch (error) {
      showAlert("Failed to save project", "danger");
    }
  }
}
```

**Create similar files for:**

- `admin/js/pages/products.js`
- `admin/js/pages/services.js`
- `admin/js/pages/testimonials.js`
- `admin/js/pages/content.js`

**Tasks:**

- [ ] Create admin dashboard HTML
- [ ] Create admin CSS styling
- [ ] Create authentication system
- [ ] Create API client
- [ ] Create all page modules
- [ ] Test dashboard functionality

---

## PHASE 5: UPDATE PUBLIC WEBSITE (Day 12)

### 5.1 Modify Website to Fetch from API

**File:** `assets/js/main.js` - Modify existing file

Add at beginning:

```javascript
const API_BASE_URL = "http://localhost:5000/api";

// Fetch projects from API instead of hardcoded
async function loadProjects() {
  try {
    const response = await fetch(`${API_BASE_URL}/projects`);
    const projects = await response.json();
    renderProjects(projects);
  } catch (error) {
    console.error("Failed to load projects:", error);
  }
}

function renderProjects(projects) {
  const projectsContainer = document.getElementById("page1");
  if (!projectsContainer) return;

  projectsContainer.innerHTML = "";
  const row = document.createElement("div");
  row.className = "row g-4";

  projects.forEach((project) => {
    const col = document.createElement("div");
    col.className = "col-md-6 col-lg-4 scroll-animate";
    col.innerHTML = `
            <div class="card h-100 border-0 shadow-sm card-hover">
                <div class="bg-primary bg-opacity-10 d-flex align-items-center justify-content-center" style="height: 200px; overflow: hidden;">
                    <img src="${project.image_url}" alt="${project.title}" class="img-fluid" style="max-height:200px; object-fit:cover; width:100%;loading:lazy">
                </div>
                <div class="card-body">
                    <h5 class="card-title">${project.title}</h5>
                    <p class="card-text text-muted">${project.location || ""} | ${project.description || ""}</p>
                </div>
            </div>
        `;
    row.appendChild(col);
  });

  projectsContainer.appendChild(row);
}

// Call on page load
document.addEventListener("DOMContentLoaded", loadProjects);
```

**Tasks:**

- [ ] Update main.js to fetch from API
- [ ] Add lazy loading for images
- [ ] Update products section
- [ ] Update services section
- [ ] Test all dynamic content loading

### 5.2 Add Image Optimization

**File:** `index.html` - Update image tags

```html
<!-- Replace existing image tags with -->
<img
  src="assets/img/PROJECT.jpg"
  srcset="assets/img/PROJECT-small.jpg 480w, assets/img/PROJECT.jpg 800w"
  sizes="(max-width: 600px) 480px, 800px"
  loading="lazy"
  alt="Project description"
  class="img-fluid"
/>
```

**Tasks:**

- [ ] Add lazy loading attributes
- [ ] Create responsive image sizes
- [ ] Test performance

---

## PHASE 6: TESTING & OPTIMIZATION (Day 13-14)

### 6.1 API Testing

**Tasks:**

- [ ] Test all GET endpoints
- [ ] Test all POST endpoints (create)
- [ ] Test all PUT endpoints (update)
- [ ] Test all DELETE endpoints
- [ ] Test authentication
- [ ] Test error handling
- [ ] Test CORS

**Use Postman or Insomnia:**

1. Import API collection
2. Test each endpoint
3. Save results

### 6.2 Dashboard Testing

**Tasks:**

- [ ] Test login/logout
- [ ] Test projects CRUD
- [ ] Test product CRUD
- [ ] Test image upload
- [ ] Test form validation
- [ ] Test responsive design
- [ ] Test on different browsers

### 6.3 Website Testing

**Tasks:**

- [ ] Test API integration
- [ ] Test dynamic loading
- [ ] Test performance (Lighthouse)
- [ ] Test mobile responsiveness
- [ ] Test gallery functionality
- [ ] Test SEO

### 6.4 Performance Optimization

**Tasks:**

- [ ] Optimize images further
- [ ] Add caching headers
- [ ] Minify CSS/JS
- [ ] Setup CDN for images
- [ ] Test Core Web Vitals

**Run Lighthouse Audit:**

```bash
bun add -g lighthouse
lighthouse https://your-website.com --view
```

---

## PHASE 7: DEPLOYMENT (Day 15-16)

### 7.1 Prepare Backend for Production

**File:** `backend/.env.production`

```
DATABASE_URL=your_neon_production_url
PORT=5000
CORS_ORIGIN=https://your-website.com
JWT_SECRET=generate_strong_secret_here
CLOUDINARY_NAME=your_prod_cloudinary
CLOUDINARY_API_KEY=prod_api_key
CLOUDINARY_API_SECRET=prod_api_secret
NODE_ENV=production
```

**Tasks:**

- [ ] Create production database on Neon
- [ ] Set strong JWT secret
- [ ] Setup environment variables
- [ ] Create database backups
- [ ] Test production database

### 7.2 Deploy Backend

**Option A: Deploy to Render.com**

```bash
# Steps:
1. Push code to GitHub
2. Create new Web Service on Render
3. Connect GitHub repo
4. Set environment variables
5. Deploy
```

**Option B: Deploy to Railway**

```bash
# Steps:
1. Create Railway account
2. Create new project
3. Connect GitHub
4. Add PostgreSQL plugin
5. Deploy
```

**Option C: Deploy to DigitalOcean App Platform**

```bash
# Steps:
1. Push to GitHub
2. Create new App on DigitalOcean
3. Connect repo
4. Add database
5. Deploy
```

**Tasks:**

- [ ] Choose hosting platform
- [ ] Setup domain
- [ ] Configure SSL/HTTPS
- [ ] Setup environment variables
- [ ] Deploy backend
- [ ] Test API endpoints

### 7.3 Deploy Admin Dashboard

**Deploy to Vercel/Netlify:**

```bash
# For Vercel:
bun add -g vercel
vercel

# For Netlify:
netlify deploy --prod
```

Or deploy to same server as backend.

**Tasks:**

- [ ] Update API_BASE_URL to production
- [ ] Setup custom domain
- [ ] Configure SSL
- [ ] Deploy dashboard

### 7.4 Deploy Public Website

**Option A: Deploy to Netlify**

```bash
netlify deploy --prod
```

**Option B: Traditional Hosting**

```bash
# Upload files via FTP/SSH
# Or use GitHub Pages
```

**Update CORS in backend:**

```javascript
// backend/index.ts
app.use(
  cors({
    origin: ["https://your-website.com", "https://admin.your-website.com"],
    credentials: true,
  }),
);
```

**Tasks:**

- [ ] Update API_BASE_URL in website
- [ ] Test all integrations
- [ ] Test forms and functionality
- [ ] Verify SSL certificate
- [ ] Setup backups

### 7.5 Setup Monitoring & Logging

**Tasks:**

- [ ] Setup error logging (Sentry)
- [ ] Setup uptime monitoring (UptimeRobot)
- [ ] Setup log aggregation
- [ ] Create alert system
- [ ] Document troubleshooting

---

## PHASE 8: POST-LAUNCH (Ongoing)

### 8.1 Monitor Performance

- [ ] Watch server logs daily
- [ ] Monitor database performance
- [ ] Check image delivery speed
- [ ] Track user feedback

### 8.2 Regular Maintenance

- [ ] Update dependencies monthly
- [ ] Backup database weekly
- [ ] Review security logs
- [ ] Optimize slow queries

### 8.3 Documentation

- [ ] Create admin user guide
- [ ] Document API endpoints
- [ ] Create troubleshooting guide
- [ ] Maintain changelog

---

## 📋 CHECKLIST BY PHASE

**PHASE 1 (Days 1-2):**

- [ ] Backend project structure created
- [ ] Environment variables configured
- [ ] Neon database connected
- [ ] Cloudinary account setup

**PHASE 2 (Days 3-4):**

- [ ] Database schema created
- [ ] All tables created in Neon
- [ ] Database models created
- [ ] Connection tested

**PHASE 3 (Days 5-8):**

- [ ] Authentication system built
- [ ] All API routes created
- [ ] Image upload working
- [ ] All endpoints tested in Postman

**PHASE 4 (Days 9-11):**

- [ ] Admin dashboard UI created
- [ ] All admin pages built
- [ ] Dashboard fully functional
- [ ] CRUD operations working

**PHASE 5 (Day 12):**

- [ ] Website fetches from API
- [ ] Images display dynamically
- [ ] Lazy loading implemented
- [ ] All content updates from dashboard

**PHASE 6 (Days 13-14):**

- [ ] All tests passed
- [ ] Performance optimized
- [ ] Lighthouse score >90
- [ ] No security vulnerabilities

**PHASE 7 (Days 15-16):**

- [ ] Backend deployed
- [ ] Dashboard deployed
- [ ] Website deployed
- [ ] All systems live

**PHASE 8 (Ongoing):**

- [ ] Monitoring active
- [ ] Backups running
- [ ] Updates applied
- [ ] Documentation complete

---

## 🚀 QUICK START COMMANDS

```bash
# Phase 1: Setup
bun init -y
bun add express cors dotenv pg axios multer cloudinary sharp bcryptjs jsonwebtoken
bun add -d nodemon

# Phase 2: Apply database schema
bun run db:apply-schema

# Phase 3: Run backend
bun run dev

# Phase 4: Test admin dashboard
# Open browser to http://localhost:3000/admin/

# Phase 7: Deploy
git push origin main
# Then deploy through hosting platform UI
```

---

## 📞 TROUBLESHOOTING

**Database Connection Error:**

```
Solution: Check DATABASE_URL in .env
psql your_connection_string -c "SELECT 1"
```

**CORS Error:**

```
Solution: Update CORS_ORIGIN in .env
Should match your website domain
```

**Image Upload Failed:**

```
Solution: Check Cloudinary credentials
Test with curl:
curl -X POST https://api.cloudinary.com/v1_1/YOUR_NAME/image/upload
```

**API Not Responding:**

```
Solution: Check if backend is running
bun run dev
Check error logs in console
```

---

## 💰 ESTIMATED COSTS

| Service                  | Free Tier       | Monthly Cost |
| ------------------------ | --------------- | ------------ |
| Neon (Database)          | 0.5GB           | $15-50       |
| Cloudinary (Images)      | 25GB            | Free-$84     |
| Backend Hosting (Render) | Free tier       | $7-25        |
| Admin Dashboard          | Free            | Free         |
| Website Hosting          | Free/Paid       | $0-20        |
| **TOTAL**                | **Mostly Free** | **$15-100**  |

---

**Ready to start? Let me know when you're ready for Phase 1, and I'll build out the complete backend for you!**
