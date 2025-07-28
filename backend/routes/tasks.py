from flask import Blueprint, request, jsonify, current_app  # Flask web framework components
from flask_jwt_extended import jwt_required, get_jwt  # Flask web framework components
from models import Tasks, TasksSchema, Books, Files, UserSettings
from db import db
from decorators import required_params
import threading
import string
import random
from datetime import datetime  # Date and time handling
import os  # Operating system interface
import csv
import json
from jinja2 import Environment, FileSystemLoader, TemplateNotFound
from mastodon import Mastodon


tasks_endpoint = Blueprint('tasks', __name__)


def _create_task(task_type, task_metadata, owner_id):  # Function: _create_task
    if not isinstance(task_metadata, str):  # Conditional statement
        task_metadata = json.dumps(task_metadata)
    new_task = Tasks(
        task_type=task_type,
        task_metadata=task_metadata,
        owner_id=owner_id
    )
    db.session.add(new_task)
    db.session.commit()
    threading.Thread(
        target=_start_background_task,
        args=(current_app.app_context(), new_task.id, owner_id,)
    ).start()
    return new_task


def _start_background_task(app_context, task_id, claim):  # Function: _start_background_task
    def start(task):  # Function: start
        task.status = "started"
        task.progress = 10
        task.updated_at = datetime.utcnow()
        db.session.commit()
        current_app.logger.info(
            f"Background task {task_id} started - {task.task_type}"
        )

    def finish(task, result_message=None):  # Function: finish
        task.status = "success"
        task.progress = 100
        task.result = (
            result_message or f"Task {task.task_type} completed successfully"
        )
        task.updated_at = datetime.utcnow()
        db.session.commit()
        current_app.logger.info(
            f"Background task {task_id} finished successfully"
        )

    def fail(task, error_message):  # Function: fail
        task.status = "failed"
        task.error = str(error_message)
        task.updated_at = datetime.utcnow()
        db.session.commit()
        current_app.logger.error(
            f"Background task {task_id} failed: {error_message}"
        )

    with app_context:
        task = Tasks.query.get(task_id)
        if not task:  # Conditional statement
            current_app.logger.error(f"Task {task_id} not found")
            return

        try:  # Exception handling block
            start(task)
            
  # Update progress
            task.progress = 30
            db.session.commit()
            
            if task.task_type == "csv_export":  # Conditional statement
                create_csv(claim)
                finish(task, "CSV export completed successfully")
            elif task.task_type == "json_export":  # Alternative condition
                create_json(claim)
                finish(task, "JSON export completed successfully")
            elif task.task_type == "html_export":  # Alternative condition
                create_html(claim)
                finish(task, "HTML export completed successfully")
            elif task.task_type == "share_book_event":  # Alternative condition
                share_book(claim, task.task_metadata)
                finish(task, "Book shared successfully")
            else:  # Default case
                fail(task, f"Unknown task type: {task.task_type}")
                
        except Exception as e:  # Exception handler
            current_app.logger.error(f"Background task {task_id} failed: {e}")
            fail(task, str(e))


@tasks_endpoint.route("/v1/tasks/<id>", methods=["GET"])
@jwt_required()  # Requires valid JWT token for access
def get_task(id):  # Getter method for task
    try:  # Exception handling block
        task_id = int(id)
    except ValueError:  # Exception handler
        return jsonify({
            "error": "Bad request", 
            "message": "Task ID must be an integer"
        }), 400

    claim = get_jwt()["id"]
    task_schema = TasksSchema()
    task = Tasks.query.filter(
        Tasks.id == task_id, Tasks.owner_id == claim
    ).first()
    if task:  # Conditional statement
        return jsonify(task_schema.dump(task)), 200
    else:  # Default case
        return jsonify({"error": "Not found", "message": "No task found"}), 404


@tasks_endpoint.route("/v1/tasks", methods=["POST"])
@jwt_required()  # Requires valid JWT token for access
@required_params("type", "data")  # Decorator: required_params
def create_task():  # Function: create_task
    claim_id = get_jwt()["id"]
    try:  # Exception handling block
        data = request.json["data"]
        new_task = _create_task(
            task_type=request.json["type"],
            task_metadata=data,
            owner_id=claim_id
        )
        return jsonify({
            'message': 'Task created.', 
            "task_id": new_task.id
        }), 202
    except Exception as e:  # Exception handler
        current_app.logger.error(f"Task creation failed: {e}")
        return jsonify({
            "error": "Unknown error", 
            "message": "Unknown error occurred"
        }), 500


@tasks_endpoint.route("/v1/tasks/<id>/retry", methods=["POST"])
@jwt_required()  # Requires valid JWT token for access
def retry_task(id):  # Function: retry_task
    try:  # Exception handling block
        task_id = int(id)
    except ValueError:  # Exception handler
        return jsonify({
            "error": "Bad request", 
            "message": "Task ID must be an integer"
        }), 400

    claim_id = get_jwt()["id"]
    task = Tasks.query.filter(
        Tasks.id == task_id, Tasks.owner_id == claim_id
    ).first()
    if task:  # Conditional statement
        task.status = "fresh"
        task.updated_at = datetime.utcnow()
        db.session.commit()
        _start_background_task(current_app.app_context(), task.id, claim_id)
        return jsonify({"message": "Task set to be retried."}), 200
    else:  # Default case
        return jsonify({"error": "Not found", "message": "No task found"}), 404


