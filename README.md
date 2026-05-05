# 🚀 SahilDev HRM System

SahilDev HRM is a modern, secure, and highly scalable Human Resource Management platform designed for small to medium-sized enterprises. Built with **React 18**, **Vite**, and **Firebase**, it offers a premium user experience with robust administrative controls.

## ✨ Key Features

-   **🛡️ Enterprise-Grade Security**:
    -   **Brute-Force Protection**: Automatic 30-minute account lockout after 3 failed login attempts.
    -   **Protected Routing**: Secure navigation prevents unauthorized access to sensitive modules.
    -   **Superadmin Control**: Centralized authority for superadmin with exclusive access to system settings.
-   **🔐 Multiple Auth Methods**: Supports both **Google OAuth** and **Email/Password** authentication with a functional "Forgot Password" workflow.
-   **👥 Role-Based Access (RBAC)**:
    -   **Superadmin**: Full system control, SMTP configuration, and audit logs.
    -   **Admin**: Employee onboarding, payroll management, and team oversight.
    -   **Employee**: Personal profile management, leave requests, and directory access.
-   **📂 Employee Management**: Dynamic directory with real-time Firestore synchronization for onboarding and role assignment.
-   **🎨 Premium UI/UX**: Clean, responsive dashboard using modern CSS-in-JS and Lucide-react icons for a state-of-the-art feel.

## 🛠️ Technology Stack

-   **Frontend**: React (Vite), React Router v6, Lucide Icons.
-   **Backend**: Firebase Authentication, Firestore (Real-time Database).
-   **Styling**: Vanilla CSS (Custom tokens & Glassmorphism).

## 🚀 Getting Started

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/syedsahilshah1/SahilDev-HRM-.git
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Configure Environment Variables**:
    Create a `.env` file and add your Firebase credentials (DO NOT push this to GitHub).
4.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## 📄 License
Licensed under the MIT License. Developed with ❤️ by Sahil Dev.
