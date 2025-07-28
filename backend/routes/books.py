"""
Books API Routes

This module handles all book-related API endpoints including:
- Adding books to reading lists
- Updating book progress and status
- Managing book ratings (0-5 scale with decimal support)
- Handling book notes
- Book deletion and retrieval

All endpoints require JWT authentication and operate on user-specific data.
"""
from flask import Blueprint, request, jsonify  # Flask web framework components
from flask_jwt_extended import jwt_required, get_jwt  # Flask web framework components
from models import (Books, BooksSchema, NotesSchema, Notes, UserSettings,
                    BooksStatusSchema, Profile)
from db import db
from routes.tasks import _create_task
from security import sanitize_input, check_sql_injection, validate_isbn as security_validate_isbn
import json
import logging  # Application logging
from sqlalchemy.exc import IntegrityError  # Database ORM components
from decimal import Decimal, InvalidOperation
import re

  # Configure logging
logger = logging.getLogger(__name__)

books_endpoint = Blueprint('books', __name__)


def validate_isbn(isbn):  # Function: validate_isbn
    """
    Validate ISBN-10 or ISBN-13 format using security module
    Returns cleaned ISBN if valid, None if invalid
    """
    if not isbn:  # Conditional statement
        return None
    
  # Remove any non-digit characters except X for cleaning
    cleaned = re.sub(r'[^0-9X]', '', isbn.upper())
    
  # Use security module for proper validation
    if security_validate_isbn(cleaned):  # Conditional statement
        return cleaned
    
  # Fallback for simple format validation (for compatibility)
    if len(cleaned) >= 10:  # Conditional statement
        return cleaned
    
    return None


@books_endpoint.route("/v1/books/<isbn>", methods=["GET"])
@jwt_required()  # Requires valid JWT token for access
def get_book_reading_status(isbn):  # Getter method for book_reading_status
    """
    Check if book (by ISBN) is already in a list.

    Returns book status and current reading progress if book exists in
    user's library.
    """
    try:  # Exception handling block
        claim_id = get_jwt()["id"]

  # Validate ISBN
        if not isbn or not isbn.strip():  # Conditional statement
            return jsonify({
                "error": "Bad request",
                "message": "ISBN cannot be empty"
            }), 400

        isbn = validate_isbn(isbn.strip())
        if not isbn:  # Conditional statement
            return jsonify({
                "error": "Bad request",
                "message": ("Invalid ISBN format. Please provide a valid "
                           "ISBN-10 or ISBN-13.")
            }), 400

        book = Books.query.filter(
            Books.owner_id == claim_id, Books.isbn == isbn
        ).first()

        if book:  # Conditional statement
            books_status_schema = BooksStatusSchema(many=False)
            return jsonify(books_status_schema.dump(book)), 200
        else:  # Default case
            return jsonify({
                "error": "Not found",
                "message": f"No book with ISBN {isbn} found in your library"
            }), 404

    except Exception as e:  # Exception handler
        logger.error("Error getting book reading status: %s", e)
        return jsonify({
            "error": "Internal server error",
            "message": "An unexpected error occurred"
        }), 500


