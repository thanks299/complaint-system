# 🚨 Complaint Management System

A modern, full-stack complaint management system built with JavaScript, Express.js, and Supabase. This system provides a comprehensive solution for handling customer complaints, tracking their status, and managing resolution workflows.

## 📋 Project Scope

### Core Features
- **Complaint Submission**: Users can submit complaints with detailed information
- **Status Tracking**: Real-time tracking of complaint status (Open, In Progress, Resolved, Closed)
- **User Management**: Role-based access control (Admin, Manager, User)
- **Dashboard Analytics**: Visual insights into complaint trends and resolution metrics
- **File Attachments**: Support for uploading relevant documents and images
- **Email Notifications**: Automated notifications for status updates
- **Search & Filtering**: Advanced search capabilities with multiple filters
- **Priority Management**: Categorize complaints by urgency levels

### Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES6+), Bootstrap 5
- **Backend**: Node.js, Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Deployment**: Vercel (Frontend) + Railway/Render (Backend)

## 🏗️ Project Structure

```
complaint-system/
├── frontend/                 # Frontend application
│   ├── index.html           # Main dashboard
│   ├── css/                 # Stylesheets
│   ├── js/                  # JavaScript modules
│   └── assets/              # Images and static files
├── backend/                 # Express.js API
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── models/          # Data models
│   │   ├── middleware/      # Custom middleware
│   │   └── utils/           # Utility functions
│   ├── tests/               # Test files
│   └── package.json
├── database/                # Database schemas and migrations
├── docs/                    # Documentation
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd complaint-system
   ```

2. **Install dependencies**
   ```bash
   # Backend dependencies
   cd backend
   npm install
   
   # Frontend dependencies (if using a build tool)
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Create .env file in backend directory
   cp backend/.env.example backend/.env
   # Add your Supabase credentials
   ```

4. **Database Setup**
   - Create a new Supabase project
   - Run the database migrations
   - Configure authentication settings

5. **Start the application**
   ```bash
   # Start backend server
   cd backend
   npm run dev
   
   # Open frontend in browser
   open frontend/index.html
   ```

## 📊 Database Schema

### Tables
- **users**: User accounts and profiles
- **complaints**: Main complaint records
- **complaint_status**: Status tracking history
- **attachments**: File attachments
- **categories**: Complaint categories
- **priorities**: Priority levels

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Complaints
- `GET /api/complaints` - Get all complaints (with filters)
- `POST /api/complaints` - Create new complaint
- `GET /api/complaints/:id` - Get specific complaint
- `PUT /api/complaints/:id` - Update complaint
- `DELETE /api/complaints/:id` - Delete complaint

### Status Management
- `PUT /api/complaints/:id/status` - Update complaint status
- `GET /api/complaints/:id/history` - Get status history

## 🎨 Frontend Features

### Dashboard
- Overview statistics
- Recent complaints
- Quick actions
- Status distribution charts

### Complaint Management
- Create new complaint form
- Complaint listing with filters
- Detailed complaint view
- Status update interface

### User Interface
- Responsive design
- Dark/light theme toggle
- Mobile-friendly layout
- Accessibility compliant

## 🧪 Testing

### Test Coverage
- Unit tests for API endpoints
- Integration tests for database operations
- Frontend component testing
- End-to-end testing scenarios

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

## 📈 AI Integration

### Planned AI Features
- **Smart Categorization**: Auto-categorize complaints using NLP
- **Sentiment Analysis**: Analyze complaint sentiment for priority assignment
- **Response Suggestions**: AI-powered response templates
- **Trend Analysis**: Predictive analytics for complaint patterns
- **Automated Routing**: Smart assignment to appropriate departments

## 🚀 Deployment

### Frontend (Vercel)
1. Connect GitHub repository
2. Configure build settings
3. Set environment variables
4. Deploy

### Backend (Railway/Render)
1. Connect repository
2. Configure environment variables
3. Set up database connection
4. Deploy

### Database (Supabase)
1. Create production project
2. Run migrations
3. Configure security policies
4. Set up monitoring

## 📝 Documentation

- [API Documentation](docs/api.md)
- [Database Schema](docs/database.md)
- [Frontend Components](docs/frontend.md)
- [Deployment Guide](docs/deployment.md)
- [Contributing Guidelines](docs/contributing.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Future Enhancements

- Mobile app (React Native)
- Advanced analytics dashboard
- Integration with external systems
- Multi-language support
- Advanced reporting features
- Workflow automation
- SLA tracking
- Customer satisfaction surveys

---

**Built with ❤️ using JavaScript, Express.js, and Supabase**