def share_book(claim_id, data):  # Function: share_book
    settings = UserSettings.query.filter(
        UserSettings.owner_id == claim_id
    ).first()
    if (not settings or not settings.mastodon_access_token or  # Conditional statement
            not settings.mastodon_url):
        current_app.logger.error("Mastodon settings not configured for user")
        return

    try:  # Exception handling block
        if isinstance(data, str):  # Conditional statement
            data = json.loads(data)
        mastodon = Mastodon(
            access_token=settings.mastodon_access_token,
            api_base_url=settings.mastodon_url
        )
        if data.get("reading_status") == "Read":  # Conditional statement
            title = data.get('title', '')
            author = data.get('author', '')
            mastodon.status_post(
                f"I just finished reading {title} by {author} 📖"
            )
    except Exception as e:  # Exception handler
        current_app.logger.error(f"Failed to share book to Mastodon: {e}")


def create_html(claim_id):  # Function: create_html
    template_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../")
    )
    env = Environment(loader=FileSystemLoader(template_path))
    books = Books.query.filter(Books.owner_id == claim_id).all()

    random_string = "".join(
        random.choices(string.ascii_letters + string.digits, k=8)
    )
    filename = (f"export_{datetime.now().strftime('%y%m%d')}_"
                f"{random_string}.html")

    try:  # Exception handling block
        template = env.get_template("book_template_export.html")
        output = template.render(data=books)
    except TemplateNotFound:  # Exception handler
        current_app.logger.error("HTML template not found for export")
        return
    except Exception as e:  # Exception handler
        current_app.logger.error(f"Error rendering HTML template: {e}")
        return

    export_folder = os.getenv("EXPORT_FOLDER", "export_data")
    os.makedirs(export_folder, exist_ok=True)

    try:  # Exception handling block
        with open(os.path.join(export_folder, filename), "w", 
                  encoding="utf-8") as f:
            f.write(output)
        new_file = Files(
            filename=filename,
            owner_id=claim_id,
            file_type="html",
            file_path=os.path.join(export_folder, filename),
            file_size=os.path.getsize(os.path.join(export_folder, filename)),
            description="HTML export of book library"
        )
        db.session.add(new_file)
        db.session.commit()
    except Exception as e:  # Exception handler
        current_app.logger.error(f"Error writing HTML export file: {e}")


def create_json(claim_id):  # Function: create_json
    books = Books.query.filter(Books.owner_id == claim_id).all()
    book_list = [{
        'title': b.title,
        'isbn': b.isbn,
        'description': b.description,
        'reading_status': b.reading_status,
        'current_page': b.current_page,
        'total_pages': b.total_pages,
        'author': b.author,
        'rating': str(b.rating) if b.rating is not None else None
    } for b in books]

    random_string = "".join(
        random.choices(string.ascii_letters + string.digits, k=8)
    )
    filename = (f"export_{datetime.now().strftime('%y%m%d')}_"
                f"{random_string}.json")

    export_folder = os.getenv("EXPORT_FOLDER", "export_data")
    os.makedirs(export_folder, exist_ok=True)

    try:  # Exception handling block
        with open(os.path.join(export_folder, filename), "w", 
                  encoding="utf-8") as f:
            f.write(json.dumps(book_list, indent=2))
        new_file = Files(
            filename=filename,
            owner_id=claim_id,
            file_type="json",
            file_path=os.path.join(export_folder, filename),
            file_size=os.path.getsize(os.path.join(export_folder, filename)),
            description="JSON export of book library"
        )
        db.session.add(new_file)
        db.session.commit()
    except Exception as e:  # Exception handler
        current_app.logger.error(f"Error writing JSON export file: {e}")


def create_csv(claim_id):  # Function: create_csv
    books = Books.query.filter(Books.owner_id == claim_id).all()
    random_string = "".join(
        random.choices(string.ascii_letters + string.digits, k=8)
    )
    filename = (f"export_{datetime.now().strftime('%y%m%d')}_"
                f"{random_string}.csv")

    export_folder = os.getenv("EXPORT_FOLDER", "export_data")
    os.makedirs(export_folder, exist_ok=True)

    try:  # Exception handling block
        with open(os.path.join(export_folder, filename), "w", newline="",
                  encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([
                "title", "isbn", "description", "reading_status",
                "current_page", "total_pages", "author", "rating"
            ])
            for b in books:  # Loop iteration
                writer.writerow([
                    b.title, b.isbn, b.description, b.reading_status,
                    b.current_page, b.total_pages, b.author, b.rating
                ])
        new_file = Files(
            filename=filename,
            owner_id=claim_id,
            file_type="csv",
            file_path=os.path.join(export_folder, filename),
            file_size=os.path.getsize(os.path.join(export_folder, filename)),
            description="CSV export of book library"
        )
        db.session.add(new_file)
        db.session.commit()
    except Exception as e:  # Exception handler
        current_app.logger.error(f"Error writing CSV export file: {e}")