@books_endpoint.route("/v1/books", methods=["GET"])
@jwt_required()  # Requires valid JWT token for access
def get_books():  # Getter method for books
    """
    Get books in user's library with pagination and filtering.

    Query parameters:
    - status: Filter by reading status ("To be read", "Currently reading",
      "Read")
    - limit: Number of books per page (default: 25, max: 100)
    - offset: Page number (default: 1)
    """
    try:  # Exception handling block
        claim_id = get_jwt()["id"]

  # Parse pagination parameters
        limit = request.args.get('limit', 25, type=int)
        offset = request.args.get('offset', 1, type=int)

  # Validate pagination parameters
        if limit < 1 or limit > 100:  # Conditional statement
            return jsonify({
                "error": "Bad request",
                "message": "Limit must be between 1 and 100"
            }), 400

        if offset < 1:  # Conditional statement
            return jsonify({
                "error": "Bad request",
                "message": "Page offset must be greater than 0"
            }), 400

  # Parse status filter
        query_status = request.args.get("status")
        valid_statuses = ["To be read", "Currently reading", "Read"]

        if query_status and query_status not in valid_statuses:  # Conditional statement
            return jsonify({
                "error": "Bad request",
                "message": (f"Invalid status. Must be one of: "
                           f"{', '.join(valid_statuses)}")
            }), 400

  # Parse search query
        search_query = request.args.get("search", "").strip()

  # Build query
        query = Books.query.filter(Books.owner_id == claim_id)

        if query_status:  # Conditional statement
            query = query.filter(Books.reading_status == query_status)
        
        if search_query:  # Conditional statement
            search_filter = db.or_(
                Books.title.ilike(f"%{search_query}%"),
                Books.author.ilike(f"%{search_query}%"),
                Books.isbn.ilike(f"%{search_query}%")
            )
            query = query.filter(search_filter)

  # Execute paginated query
        books = query.paginate(
            page=offset,
            per_page=limit,
            error_out=False
        )

  # Serialize response
        books_schema = BooksSchema(many=True)

        response_data = {
            "items": books_schema.dump(books.items),
            "meta": {
                "page": books.page,
                "per_page": books.per_page,
                "total_items": books.total,
                "total_pages": books.pages,
                "has_next": books.has_next,
                "has_prev": books.has_prev,
                "offset": (books.page - 1) * books.per_page
            }
        }

        return jsonify(response_data), 200

    except Exception as e:  # Exception handler
        logger.error("Error getting books: %s", e)
        return jsonify({
            "error": "Internal server error",
            "message": "An unexpected error occurred"
        }), 500


@books_endpoint.route("/v1/books", methods=["POST"])
@jwt_required()  # Requires valid JWT token for access
def add_book():  # Function: add_book
    """
        Add book to list
        ---
        tags:
            - Books
        parameters:
            - name: title
              in: body
              type: string
              required: true
            - name: isbn
              in: body
              type: string
              required: true
            - name: author
              in: body
              type: string
              required: false
            - name: description
              in: body
              type: string
              required: false
            - name: reading_status
              in: body
              type: string
              required: false
              default: To be read
            - name: current_page
              in: body
              type: integer
              required: false
              default: 0
            - name: total_pages
              in: body
              type: integer
              required: false
              default: 0
        security:
            - bearerAuth: []
        responses:
          200:
            description: Book added to list.
    """

  # Validate request data
    if not request.json:  # Conditional statement
        return jsonify({
            'error': 'Bad request',
            'message': 'No JSON data provided'
        }), 400

    required_fields = ['title', 'isbn']
    for field in required_fields:  # Loop iteration
        if field not in request.json or not request.json[field]:  # Conditional statement
            return jsonify({
                'error': 'Bad request',
                'message': f'Missing required field: {field}'
            }), 400

  # Validate ISBN format
    isbn = validate_isbn(request.json["isbn"].strip())
    if not isbn:  # Conditional statement
        return jsonify({
            'error': 'Bad request',
            'message': ('Invalid ISBN format. Please provide a valid '
                       'ISBN-10 or ISBN-13.')
        }), 400
  # Validate and sanitize title
    title = sanitize_input(request.json["title"].strip())
    if not title or len(title) > 500:  # Conditional statement
        return jsonify({
            'error': 'Bad request',
            'message': 'Title must be between 1 and 500 characters'
        }), 400
    
    if check_sql_injection(title):  # Conditional statement
        return jsonify({
            'error': 'Bad request',
            'message': 'Invalid characters in title'
        }), 400

    claim_id = get_jwt()["id"]

  # Check if book already exists for this user
    existing_book = Books.query.filter(
        Books.owner_id == claim_id, Books.isbn == isbn
    ).first()
    if existing_book:  # Conditional statement
        return jsonify({
            'error': 'Conflict',
            'message': 'Book already exists in your library'
        }), 409

    author = sanitize_input(request.json.get("author", "").strip()) or None
    description = sanitize_input(request.json.get("description", "").strip()) or None
    
  # Additional validation for author and description
    if author and check_sql_injection(author):  # Conditional statement
        return jsonify({
            'error': 'Bad request',
            'message': 'Invalid characters in author field'
        }), 400
    
    if description and check_sql_injection(description):  # Conditional statement
        return jsonify({
            'error': 'Bad request',
            'message': 'Invalid characters in description field'
        }), 400

    reading_status = request.json.get("reading_status", "To be read")
    if reading_status not in ["To be read", "Currently reading", "Read"]:  # Conditional statement
        reading_status = "To be read"

    current_page = request.json.get("current_page", 0)
    total_pages = request.json.get("total_pages", 0)
  # Validate page numbers
    try:  # Exception handling block
        current_page = int(current_page) if current_page is not None else 0
        total_pages = int(total_pages) if total_pages is not None else 0
        if current_page < 0 or total_pages < 0:  # Conditional statement
            return jsonify({
                'error': 'Bad request',
                'message': 'Page numbers cannot be negative'
            }), 400
        if current_page > total_pages and total_pages > 0:  # Conditional statement
            return jsonify({
                'error': 'Bad request',
                'message': 'Current page cannot exceed total pages'
            }), 400
    except (ValueError, TypeError):  # Exception handler
        return jsonify({
            'error': 'Bad request',
            'message': 'Page numbers must be integers'
        }), 400

    try:  # Exception handling block
        new_book = Books(  # type: ignore
            owner_id=claim_id,
            title=title,
            isbn=isbn,
            description=description,
            reading_status=reading_status,
            current_page=current_page,
            total_pages=total_pages,
            author=author
        )
        new_book.save_to_db()
        return jsonify({
            'message': 'Book added to library successfully.',
            'book_id': new_book.id
        }), 201
    except IntegrityError as e:  # Exception handler
        db.session.rollback()
  # Check if it's a foreign key constraint error
        if "foreign key constraint" in str(e.orig).lower():  # Conditional statement
            prof = Profile.query.filter_by(owner_id=claim_id).first()
            if prof is None:  # Conditional statement
                return jsonify({
                    'error': 'Profile required',
                    'message': ('A profile must be created before adding '
                               'books. Please create your profile first.')
                }), 409
        return jsonify({
            'error': 'Database error',
            'message': 'Failed to add book due to database constraint.'
        }), 409
    except Exception:  # Exception handler
        db.session.rollback()
        return jsonify({
            'error': 'Internal server error',
            'message': 'An unexpected error occurred while adding the book.'
        }), 500


