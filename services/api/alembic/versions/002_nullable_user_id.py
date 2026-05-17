"""make scan_results.user_id nullable for MVP mode

Revision ID: 002_nullable_user_id
Revises: 001_initial_schema
Create Date: 2026-05-17
"""
from alembic import op
import sqlalchemy as sa

revision = "002_nullable_user_id"
down_revision = "001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "scan_results",
        "user_id",
        existing_type=sa.UUID(),
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "scan_results",
        "user_id",
        existing_type=sa.UUID(),
        nullable=False,
    )
