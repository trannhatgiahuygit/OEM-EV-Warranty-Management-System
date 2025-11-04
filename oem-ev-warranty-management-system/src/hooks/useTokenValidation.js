import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

const useTokenValidation = () => {
  const [connectionLost, setConnectionLost] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(10);
  const navigate = useNavigate();
  const location = useLocation();
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);
  const toastIdRef = useRef(null);
  const connectionLostRef = useRef(false); // Ref to track connectionLost state
  const validateTokenRef = useRef(null); // Ref to store validateToken function

  const clearCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  const showConnectionLossMessage = (countdown) => {
    if (toastIdRef.current) {
      // Update existing toast instead of dismissing and recreating to prevent bouncing
      toast.update(toastIdRef.current, {
        render: `Connection loss. Retrying in ${countdown}...`,
        type: 'error',
        position: 'top-right',
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        hideProgressBar: false,
      });
    } else {
      // Create new toast only if it doesn't exist
      toastIdRef.current = toast.error(
        `Connection loss. Retrying in ${countdown}...`,
        {
          position: 'top-right',
          autoClose: false,
          closeOnClick: false,
          draggable: false,
          hideProgressBar: false,
        }
      );
    }
  };

  const handleInvalidToken = () => {
    // Clear interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    clearCountdown();
    
    // Clear connection lost state
    if (connectionLostRef.current) {
      setConnectionLost(false);
      connectionLostRef.current = false;
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
    }

    // Show session expired message
    toast.error('Session expired. Please log in again.', {
      position: 'top-right',
      autoClose: 3000,
    });

    // Clear localStorage
    localStorage.removeItem('user');
    
    // Dispatch storage event to update header
    window.dispatchEvent(new Event('storage'));

    // Navigate to login page (only if not already there)
    if (location.pathname !== '/login') {
      navigate('/login');
    }
  };

  const handleConnectionError = () => {
    if (!connectionLostRef.current) {
      setConnectionLost(true);
      connectionLostRef.current = true;
      setRetryCountdown(10);
      showConnectionLossMessage(10);
    }

    // Start countdown
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    countdownRef.current = setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
          setRetryCountdown(10);
          // Retry immediately when countdown reaches 0
          if (validateTokenRef.current) {
            validateTokenRef.current();
          }
          return 10;
        }
        const newCountdown = prev - 1;
        showConnectionLossMessage(newCountdown);
        return newCountdown;
      });
    }, 1000);
  };

  const validateToken = async () => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      // User is not logged in, stop validation
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      clearCountdown();
      if (connectionLostRef.current) {
        setConnectionLost(false);
        connectionLostRef.current = false;
        if (toastIdRef.current) {
          toast.dismiss(toastIdRef.current);
          toastIdRef.current = null;
        }
      }
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      const token = user.token;

      if (!token) {
        // No token found, clear and logout
        handleInvalidToken();
        return;
      }

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/validate-token`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'accept': '*/*'
          }
        }
      );

      // Token is valid (200 response)
      if (response.status === 200) {
        // Connection restored
        if (connectionLostRef.current) {
          setConnectionLost(false);
          connectionLostRef.current = false;
          clearCountdown();
          if (toastIdRef.current) {
            toast.dismiss(toastIdRef.current);
            toastIdRef.current = null;
          }
          toast.success('Connection restored', { 
            position: 'top-right',
          });
        }
      }
    } catch (error) {
      // Handle different error cases
      if (error.response) {
        // Server responded with an error status
        if (error.response.status === 401) {
          // Token is invalid or expired
          handleInvalidToken();
        } else {
          // Other server errors - treat as connection issue
          handleConnectionError();
        }
      } else if (error.request) {
        // Request was made but no response received (network error)
        handleConnectionError();
      } else {
        // Something else happened
        handleConnectionError();
      }
    }
  };

  // Store validateToken in ref so it can be accessed from intervals
  validateTokenRef.current = validateToken;

  useEffect(() => {
    // Initial check
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      validateToken();
      // Set up interval to check every 10 seconds
      intervalRef.current = setInterval(() => {
        validateToken();
      }, 10000); // 10 seconds
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      clearCountdown();
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }
    };
  }, []);

  // Listen for storage changes (logout/login events)
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = localStorage.getItem('user');
      
      if (storedUser && !intervalRef.current) {
        // User logged in, start validation
        validateToken();
        intervalRef.current = setInterval(() => {
          validateToken();
        }, 10000);
      } else if (!storedUser && intervalRef.current) {
        // User logged out, stop validation
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        clearCountdown();
        if (connectionLostRef.current) {
          setConnectionLost(false);
          connectionLostRef.current = false;
          if (toastIdRef.current) {
            toast.dismiss(toastIdRef.current);
            toastIdRef.current = null;
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom login event
    window.addEventListener('userLogin', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLogin', handleStorageChange);
    };
  }, []); // Remove connectionLost from dependencies since we use ref

  return { connectionLost, retryCountdown };
};

export default useTokenValidation;

