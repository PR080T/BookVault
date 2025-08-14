# BookVault

BookVault is a personal book tracking web app with a modern frontend and secure backend.

## Features
- Add, edit, and remove books from your library
- Track reading status and statistics
- User authentication with JWT
- Notes and file uploads for books
- Admin and user roles

## Getting Started
1. Clone the repository:
   ```sh
   git clone https://github.com/PR080T/BookVault.git
   ```
2. Set up environment variables (`DATABASE_URL`, `AUTH_SECRET_KEY`)
3. Install dependencies:
   ```sh
   pip install -r backend/requirements.txt
   cd frontend && npm install
   ```
4. Run the backend:
   ```sh
   cd backend
   python app.py
   ```
5. Run the frontend:
   ```sh
   cd frontend
   npm run dev
   ```

## Deployment
See `DEPLOYMENT_GUIDE.md` for full instructions.

## License
MIT
