// API Configuration
const API_CONFIG = {
    BASE_URL: 'http://localhost:5000/api',
    TIMEOUT: 10000,
    ENDPOINTS: {
        // Authentication
        LOGIN: '/auth/login',
        LOGIN_STUDENT: '/auth/login/student',
        LOGIN_TEACHER: '/auth/login/teacher',
        REGISTER: '/auth/register',
        FORGOT_PASSWORD: '/auth/forgot-password',
        RESET_PASSWORD: '/auth/reset-password',
        CHANGE_PASSWORD: '/auth/change-password',
        VERIFY_EMAIL: '/auth/verify-email',
        REFRESH_TOKEN: '/auth/refresh-token',
        LOGOUT: '/auth/logout',
        ME: '/auth/me',
        GOOGLE_AUTH: '/auth/google',
        
        // Admin
        ADMIN_DASHBOARD: '/admin/dashboard',
        ADMIN_USERS: '/admin/users',
        ADMIN_CLASSES: '/admin/classes',
        ADMIN_SUBJECTS: '/admin/subjects',
        ADMIN_RESULTS: '/admin/results',
        ADMIN_ANNOUNCEMENTS: '/admin/announcements',
        ADMIN_STATISTICS: '/admin/statistics/overview',
        
        // Teacher
        TEACHER_DASHBOARD: '/teacher/dashboard',
        TEACHER_STUDENTS: '/teacher/students',
        TEACHER_ATTENDANCE: '/teacher/attendance',
        TEACHER_MATERIALS: '/teacher/study-materials',
        TEACHER_ANNOUNCEMENTS: '/teacher/announcements',
        
        // Student
        STUDENT_DASHBOARD: '/student/dashboard',
        STUDENT_RESULTS: '/student/results',
        STUDENT_ATTENDANCE: '/student/attendance',
        STUDENT_MATERIALS: '/student/study-materials',
        STUDENT_SCHEDULE: '/student/schedule',
        STUDENT_ANNOUNCEMENTS: '/student/announcements',
        STUDENT_EVENTS: '/student/events',
        STUDENT_PROFILE: '/student/profile',
        STUDENT_HOSTEL: '/student/hostel-info',
        
        // Common
        COMMON_CLASSES: '/common/classes',
        COMMON_SUBJECTS: '/common/subjects',
        COMMON_ANNOUNCEMENTS: '/common/announcements/public',
        COMMON_EVENTS: '/common/events/public',
        COMMON_SCHOOL_INFO: '/common/school-info',
        COMMON_SEARCH: '/common/search',
        COMMON_NOTIFICATIONS: '/common/notifications',
        COMMON_CALENDAR: '/common/calendar',
        COMMON_STATS: '/common/stats',
        
        // Upload
        UPLOAD_SINGLE: '/upload/single',
        UPLOAD_MULTIPLE: '/upload/multiple',
        UPLOAD_PROFILE: '/upload/profile-picture',
        UPLOAD_INFO: '/upload/info'
    }
};

// Token management
class TokenManager {
    static setTokens(accessToken, refreshToken) {
        localStorage.setItem('accessToken', accessToken);
        if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
        }
    }
    
    static getAccessToken() {
        return localStorage.getItem('accessToken');
    }
    
    static getRefreshToken() {
        return localStorage.getItem('refreshToken');
    }
    
    static clearTokens() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    }
    
    static isLoggedIn() {
        return !!this.getAccessToken();
    }
}

// User management
class UserManager {
    static setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    }
    
    static getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
    
    static getUserRole() {
        const user = this.getUser();
        return user ? user.role : null;
    }
    
    static clearUser() {
        localStorage.removeItem('user');
    }
}

