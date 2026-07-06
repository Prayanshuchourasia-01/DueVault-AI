# DueVault AI 🚀

![DueVault AI Preview](./src/assets/hero.png)

**DueVault AI** is a privacy-first, fully localized AI productivity dashboard and engineering workflow engine. It leverages the power of Gemini to act as your personal project manager—parsing plain text commands and messy HTML schedules into actionable timelines, Pomodoro sessions, and deep-work analytics.

> **Built using Vibe Coding for the Google 5 Days AI Course.**

## 🌟 Key Features

*   **🧠 AI Input Engine:** Simply type what you need to do ("I have a hackathon submission due tomorrow at 5pm"), and the Gemini parser automatically extracts the task, categorizes it, and calculates urgency.
*   **🕒 Focus HUD & Pomodoro:** A highly visual, dynamic radial timer that hijacks your screen for deep-work blocks. It automatically routes your academic and coding tasks to the timer, leaving administrative chores in the background.
*   **📊 Engineering Analytics Dashboard:** Track your daily completion rates and see a live pipeline of exactly how much time you are dedicating to "Deep Work" versus "Administrative Overhead."
*   **📅 AI Timetable Import:** Copy and paste messy HTML directly from your university portal. DueVault AI parses the raw DOM elements and automatically builds recurring local routines, classes, and lab sessions.
*   **🗄️ Life Vault & Finances:** A dedicated master database to track non-academic chores, upcoming bills, and one-off tasks. Completely segregated from your focus workflow to minimize context switching.
*   **🔒 Privacy-First Architecture:** No backend databases. No cloud syncing. Everything from your API keys to your personal schedule is stored 100% locally in your browser.

## 🛠️ Tech Stack

*   **Frontend Framework:** React + Vite
*   **Styling:** Vanilla CSS & Tailwind CSS for utility wrappers
*   **Icons:** Lucide React
*   **AI Integration:** `@google/genai` (Gemini API)
*   **State Management:** React Hooks + LocalStorage API

## 🚀 Getting Started

To run this project locally on your machine:

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR-USERNAME/duevault-ai.git
   ```
2. Navigate to the project directory:
   ```bash
   cd duevault-ai
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser to `http://localhost:5173`.
6. On first launch, click the **Settings ⚙️** icon and paste your Gemini API Key. It will be securely saved in your browser's local storage.

## 🎓 About

This project was rapidly prototyped and developed through **vibe coding** as the capstone project for the **Google 5 Days AI Course**. It demonstrates the power of utilizing LLMs to aggressively structure unstructured data (like conversational text and raw HTML) into highly rigorous, interactive local applications.