@books_endpoint.route("/v1/books/<id>", methods=["PATCH"])
@jwt_required()  # Requires valid JWT token for access
def edit_book(id):  # Function: edit_book
    """
    Edit book details, progress, status, or rating.

    Supports updating:
    - current_page: Current reading progress
    - total_pages: Total pages in the book
    - status: Reading status ("To be read", "Currently reading", "Read")
    - rating: Book rating (0-5 scale with decimal support)
    - title: Book title
    - author: Book author
    - description: Book description
    """
    try:  # Exception handling block
        claim_id = get_jwt()["id"]

  # Validate book ID
        try:  # Exception handling block
            book_id = int(id)
        except (ValueError, TypeError):  # Exception handler
            return jsonify({
                "error": "Bad request",
                "message": "Invalid book ID"
            }), 400

  # Find the book
        book = Books.query.filter(
            Books.owner_id == claim_id, Books.id == book_id
        ).first()

        if not book:  # Conditional statement
            return jsonify({
                "error": "Not found",
                "message": f"No book with ID {id} was found"
            }), 404

  # Validate request payload
        if not request.json:  # Conditional statement
            return jsonify({
                "error": "Bad request",
                "message": "Request must contain JSON data"
            }), 400

  # Track if any changes were made
        changes_made = False

  # Handle current_page updates
        if "current_page" in request.json:  # Conditional statement
            try:  # Exception handling block
                current_page = int(request.json["current_page"])
                if current_page < 0:  # Conditional statement
                    return jsonify({
                        "error": "Unprocessable entity",
                        "message": "Current page cannot be negative"
                    }), 422
                if book.total_pages > 0 and current_page > book.total_pages:  # Conditional statement
                    return jsonify({
                        "error": "Unprocessable entity",
                        "message": "Current page cannot exceed total pages"
                    }), 422
                book.current_page = current_page
                changes_made = True
            except (ValueError, TypeError):  # Exception handler
                return jsonify({
                    "error": "Unprocessable entity",
                    "message": "Current page must be a valid integer"
                }), 422

  # Handle total_pages updates
        if "total_pages" in request.json:  # Conditional statement
            try:  # Exception handling block
                total_pages = int(request.json["total_pages"])
                if total_pages < 0:  # Conditional statement
                    return jsonify({
                        "error": "Unprocessable entity",
                        "message": "Total pages cannot be negative"
                    }), 422
  # Check if current_page needs adjustment
                if book.current_page > total_pages and total_pages > 0:  # Conditional statement
                    return jsonify({
                        "error": "Unprocessable entity",
                        "message": ("Cannot set total pages less than "
                                   "current page")
                    }), 422
                book.total_pages = total_pages
                changes_made = True
            except (ValueError, TypeError):  # Exception handler
                return jsonify({
                    "error": "Unprocessable entity",
                    "message": "Total pages must be a valid integer"
                }), 422

  # Handle status updates
        if "status" in request.json:  # Conditional statement
            valid_statuses = ["Currently reading", "To be read", "Read"]
            new_status = request.json["status"]

            if new_status not in valid_statuses:  # Conditional statement
                return jsonify({
                    "error": "Unprocessable entity",
                    "message": (f"Status must be one of: "
                               f"{', '.join(valid_statuses)}")
                }), 422

            book.reading_status = new_status
            changes_made = True

  # Handle social sharing for completed books
            try:  # Exception handling block
                user_settings = UserSettings.query.filter(
                    UserSettings.owner_id == claim_id,
                    UserSettings.send_book_events.is_(True)
                ).first()

                if user_settings and new_status == "Read":  # Conditional statement
                    task_data = {
                        "title": book.title,
                        "author": book.author,
                        "reading_status": new_status
                    }
                    _create_task(
                        "share_book_event", json.dumps(task_data), claim_id
                    )
            except Exception as e:  # Exception handler
                logger.warning("Failed to create social sharing task: %s", e)
  # Don't fail the whole request for social sharing issues

  # Handle rating updates
        if "rating" in request.json:  # Conditional statement
            rating_value = request.json["rating"]

            if rating_value is None:  # Conditional statement
                book.rating = None
                changes_made = True
            else:  # Default case
                try:  # Exception handling block
                    rating_value = float(rating_value)
                    if not (0 <= rating_value <= 5):  # Conditional statement
                        return jsonify({
                            "error": "Unprocessable entity",
                            "message": "Rating must be between 0 and 5"
                        }), 422
                    book.rating = Decimal(str(rating_value))
                    changes_made = True
                except (ValueError, TypeError, InvalidOperation):  # Exception handler
                    return jsonify({
                        "error": "Unprocessable entity",
                        "message": "Rating must be a valid number"
                    }), 422

  # Handle title updates
        if "title" in request.json:  # Conditional statement
            title = request.json["title"].strip()
            if not title:  # Conditional statement
                return jsonify({
                    "error": "Unprocessable entity",
                    "message": "Title cannot be empty"
                }), 422
            if len(title) > 500:  # Conditional statement
                return jsonify({
                    "error": "Unprocessable entity",
                    "message": "Title must be less than 500 characters"
                }), 422
            book.title = title
            changes_made = True

  # Handle author updates
        if "author" in request.json:  # Conditional statement
            author = request.json["author"].strip() or None
            if author and len(author) > 255:  # Conditional statement
                return jsonify({
                    "error": "Unprocessable entity",
                    "message": "Author must be less than 255 characters"
                }), 422
            book.author = author
            changes_made = True

  # Handle description updates
        if "description" in request.json:  # Conditional statement
            description = request.json["description"].strip() or None
            book.description = description
            changes_made = True

  # Save changes if any were made
        if changes_made:  # Conditional statement
            book.save_to_db()
            return jsonify({'message': 'Book updated successfully'}), 200
        else:  # Default case
            return jsonify({'message': 'No changes made'}), 200

    except Exception as e:  # Exception handler
        db.session.rollback()
        logger.error("Error updating book: %s", e)
        return jsonify({
            "error": "Internal server error",
            "message": "An unexpected error occurred while updating the book"
        }), 500


