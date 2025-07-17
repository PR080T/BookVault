# 📚 BookVault

A modern, personal book tracking web application that helps you manage your reading journey with ease.

## ✨ Features

- **📖 Book Management**: Add books via ISBN lookup with automatic metadata fetching from Open Library
- **📊 Reading Progress**: Track your current page and reading status
- **⭐ Rating System**: Rate books on a 0-5 scale with decimal precision
- **📝 Personal Notes**: Add private notes and quotes for each book
- **🏷️ Smart Shelving**: Organize books into "To Read", "Currently Reading", and "Read" shelves
- **📱 Responsive Design**: Clean, intuitive interface optimized for all devices
- **🌙 Dark Mode**: Full dark/light theme support
- **🔒 Secure Authentication**: JWT-based authentication with password hashing
- **📤 Data Export**: Export your library data in multiple formats
- **📈 Reading Statistics**: Track your reading habits and progress

## 🏗️ Tech Stack

### Frontend
- **React 19** with Vite for fast development
- **Tailwind CSS** + **Flowbite React** for modern UI components
- **Framer Motion** for smooth animations
- **Axios** for API communication

### Backend
- **Flask** (Python) with RESTful API design
- **SQLAlchemy** with **PostgreSQL** database
- **JWT** authentication system
- **Alembic** for database migrations

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- PostgreSQL database

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/bookvault.git
   cd bookvault
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your database URL and secret key
   flask db upgrade
   python app.py
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with your API endpoint
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/docs

## 🌐 Deployment

### Production Deployment

**Frontend (Vercel)**
1. Connect your GitHub repository to Vercel
2. Set environment variables:
   ```
   VITE_API_ENDPOINT=https://your-api.onrender.com/
   VITE_AUTH_API_URL=https://your-api.onrender.com
   ```
3. Deploy automatically

**Backend (Render)**
1. Create a new Web Service on Render
2. Use the included `render.yaml` configuration
3. Add PostgreSQL database service
4. Set environment variables:
   ```
   DATABASE_URL=postgresql://user:pass@host:port/database
   AUTH_SECRET_KEY=your-secret-key
   AUTH_ALLOW_REGISTRATION=true
   ```

## 📁 Project Structure

```
bookvault/
├── backend/                 # Flask API server
│   ├── routes/             # API route handlers
│   ├── auth/               # Authentication logic
│   ├── models.py           # Database models
│   ├── app.py              # Application entry point
│   └── requirements.txt    # Python dependencies
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   └── contexts/       # React contexts
│   ├── public/             # Static assets
│   └── package.json        # Node.js dependencies
├── render.yaml             # Render deployment config
└── README.md
```

## 🔧 Environment Variables

### Frontend (.env)
```bash
VITE_API_ENDPOINT=http://localhost:5000/
VITE_AUTH_API_URL=http://localhost:5000
```

### Backend (.env)
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/bookvault
AUTH_SECRET_KEY=your-secret-key-here
AUTH_ALLOW_REGISTRATION=true
FLASK_ENV=development
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [Open Library API](https://openlibrary.org/developers/api) for book metadata
- [Flowbite React](https://flowbite-react.com/) for UI components
- [React Icons](https://react-icons.github.io/react-icons/) for iconography

---

**Built with ❤️ for book lovers everywhere**
