-- BookVault Database Indexes for Performance Optimization
-- Run these commands in your PostgreSQL database to improve query performance

-- Books table indexes
CREATE INDEX idx_books_owner_id ON books(owner_id);
CREATE INDEX idx_books_isbn ON books(isbn);
CREATE INDEX idx_books_reading_status ON books(reading_status);
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_author ON books(author);
CREATE INDEX idx_books_owner_status ON books(owner_id, reading_status);

-- Notes table indexes
CREATE INDEX idx_notes_book_id ON notes(book_id);
CREATE INDEX idx_notes_visibility ON notes(visibility);
CREATE INDEX idx_notes_book_visibility ON notes(book_id, visibility);

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- Verification table indexes
CREATE INDEX idx_verification_user_id ON verification(user_id);
CREATE INDEX idx_verification_status ON verification(status);

-- Profile table indexes
CREATE INDEX idx_profiles_owner_id ON profiles(owner_id);
CREATE INDEX idx_profiles_display_name ON profiles(display_name);
CREATE INDEX idx_profiles_visibility ON profiles(visibility);

-- Tasks table indexes
CREATE INDEX idx_tasks_task_type ON tasks(task_type);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_owner_id ON tasks(owner_id);
CREATE INDEX idx_tasks_type_status ON tasks(task_type, status);

-- Files table indexes
CREATE INDEX idx_files_owner_id ON files(owner_id);
CREATE INDEX idx_files_created_at ON files(created_at);

-- User Settings table indexes
CREATE INDEX idx_user_settings_owner_id ON user_settings(owner_id);

-- Revoked Tokens table indexes
CREATE INDEX idx_revoked_tokens_jti ON revoked_tokens(jti);