@books_endpoint.route("/v1/books/<id>", methods=["DELETE"])
@jwt_required()  # Requires valid JWT token for access
def remove_book(id):  # Function: remove_book
    """
    Remove book from user's library.

    This will also delete all associated notes and data.
    """
    try:  # Exception handling block
        claim_id = get_jwt()["id"]

  # Validate book ID
        try:  # Exception handling block
            book_id = int(id)
        except (ValueError, TypeError):  # Exception handler
            return jsonify({
                "error": "Bad request",
                "message": "Invalid book ID"
            }), 400

  # Find the book
        book = Books.query.filter(
            Books.owner_id == claim_id, Books.id == book_id
        ).first()

        if not book:  # Conditional statement
            return jsonify({
                "error": "Not found",
                "message": f"No book with ID {id} was found"
            }), 404

  # Store book title for confirmation message
        book_title = book.title

  # Delete the book (cascade will handle notes)
        book.delete()

        return jsonify({
            'message': f'Book "{book_title}" removed successfully'
        }), 200

    except Exception as e:  # Exception handler
        db.session.rollback()
        logger.error("Error removing book: %s", e)
        return jsonify({
            "error": "Internal server error",
            "message": "An unexpected error occurred while removing the book"
        }), 500


@books_endpoint.route("/v1/books/<id>/notes", methods=["GET"])
@jwt_required()  # Requires valid JWT token for access
def get_notes_for_book(id):  # Getter method for notes_for_book
    """
    Get all notes for a specific book.

    Returns all notes and annotations associated with the book.
    """
    try:  # Exception handling block
        claim_id = get_jwt()["id"]

  # Validate book ID
        try:  # Exception handling block
            book_id = int(id)
        except (ValueError, TypeError):  # Exception handler
            return jsonify({
                "error": "Bad request",
                "message": "Invalid book ID"
            }), 400

  # Find the book
        book = Books.query.filter(
            Books.owner_id == claim_id, Books.id == book_id
        ).first()

        if not book:  # Conditional statement
            return jsonify({
                "error": "Not found",
                "message": f"No book with ID {id} was found"
            }), 404

  # Get notes for the book
        notes_schema = NotesSchema(many=True)
        notes_data = notes_schema.dump(book.notes)

        return jsonify({
            "notes": notes_data,
            "count": len(notes_data),
            "book_title": book.title
        }), 200

    except Exception as e:  # Exception handler
        logger.error("Error getting notes for book: %s", e)
        return jsonify({
            "error": "Internal server error",
            "message": "An unexpected error occurred while retrieving notes"
        }), 500


