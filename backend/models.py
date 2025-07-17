from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from marshmallow import fields as ma_fields
from db import db, ma

# -------------------- VERIFICATION --------------------


class Verification(db.Model):
    __tablename__ = "verification"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    status = db.Column(db.String(50), default="unverified")
    code = db.Column(db.String(255), nullable=True)
    code_valid_until = db.Column(db.DateTime, nullable=True)

    def __init__(self, **kwargs):
        super(Verification, self).__init__(**kwargs)

    def save_to_db(self):
        db.session.add(self)
        db.session.commit()


class VerificationSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Verification
        fields = ("status",)
        load_instance = True


# -------------------- USER --------------------
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False, unique=True)
    name = db.Column(db.String(255), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), default="user")
    status = db.Column(db.String(50), default="active")
    verification = db.relationship(
        "Verification", uselist=False, backref="user", 
        cascade="all, delete-orphan"
    )

    def __init__(self, **kwargs):
        super(User, self).__init__(**kwargs)

    def save_to_db(self):
        db.session.add(self)
        db.session.commit()

    @classmethod
    def find_by_email(cls, email: str):
        return cls.query.filter_by(email=email).first()

    @staticmethod
    def generate_hash(password: str) -> str:
        return generate_password_hash(password)

    @staticmethod
    def verify_hash(password: str, hash: str) -> bool:
        return check_password_hash(hash, password)


class UserSchema(ma.SQLAlchemyAutoSchema):
    verification = ma_fields.Nested(VerificationSchema)

    class Meta:
        model = User
        fields = ("id", "name", "email", "role", "status", "verification")
        load_instance = True


# -------------------- PROFILE --------------------
class Profile(db.Model):
    __tablename__ = 'profiles'
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    display_name = db.Column(db.String(255), nullable=True, unique=True)
    bio = db.Column(db.Text, nullable=True)
    location = db.Column(db.String(255), nullable=True)
    website = db.Column(db.String(255), nullable=True)
    social_media = db.Column(db.Text, nullable=True)
    avatar = db.Column(db.String(255), nullable=True)
    visibility = db.Column(db.String(50), default="private")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def __init__(self, **kwargs):
        super(Profile, self).__init__(**kwargs)

    def save_to_db(self):
        db.session.add(self)
        db.session.commit()

    @classmethod
    def find_by_owner(cls, owner_id: int):
        return cls.query.filter_by(owner_id=owner_id).first()


class ProfileSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Profile
        fields = (
            "id", "name", "display_name", "bio", "location", "website", 
            "social_media", "avatar", "visibility", "created_at", "updated_at"
        )
        load_instance = True


# -------------------- BOOKS --------------------
class Books(db.Model):
    __tablename__ = 'books'
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(500), nullable=False)
    author = db.Column(db.String(255), nullable=True)
    isbn = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=True)
    reading_status = db.Column(db.String(50), default="To be read")
    current_page = db.Column(db.Integer, default=0)
    total_pages = db.Column(db.Integer, default=0)
    rating = db.Column(db.Numeric(3, 2), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    notes = db.relationship(
        "Notes", backref="book", cascade="all, delete-orphan"
    )

    def __init__(self, **kwargs):
        super(Books, self).__init__(**kwargs)

    def save_to_db(self):
        db.session.add(self)
        db.session.commit()
    
    def delete(self):
        db.session.delete(self)
        db.session.commit()

    @classmethod
    def find_by_owner_and_isbn(cls, owner_id: int, isbn: str):
        return cls.query.filter_by(owner_id=owner_id, isbn=isbn).first()


# -------------------- NOTES --------------------
class Notes(db.Model):
    __tablename__ = 'notes'
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    book_id = db.Column(db.Integer, db.ForeignKey("books.id"), nullable=False)
    note = db.Column(db.Text, nullable=False)
    quote = db.Column(db.Text, nullable=True)
    quote_page = db.Column(db.Integer, nullable=True)
    visibility = db.Column(db.String(50), default="private")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def __init__(self, **kwargs):
        super(Notes, self).__init__(**kwargs)

    def save_to_db(self):
        db.session.add(self)
        db.session.commit()

    @classmethod
    def find_by_owner_and_book(cls, owner_id: int, book_id: int):
        return cls.query.filter_by(owner_id=owner_id, book_id=book_id).all()


class NotesSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Notes
        fields = (
            "id", "note", "quote", "quote_page", "visibility",
            "created_at", "updated_at"
        )
        load_instance = True


class BooksSchema(ma.SQLAlchemyAutoSchema):
    num_notes = ma_fields.Method("get_notes_count")

    class Meta:
        model = Books
        fields = (
            "id", "title", "author", "isbn", "description", "reading_status",
            "current_page", "total_pages", "rating", "num_notes",
            "created_at", "updated_at"
        )
        load_instance = True

    def get_notes_count(self, obj):
        return len(obj.notes) if obj.notes else 0


class BooksStatusSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Books
        fields = (
            "id", "reading_status", "current_page", "total_pages", "rating"
        )
        load_instance = True


# -------------------- TASKS --------------------
class Tasks(db.Model):
    __tablename__ = 'tasks'
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    task_type = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(50), default="pending")
    progress = db.Column(db.Integer, default=0)
    result = db.Column(db.Text, nullable=True)
    error = db.Column(db.Text, nullable=True)
    task_metadata = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def __init__(self, **kwargs):
        super(Tasks, self).__init__(**kwargs)

    def save_to_db(self):
        db.session.add(self)
        db.session.commit()

    @classmethod
    def find_by_owner(cls, owner_id: int):
        return cls.query.filter_by(owner_id=owner_id).all()


class TasksSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Tasks
        fields = (
            "id", "task_type", "status", "progress", "result", "error", 
            "task_metadata", "created_at", "updated_at"
        )
        load_instance = True


# -------------------- FILES --------------------
class Files(db.Model):
    __tablename__ = 'files'
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(50), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer, nullable=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, **kwargs):
        super(Files, self).__init__(**kwargs)

    def save_to_db(self):
        db.session.add(self)
        db.session.commit()

    @classmethod
    def find_by_owner(cls, owner_id: int):
        return cls.query.filter_by(owner_id=owner_id).all()


class FilesSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Files
        fields = (
            "id", "filename", "file_type", "file_path", "file_size", 
            "description", "created_at"
        )
        load_instance = True


# -------------------- USER SETTINGS --------------------
class UserSettings(db.Model):
    __tablename__ = 'user_settings'
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True
    )
    theme = db.Column(db.String(50), default="light")
    language = db.Column(db.String(10), default="en")
    timezone = db.Column(db.String(50), default="UTC")
    notifications = db.Column(db.Boolean, default=True)
    privacy_level = db.Column(db.String(50), default="public")
    export_format = db.Column(db.String(20), default="json")
    send_book_events = db.Column(db.Boolean, default=False)
    mastodon_url = db.Column(db.String(255), nullable=True)
    mastodon_access_token = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def __init__(self, **kwargs):
        super(UserSettings, self).__init__(**kwargs)

    def save_to_db(self):
        db.session.add(self)
        db.session.commit()

    @classmethod
    def find_by_owner(cls, owner_id: int):
        return cls.query.filter_by(owner_id=owner_id).first()


class UserSettingsSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = UserSettings
        fields = (
            "id", "theme", "language", "timezone", "notifications",
            "privacy_level", "export_format", "send_book_events",
            "mastodon_url", "mastodon_access_token", "created_at", "updated_at"
        )
        load_instance = True