import axios from 'axios';  

// Use your EC2 public IP
const api = axios.create({
    baseURL: 'http://3.108.68.73:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