@books_endpoint.route("/v1/books/<id>/notes", methods=["POST"])
@jwt_required()  # Requires valid JWT token for access
def add_book_note(id):  # Function: add_book_note
    """
    Add a note or annotation to a book.

    Expected JSON payload:
    {
        "content": "Note content",
        "quote_page": 123,  // Optional
        "visibility": "private"  // Optional: "private" or "public"
    }
    """
    try:  # Exception handling block
        claim_id = get_jwt()["id"]

  # Validate book ID
        try:  # Exception handling block
            book_id = int(id)
        except (ValueError, TypeError):  # Exception handler
            return jsonify({
                "error": "Bad request",
                "message": "Invalid book ID"
            }), 400

  # Validate request payload
        if not request.json:  # Conditional statement
            return jsonify({
                "error": "Bad request",
                "message": "Request must contain JSON data"
            }), 400

        if "content" not in request.json:  # Conditional statement
            return jsonify({
                "error": "Bad request",
                "message": "Missing required field: content"
            }), 400

        content = request.json["content"].strip()
        if not content:  # Conditional statement
            return jsonify({
                "error": "Bad request",
                "message": "Note content cannot be empty"
            }), 400

  # Verify book exists and belongs to user
        book = Books.query.filter(
            Books.owner_id == claim_id, Books.id == book_id
        ).first()
        if not book:  # Conditional statement
            return jsonify({
                "error": "Not found",
                "message": f"No book with ID {id} was found"
            }), 404

  # Handle optional quote_page
        quote_page = request.json.get("quote_page")
        if quote_page is not None:  # Conditional statement
            try:  # Exception handling block
                quote_page = int(quote_page)
                if quote_page < 1:  # Conditional statement
                    return jsonify({
                        "error": "Bad request",
                        "message": "Quote page must be a positive integer"
                    }), 400
  # Validate against book's total pages
                if (book.total_pages > 0 and  # Conditional statement
                        quote_page > book.total_pages):
                    return jsonify({
                        "error": "Bad request",
                        "message": ("Quote page cannot exceed book's "
                                   "total pages")
                    }), 400
            except (ValueError, TypeError):  # Exception handler
                return jsonify({
                    "error": "Bad request",
                    "message": "Quote page must be a valid integer"
                }), 400

  # Handle optional visibility
        visibility = request.json.get("visibility", "private")
        if visibility not in ["private", "public"]:  # Conditional statement
            return jsonify({
                "error": "Bad request",
                "message": "Visibility must be either 'private' or 'public'"
            }), 400

  # Map visibility to match database schema
        visibility_value = "hidden" if visibility == "private" else "public"

  # Create the note
        new_note = Notes(  # type: ignore
            owner_id=claim_id,
            book_id=book_id,
            note=content,
            quote_page=quote_page,
            visibility=visibility_value
        )
        new_note.save_to_db()

        return jsonify({
            'message': 'Note created successfully',
            'note_id': new_note.id,
            'book_title': book.title
        }), 201

    except Exception as e:  # Exception handler
        db.session.rollback()
        logger.error("Error adding note to book: %s", e)
        return jsonify({
            "error": "Internal server error",
            "message": "An unexpected error occurred while adding the note"
        }), 500


