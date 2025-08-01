import logging  # Application logging
from logging.config import fileConfig  # Application logging

from flask import current_app  # Flask web framework components

from alembic import context

  # this is the Alembic Config object, which provides
  # access to the values within the .ini file in use.
config = context.config

  # Interpret the config file for Python logging.
  # This line sets up loggers basically.
if config.config_file_name is not None:  # Conditional statement
    fileConfig(config.config_file_name)
logger = logging.getLogger('alembic.env')


def get_engine():  # Getter method for engine
    try:  # Exception handling block
  # this works with Flask-SQLAlchemy<3 and Alchemical
        return current_app.extensions['migrate'].db.get_engine()
    except (TypeError, AttributeError):  # Exception handler
  # this works with Flask-SQLAlchemy>=3
        return current_app.extensions['migrate'].db.engine


def get_engine_url():  # Getter method for engine_url
    try:  # Exception handling block
        return get_engine().url.render_as_string(hide_password=False).replace(
            '%', '%%')
    except AttributeError:  # Exception handler
        return str(get_engine().url).replace('%', '%%')


  # add your model's MetaData object here
  # for 'autogenerate' support
  # from myapp import mymodel
  # target_metadata = mymodel.Base.metadata
config.set_main_option('sqlalchemy.url', get_engine_url())
target_db = current_app.extensions['migrate'].db  # Database connection

  # other values from the config, defined by the needs of env.py,
  # can be acquired:
  # my_important_option = config.get_main_option("my_important_option")
  # ... etc.


def get_metadata():  # Getter method for metadata
    if hasattr(target_db, 'metadatas'):  # Conditional statement
        return target_db.metadatas[None]
    return target_db.metadata


def run_migrations_offline():  # Function: run_migrations_offline
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url, target_metadata=get_metadata(), literal_binds=True
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():  # Function: run_migrations_online
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """

  # this callback is used to prevent an auto-migration from being generated
  # when there are no changes to the schema
  # reference: http://alembic.zzzcomputing.com/en/latest/cookbook.html
    def process_revision_directives(context, revision, directives):  # Function: process_revision_directives
        if getattr(config.cmd_opts, 'autogenerate', False):  # Conditional statement
            script = directives[0]
            if script.upgrade_ops.is_empty():  # Conditional statement
                directives[:] = []
                logger.info('No changes in schema detected.')

    conf_args = current_app.extensions['migrate'].configure_args
    if conf_args.get("process_revision_directives") is None:  # Conditional statement
        conf_args["process_revision_directives"] = process_revision_directives

    connectable = get_engine()

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=get_metadata(),
            **conf_args
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():  # Conditional statement
    run_migrations_offline()
else:  # Default case
    run_migrations_online()