// Main API class
class EMRApi {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
        this.timeout = API_CONFIG.TIMEOUT;
    }
    
    // Generic request method
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: this.timeout,
        };
        
        // Add authorization header if token exists
        const token = TokenManager.getAccessToken();
        if (token) {
            defaultOptions.headers['Authorization'] = `Bearer ${token}`;
        }
        
        const finalOptions = { ...defaultOptions, ...options };
        
        // Convert body to JSON if it's an object
        if (finalOptions.body && typeof finalOptions.body === 'object') {
            finalOptions.body = JSON.stringify(finalOptions.body);
        }
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            
            const response = await fetch(url, {
                ...finalOptions,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            // Handle different response types
            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }
            
            if (!response.ok) {
                // Handle token expiration
                if (response.status === 401 && TokenManager.getRefreshToken()) {
                    const refreshed = await this.refreshToken();
                    if (refreshed) {
                        // Retry original request with new token
                        finalOptions.headers['Authorization'] = `Bearer ${TokenManager.getAccessToken()}`;
                        return this.makeRequest(endpoint, options);
                    } else {
                        this.handleLogout();
                        throw new Error('Session expired. Please login again.');
                    }
                }
                
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }
    
    // Authentication methods
    async login(email, password, remember = false) {
        const response = await this.makeRequest(API_CONFIG.ENDPOINTS.LOGIN, {
            method: 'POST',
            body: { email, password, remember }
        });
        
        if (response.success) {
            TokenManager.setTokens(response.data.token, response.data.refreshToken);
            UserManager.setUser(response.data.user);
        }
        
        return response;
    }
    
    async loginStudent(studentId, password, remember = false) {
        const response = await this.makeRequest(API_CONFIG.ENDPOINTS.LOGIN_STUDENT, {
            method: 'POST',
            body: { studentId, password, remember }
        });
        
        if (response.success) {
            TokenManager.setTokens(response.data.token, response.data.refreshToken);
            UserManager.setUser(response.data.user);
        }
        
        return response;
    }
    
    async loginTeacher(employeeId, password, remember = false) {
        const response = await this.makeRequest(API_CONFIG.ENDPOINTS.LOGIN_TEACHER, {
            method: 'POST',
            body: { employeeId, password, remember }
        });
        
        if (response.success) {
            TokenManager.setTokens(response.data.token, response.data.refreshToken);
            UserManager.setUser(response.data.user);
        }
        
        return response;
    }
    
    async register(userData) {
        return this.makeRequest(API_CONFIG.ENDPOINTS.REGISTER, {
            method: 'POST',
            body: userData
        });
    }
    
    async forgotPassword(email) {
        return this.makeRequest(API_CONFIG.ENDPOINTS.FORGOT_PASSWORD, {
            method: 'POST',
            body: { email }
        });
    }
    
    async resetPassword(token, password) {
        return this.makeRequest(`${API_CONFIG.ENDPOINTS.RESET_PASSWORD}/${token}`, {
            method: 'POST',
            body: { password }
        });
    }
    
    async changePassword(currentPassword, newPassword) {
        return this.makeRequest(API_CONFIG.ENDPOINTS.CHANGE_PASSWORD, {
            method: 'POST',
            body: { currentPassword, newPassword }
        });
    }
    
    async refreshToken() {
        try {
            const refreshToken = TokenManager.getRefreshToken();
            if (!refreshToken) return false;
            
            const response = await this.makeRequest(API_CONFIG.ENDPOINTS.REFRESH_TOKEN, {
                method: 'POST',
                body: { refreshToken }
            });
            
            if (response.success) {
                TokenManager.setTokens(response.data.token, response.data.refreshToken);
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }
    
    async logout() {
        try {
            await this.makeRequest(API_CONFIG.ENDPOINTS.LOGOUT, {
                method: 'POST'
            });
        } catch (error) {
            console.warn('Logout request failed:', error);
        } finally {
            this.handleLogout();
        }
    }
    
    handleLogout() {
        TokenManager.clearTokens();
        UserManager.clearUser();
        window.location.href = '/login.html';
    }
    
    async getCurrentUser() {
        return this.makeRequest(API_CONFIG.ENDPOINTS.ME);
    }
    
    // Dashboard methods
    async getAdminDashboard() {
        return this.makeRequest(API_CONFIG.ENDPOINTS.ADMIN_DASHBOARD);
    }
    
    async getTeacherDashboard() {
        return this.makeRequest(API_CONFIG.ENDPOINTS.TEACHER_DASHBOARD);
    }
    
    async getStudentDashboard() {
        return this.makeRequest(API_CONFIG.ENDPOINTS.STUDENT_DASHBOARD);
    }
    
    // Common methods
    async getPublicAnnouncements(limit = 10) {
        return this.makeRequest(`${API_CONFIG.ENDPOINTS.COMMON_ANNOUNCEMENTS}?limit=${limit}`);
    }
    
    async getPublicEvents(limit = 10) {
        return this.makeRequest(`${API_CONFIG.ENDPOINTS.COMMON_EVENTS}?limit=${limit}`);
    }
    
    async getSchoolInfo() {
        return this.makeRequest(API_CONFIG.ENDPOINTS.COMMON_SCHOOL_INFO);
    }
    
    async search(query, type = null) {
        const params = new URLSearchParams({ q: query });
        if (type) params.append('type', type);
        return this.makeRequest(`${API_CONFIG.ENDPOINTS.COMMON_SEARCH}?${params}`);
    }
    
    async getNotifications(page = 1, limit = 20) {
        return this.makeRequest(`${API_CONFIG.ENDPOINTS.COMMON_NOTIFICATIONS}?page=${page}&limit=${limit}`);
    }
    
    // Student methods
    async getStudentResults(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.makeRequest(`${API_CONFIG.ENDPOINTS.STUDENT_RESULTS}?${params}`);
    }
    
    async getStudentAttendance(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.makeRequest(`${API_CONFIG.ENDPOINTS.STUDENT_ATTENDANCE}?${params}`);
    }
    
    async getStudentMaterials(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.makeRequest(`${API_CONFIG.ENDPOINTS.STUDENT_MATERIALS}?${params}`);
    }
    
    async getStudentSchedule(day = null) {
        const params = day ? `?day=${day}` : '';
        return this.makeRequest(`${API_CONFIG.ENDPOINTS.STUDENT_SCHEDULE}${params}`);
    }
    
        async getStudentProfile() {
        return this.makeRequest(API_CONFIG.ENDPOINTS.STUDENT_PROFILE);
    }

    async updateStudentProfile(profileData) {
        return this.makeRequest(API_CONFIG.ENDPOINTS.STUDENT_PROFILE, {
            method: 'PUT',
            body: profileData
        });
    }

    async getStudentAnnouncements(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.makeRequest(`${API_CONFIG.ENDPOINTS.STUDENT_ANNOUNCEMENTS}?${params}`);
    }

    // Teacher methods
    async getTeacherMaterials(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.makeRequest(`${API_CONFIG.ENDPOINTS.TEACHER_MATERIALS}?${params}`);
    }

    async getTeacherAnnouncements(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.makeRequest(`${API_CONFIG.ENDPOINTS.TEACHER_ANNOUNCEMENTS}?${params}`);
    }
    
    // File upload methods
    async uploadFile(file, type = 'single') {
        const formData = new FormData();
        if (type === 'single') {
            formData.append('file', file);
        } else {
            formData.append('files', file);
        }
        
        const endpoint = type === 'single' ? 
            API_CONFIG.ENDPOINTS.UPLOAD_SINGLE : 
            API_CONFIG.ENDPOINTS.UPLOAD_MULTIPLE;
        
        return this.makeRequest(endpoint, {
            method: 'POST',
            body: formData,
            headers: {} // Remove Content-Type to let browser set it for FormData
        });
    }
    
    async uploadProfilePicture(file) {
        const formData = new FormData();
        formData.append('profilePicture', file);
        
        return this.makeRequest(API_CONFIG.ENDPOINTS.UPLOAD_PROFILE, {
            method: 'POST',
            body: formData,
            headers: {} // Remove Content-Type to let browser set it for FormData
        });
    }
}

// Global API instance
const api = new EMRApi();

// Utility functions
const ApiUtils = {
    // Show loading state
    showLoading(element, text = 'Loading...') {
        const originalContent = element.innerHTML;
        element.setAttribute('data-original-content', originalContent);
        element.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
        element.disabled = true;
    },
    
    // Hide loading state
    hideLoading(element) {
        const originalContent = element.getAttribute('data-original-content');
        if (originalContent) {
            element.innerHTML = originalContent;
            element.removeAttribute('data-original-content');
        }
        element.disabled = false;
    },
    
    // Show toast notification
    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Remove toast after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 5000);
    },
    
    getToastIcon(type) {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'warning': return 'exclamation-triangle';
            default: return 'info-circle';
        }
    },
    
    // Format date
    formatDate(date, format = 'short') {
        const d = new Date(date);
        if (format === 'short') {
            return d.toLocaleDateString();
        } else if (format === 'long') {
            return d.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }
        return d.toString();
    },
    
    // Handle API errors
    handleApiError(error, defaultMessage = 'An error occurred') {
        console.error('API Error:', error);
        const message = error.message || defaultMessage;
        this.showToast(message, 'error');
    },
    
    // Check if user is authenticated
    requireAuth(redirectTo = '/login.html') {
        if (!TokenManager.isLoggedIn()) {
            window.location.href = redirectTo;
            return false;
        }
        return true;
    },
    
    // Check user role
    requireRole(requiredRole, redirectTo = '/') {
        const userRole = UserManager.getUserRole();
        if (!userRole || userRole !== requiredRole) {
            window.location.href = redirectTo;
            return false;
        }
        return true;
    },
    
    // Get dashboard URL based on role
    getDashboardUrl(role) {
        switch (role) {
            case 'admin': return '/admin-dashboard.html';
            case 'teacher': return '/teacher-dashboard.html';
            case 'student': return '/student-dashboard.html';
            default: return '/';
        }
    }
};

// Auto-refresh token on page load
document.addEventListener('DOMContentLoaded', async () => {
    if (TokenManager.isLoggedIn()) {
        try {
            await api.getCurrentUser();
        } catch (error) {
            console.warn('Token validation failed:', error);
            // Try to refresh token
            const refreshed = await api.refreshToken();
            if (!refreshed) {
                api.handleLogout();
            }
        }
    }
});

// Export for global use
window.api = api;
window.TokenManager = TokenManager;
window.UserManager = UserManager;
window.ApiUtils = ApiUtils;