@books_endpoint.route("/v1/books/<id>/details", methods=["GET"])
@jwt_required()  # Requires valid JWT token for access
def get_book_details(id):  # Getter method for book_details
    """
    Get detailed information about a specific book including notes.
    """
    try:  # Exception handling block
        claim_id = get_jwt()["id"]

  # Validate book ID
        try:  # Exception handling block
            book_id = int(id)
        except (ValueError, TypeError):  # Exception handler
            return jsonify({
                "error": "Bad request",
                "message": "Invalid book ID"
            }), 400

  # Find the book
        book = Books.query.filter(
            Books.owner_id == claim_id, Books.id == book_id
        ).first()

        if not book:  # Conditional statement
            return jsonify({
                "error": "Not found",
                "message": f"No book with ID {id} was found"
            }), 404

  # Serialize book with notes
        books_schema = BooksSchema(many=False)
        book_data = books_schema.dump(book)

        return jsonify(book_data), 200

    except Exception as e:  # Exception handler
        logger.error("Error getting book details: %s", e)
        return jsonify({
            "error": "Internal server error",
            "message": ("An unexpected error occurred while retrieving "
                       "book details")
        }), 500


@books_endpoint.route("/v1/books/stats", methods=["GET"])
@jwt_required()  # Requires valid JWT token for access
def get_book_stats():  # Getter method for book_stats
    """
    Get reading statistics for the authenticated user.
    """
    try:  # Exception handling block
        claim_id = get_jwt()["id"]
        
  # Get counts for each reading status
        stats = {}
        statuses = ["To be read", "Currently reading", "Read"]
        
        for status in statuses:  # Loop iteration
            count = Books.query.filter(
                Books.owner_id == claim_id,
                Books.reading_status == status
            ).count()
            stats[status.lower().replace(" ", "_")] = count
        
  # Get total books
        total_books = Books.query.filter(Books.owner_id == claim_id).count()
        
  # Calculate reading progress
        progress_books = Books.query.filter(
            Books.owner_id == claim_id,
            Books.current_page > 0,
            Books.total_pages > 0
        ).all()
        
        total_pages_read = sum(book.current_page for book in progress_books)
        total_pages_all = sum(book.total_pages for book in progress_books)
        
  # Get average rating
        rated_books = Books.query.filter(
            Books.owner_id == claim_id,
            Books.rating.isnot(None)
        ).all()
        
        avg_rating = None
        if rated_books:  # Conditional statement
            avg_rating = float(
                sum(float(book.rating) for book in rated_books) / 
                len(rated_books)
            )
        
        return jsonify({
            "total_books": total_books,
            "to_be_read": stats["to_be_read"],
            "currently_reading": stats["currently_reading"],
            "read": stats["read"],
            "total_pages_read": total_pages_read,
            "total_pages_all": total_pages_all,
            "average_rating": (round(avg_rating, 2)
                               if avg_rating else None),  # Conditional statement
            "rated_books_count": len(rated_books)
        }), 200
        
    except Exception as e:  # Exception handler
        logger.error("Error getting book stats: %s", e)
        return jsonify({
            "error": "Internal server error",
            "message": ("An unexpected error occurred while retrieving "
                       "statistics")
        }), 500


