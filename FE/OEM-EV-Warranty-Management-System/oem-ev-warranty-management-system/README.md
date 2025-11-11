# OEM EV Warranty Management System

This project is a sleek, modern, and professional web application for managing Electric Vehicle (EV) warranties. It features a minimalist, GitHub-style design with a functional light and dark mode, dynamic, role-based dashboards, and a smooth user experience powered by modern web technologies.

## 🌟 Key Features

  * **Sleek & Modern UI:** A clean, minimalist design language applied across the entire application, including the homepage, login page, and dashboard.
  * **Light & Dark Mode:** A seamless theme-toggling feature in the header bar, with a persistent theme preference saved in local storage.
  * **Responsive Design:** The entire application, including the header and dashboard, is fully responsive and provides an optimized user experience on both desktop and mobile devices.
  * **Subtle Animations:** Lightweight animations on page transitions and elements that enhance the user experience without causing performance issues.
  * **Role-Based Access Control:** The dashboard dynamically displays a different set of function buttons based on the user's role, ensuring that only relevant features are accessible after logging in.
  * **Secure Authentication:** Securely redirects users to protected routes after a successful login and prevents unauthorized access to the dashboard.
  * **Seamless User Flow:** When logged in, the application automatically redirects the user from the homepage to the dashboard, and a custom toast message provides instant feedback on login success or failure.

## 🛠️ Tech Stack

  * **Frontend:** React.js
  * **Styling:** CSS3, CSS Modules
  * **Animations:** `framer-motion`
  * **Routing:** `react-router-dom`
  * **Notifications:** `react-toastify`
  * **State Management:** `useState` and `useEffect` hooks
  * **HTTP Requests:** `axios`
  * **Auth:** JWT (JSON Web Tokens)
  * **Dependencies:** `jwt-decode`

## 🚀 Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

Make sure you have Node.js and npm (or yarn) installed on your machine.

  * **Node.js:** [https://nodejs.org/](https://nodejs.org/)
  * **npm:** Comes with Node.js

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/PhamTheAn123/OEM-EV-Warranty-Management-System.git
    cd your-project
    git checkout FE --
    ```
2.  **Install dependencies:**
    ```sh
    npm install
    # or
    yarn install
    ```
3.  **Set up environment variables:**
    Create a `.env` file in the root directory and add your API URL.
    ```env
    REACT_APP_API_URL=http://localhost:5000
    ```
    Replace `http://localhost:5000` with the actual URL of your backend server.

### Running the Application

To start the development server, run the following command:

```sh
npm start
# or
yarn start
```

The application will be available at `http://localhost:3000`.

## 📂 Project Structure

```
├── public/
│   ├── index.html
│   └── ...
├── src/
│   ├── components/
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.js
│   │   │   └── Dashboard.css
│   │   ├── Header/
│   │   │   ├── Header.js
│   │   │   └── Header.module.css
│   │   ├── HomePage/
│   │   │   ├── HomePage.js
│   │   │   └── HomePage.css
│   │   ├── Login/
│   │   │   ├── Login.js
│   │   │   └── Login.css
│   │   └── Toast.css
│   ├── styles/
│   │   └── theme.css
│   ├── App.js
│   ├── index.js
│   └── ...
└── README.md
```

## 🤝 Contributing

Contributions are welcome\! If you find a bug or have an idea for an enhancement, please open an issue or submit a pull request.

## 📄 License

This project is licensed under the MIT License.