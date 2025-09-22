// API Configuration
const API_CONFIG = {
  // Replace this with your actual Render URL after deployment
  // Example: 'https://nacos-complaint-api.onrender.com'
  BASE_URL: 'https://your-app-name.onrender.com',
  
  // For local development, uncomment the line below:
  // BASE_URL: 'http://localhost:3001',
  
  ENDPOINTS: {
    LOGIN: '/api/login',
    REGISTER: '/api/registeration',
    ADMIN_REGISTER: '/api/adminRegisteration',
    COMPLAINTS: '/api/complaints',
    SUBMIT_COMPLAINT: '/api/complaintform'
  }
};

// Helper function to get full API URL
function getApiUrl(endpoint) {
  return API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS[endpoint];
}