@books_endpoint.route("/v1/books/search", methods=["GET"])
@jwt_required()  # Requires valid JWT token for access
def search_books():  # Function: search_books
    """
    Advanced search endpoint for books with multiple filters.
    
    Query parameters:
    - q: Search query (searches title, author, description)
    - status: Filter by reading status
    - rating_min: Minimum rating filter
    - rating_max: Maximum rating filter
    - limit: Number of results per page (default: 25, max: 100)
    - offset: Page number (default: 1)
    """
    try:  # Exception handling block
        claim_id = get_jwt()["id"]

  # Parse search parameters
        search_query = request.args.get('q', '').strip()
        status_filter = request.args.get('status')
        rating_min = request.args.get('rating_min')
        rating_max = request.args.get('rating_max')
        limit = request.args.get('limit', 25, type=int)
        offset = request.args.get('offset', 1, type=int)

  # Validate pagination
        if limit < 1 or limit > 100:  # Conditional statement
            return jsonify({
                "error": "Bad request",
                "message": "Limit must be between 1 and 100"
            }), 400

        if offset < 1:  # Conditional statement
            return jsonify({
                "error": "Bad request",
                "message": "Page offset must be greater than 0"
            }), 400

  # Build base query
        query = Books.query.filter(Books.owner_id == claim_id)

  # Apply search filter
        if search_query:  # Conditional statement
            search_filter = db.or_(
                Books.title.ilike(f"%{search_query}%"),
                Books.author.ilike(f"%{search_query}%"),
                Books.description.ilike(f"%{search_query}%"),
                Books.isbn.ilike(f"%{search_query}%")
            )
            query = query.filter(search_filter)

  # Apply status filter
        if status_filter:  # Conditional statement
            valid_statuses = ["To be read", "Currently reading", "Read"]
            if status_filter in valid_statuses:  # Conditional statement
                query = query.filter(Books.reading_status == status_filter)

  # Apply rating filters
        if rating_min is not None:  # Conditional statement
            try:  # Exception handling block
                rating_min = float(rating_min)
                if 0 <= rating_min <= 5:  # Conditional statement
                    query = query.filter(Books.rating >= rating_min)
            except (ValueError, TypeError):  # Exception handler
                return jsonify({
                    "error": "Bad request",
                    "message": "rating_min must be a number between 0 and 5"
                }), 400

        if rating_max is not None:  # Conditional statement
            try:  # Exception handling block
                rating_max = float(rating_max)
                if 0 <= rating_max <= 5:  # Conditional statement
                    query = query.filter(Books.rating <= rating_max)
            except (ValueError, TypeError):  # Exception handler
                return jsonify({
                    "error": "Bad request",
                    "message": "rating_max must be a number between 0 and 5"
                }), 400

  # Execute paginated query
        books = query.paginate(
            page=offset,
            per_page=limit,
            error_out=False
        )

  # Serialize response
        books_schema = BooksSchema(many=True)
        response_data = {
            "items": books_schema.dump(books.items),
            "meta": {
                "page": books.page,
                "per_page": books.per_page,
                "total_items": books.total,
                "total_pages": books.pages,
                "has_next": books.has_next,
                "has_prev": books.has_prev,
                "search_query": search_query,
                "filters_applied": {
                    "status": status_filter,
                    "rating_min": rating_min,
                    "rating_max": rating_max
                }
            }
        }

        return jsonify(response_data), 200

    except Exception as e:  # Exception handler
        logger.error("Error searching books: %s", e)
        return jsonify({
            "error": "Internal server error",
            "message": "An unexpected error occurred during search"
        }), 500