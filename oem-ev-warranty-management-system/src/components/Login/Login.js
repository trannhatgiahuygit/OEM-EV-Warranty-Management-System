
import React, { useState } from 'react';
import './Login.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; // ToastContainer is usually in App.js or index.js
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Import a-icons

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State để bật/tắt hiển thị mật khẩu
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
        username,
        password,
      });

      if (response.status === 200) {
        toast.success('Login successful!', { position: 'top-right' });
        const user = response.data; // The full user object from the server
        localStorage.setItem('user', JSON.stringify(user));
        window.dispatchEvent(new Event('storage'));
        navigate('/dashboard');
      }
    } catch (error) {
      if (error.response && error.response.status === 403) {
        toast.error('Invalid credentials. Please try again.', { position: 'top-right' });
      } else {
        toast.error('An error occurred. Please try again later.', { position: 'top-right' });
      }
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="hero-bg">
        <div className="animated-grid" />
        <div className="gradient-bg" />
      </div>
      <motion.div
        className="login-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.form
          className="login-form"
          onSubmit={handleLogin}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h2>Welcome Back</h2>
          <p>Please log in to continue</p>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          {/* --- BỌC TRƯỜNG PASSWORD LẠI --- */}
          <div className="password-input-container">
            <input
              type={showPassword ? 'text' : 'password'} // Thay đổi type dựa trên state
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              className="password-toggle-icon"
              onClick={() => setShowPassword(!showPassword)} // Thêm trình xử lý onClick
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {/* --- KẾT THÚC BỌC --- */}

          <button type="submit">Login</button>
        </motion.form>
      </motion.div>
    </div>
  );
};

export default Login;
