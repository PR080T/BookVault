"""
CLI commands for BookVault API

Available commands:
- flask user create <email> <name> <role> - Create a new user
- flask tasks run - Run all pending tasks
- flask tasks queue - List all pending tasks
- flask tasks clear - Clear all pending tasks
- flask db-check - Check database connection
"""

from .user import user_command
from .tasks import tasks_command
from .db_check import db_check_command


def register_cli_commands(app):
    """
    Register all CLI commands with the Flask app.
    """
    app.cli.add_command(user_command)
    app.cli.add_command(tasks_command)
    app.cli.add_command(db_check_command)
