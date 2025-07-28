import click
from getpass import getpass
import sys
import re
from models import User, Verification
from flask.cli import AppGroup  # Flask web framework components

user_command = AppGroup('user')


def _validate_email(ctx, param, value):  # Function: _validate_email
    if not re.match(  # Conditional statement
        r"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)", value
    ):
        raise click.UsageError('Incorrect email address given')
    else:  # Default case
        return value


def _validate_role(ctx, param, value):  # Function: _validate_role
    valid_roles = ["user", "admin"]
    if value in valid_roles:  # Conditional statement
        return value
    else:  # Default case
        raise click.UsageError(
            f"Incorrect role given, valid roles are: {valid_roles}"
        )


@user_command.command("create")  # Decorator: user_command.command
@click.argument('email', type=str, callback=_validate_email)
@click.argument('name', type=str)
@click.argument('role', type=str, callback=_validate_role)
@click.option("--password", type=str)
def create_user(email, name, role, password):  # Function: create_user
    """Create a new user with the given email, name, and role."""
    print("Creating user...")

    if password:
        set_password = password
    else:
        password = getpass("Set a password: ")
        password_again = getpass("Confirm password: ")
        if password != password_again:
            print("Passwords do not match, try again.")
            sys.exit(1)
        set_password = password

    existing_user = User.query.filter(User.email == email).first()
    if existing_user:
        print(f"User with email {email} already exists.")
        sys.exit(1)

    new_user = User(
        email=email,
        password=User.generate_hash(set_password),
        name=name,
        role=role
    )

    try:
        new_user.save_to_db()
        new_verification = Verification(
            user_id=new_user.id,
            status="verified",
            code=None,
            code_valid_until=None
        )
        new_verification.save_to_db()

        print(
            f"Successfully created a new user:\n\tEmail: {email}\n\t"
            f"Name: {name}\n\tRole: {role}"
        )
    except Exception as e:
        print(f"Could not save new user to database. Error: {e}")
        sys.exit(1)
