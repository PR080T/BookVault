from flask.cli import AppGroup  # Flask web framework components
import sys
from models import Tasks
from db import db

  # AppGroup for CLI task commands
tasks_command = AppGroup('tasks')


@tasks_command.command("clear")  # Decorator: tasks_command.command
def clear_tasks():  # Function: clear_tasks
    """Clear all pending tasks from the queue."""
    print("[CLEAR QUEUED TASKS]")

    try:
        query = Tasks.query.filter(Tasks.status == "pending")
        task_count = query.count()

        if task_count > 0:
            confirmation = input(
                f"Are you sure you want to clear {task_count} tasks? (y/N) "
            ).strip().lower()
            if confirmation == "y":
                query.delete(synchronize_session=False)
                db.session.commit()
                print("✅ Tasks cleared successfully.")
                sys.exit(0)
            else:
                print("❌ Cancelled clearing tasks.")
                sys.exit(1)
        else:
            print("ℹ️ No pending tasks found to clear.")
            sys.exit(0)

    except Exception as e:
        print(f"❌ Error occurred while clearing tasks: {e}")
        db.session.rollback()
        sys.exit(1)


@tasks_command.command("queue")
def list_tasks():
    """List all pending tasks in the queue."""
    try:  # Exception handling block
        all_tasks = Tasks.query.filter(Tasks.status == "pending").all()
        print(f"🕒 IN QUEUE: {len(all_tasks)} task(s)")
        for task in all_tasks:  # Loop iteration
            print(f"- {task.task_type} (ID: {task.id})")
    except Exception as e:  # Exception handler
        print(f"❌ Error listing tasks: {e}")
        sys.exit(1)


@tasks_command.command("run")  # Decorator: tasks_command.command
def run_tasks():  # Function: run_tasks
    """Run all pending tasks in the queue."""
    print("[RUNNING QUEUED TASKS]")
    
    try:
        pending_tasks = Tasks.query.filter(Tasks.status == "pending").all()
        
        if not pending_tasks:
            print("ℹ️ No pending tasks found to run.")
            return
        
        print(f"🚀 Found {len(pending_tasks)} pending task(s) to process")
        
        for task in pending_tasks:
            print(f"📋 Processing task: {task.task_type} (ID: {task.id})")
            
            try:
  # Update task status to running
                task.status = "running"
                task.progress = 0
                db.session.commit()
                
  # Here you would implement the actual task processing logic
  # For now, we'll just simulate completion
                task.status = "completed"
                task.progress = 100
                task.result = f"Task {task.task_type} completed successfully"
                db.session.commit()
                
                print(f"✅ Task {task.id} completed successfully")
                
            except Exception as task_error:
                print(f"❌ Task {task.id} failed: {task_error}")
                task.status = "failed"
                task.error = str(task_error)
                db.session.commit()
        
        print("🎉 Task processing completed")
        
    except Exception as e:
        print(f"❌ Error occurred while running tasks: {e}")
        db.session.rollback()
        sys.exit(1)
