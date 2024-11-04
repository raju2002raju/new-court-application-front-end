import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { baseUrl } from '../Config';

const Navbar = () => {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Configure axios defaults for this instance
      axios.defaults.withCredentials = true;
      
      const response = await axios.post(`${baseUrl}/api/logout`);

      if (response.data.status === 'success') {
        localStorage.clear();
        navigate('/');
      } else {
        setError('Logout failed. Please try again.');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      setError('An error occurred during logout');
    }
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <img 
              className="h-10 w-auto rounded"
              src="/Images/logo.png"
              alt="Company Logo"
            />
          </div>
          
          <div className="hidden sm:block">
            <div className="flex items-center space-x-8">
              <a 
                href="/" 
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                HOME
              </a>
              <a 
                href="/documents" 
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                MY DOCUMENTS
              </a>
              <button
                onClick={handleLogout}
                className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium cursor-pointer"
              >
                LOGOUT
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
    </nav>
  );
};

export default Navbar;