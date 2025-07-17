import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://pytj32n2ma.execute-api.us-east-2.amazonaws.com/dev', // your backend URL
  headers: {
    // 'Content-Type': 'application/json',
  },
});

export default axiosInstance;
