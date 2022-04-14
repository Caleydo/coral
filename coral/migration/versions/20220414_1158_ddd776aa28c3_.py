"""Create cohort schema, sequence and table

Revision ID: ddd776aa28c3
Revises:
Create Date: 2022-04-14 11:58:27.444788

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = 'ddd776aa28c3'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    for cmd in ["""
        CREATE SCHEMA IF NOT EXISTS cohort;
        CREATE SEQUENCE cohort.cohort_id_seq
            INCREMENT 1
            START 1
            MINVALUE 1
            MAXVALUE 2147483647
            CACHE 1;
        """, """
        CREATE TABLE cohort.cohort
        (
            id integer NOT NULL DEFAULT nextval('cohort.cohort_id_seq'::regclass),
            name character varying COLLATE pg_catalog."default" NOT NULL,
            is_initial integer NOT NULL,
            previous_cohort integer,
            entity_database character varying COLLATE pg_catalog."default" NOT NULL,
            entity_schema character varying COLLATE pg_catalog."default" NOT NULL,
            entity_table character varying COLLATE pg_catalog."default" NOT NULL,
            statement character varying COLLATE pg_catalog."default",
            CONSTRAINT cohort_pkey PRIMARY KEY (id)
        )
        """]:
        connection.execute(cmd)



def downgrade():
    connection = op.get_bind()
    connection.execute("DROP SCHEMA cohort CASCADE;")
