import logging

from sqlalchemy import Column, ForeignKey, Integer, Sequence, String
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

_log = logging.getLogger(__name__)

# c stands for class


def get_sql_table(tablename):
    for c in Base._decl_class_registry.values():
        if hasattr(c, "__tablename__") and c.__tablename__ == tablename:
            return c


def get_sql_column(sql_table, column):
    sql_column = None
    try:
        index = column.find(".")
        # the column usually contains a dot in the beginning, that's how it is recognized
        if index == 0:
            index = index + 1
            column = column[index:]

        sql_column = getattr(sql_table, column)
    except Exception as e:
        _log.error("Could not get the sql column:", e)
        raise

    return sql_column


class Cohort(Base):
    __tablename__ = "cohort"
    __table_args__ = {"schema": "cohort"}
    id = Column(Integer, Sequence("cohort_id_seq", schema="cohort"), primary_key=True)
    name = Column(String, nullable=False)
    is_initial = Column(Integer, nullable=False)
    previous_cohort = Column(Integer, nullable=False)
    entity_database = Column(String, nullable=False)
    entity_schema = Column(String, nullable=False)
    entity_table = Column(String, nullable=False)
    statement = Column(String)

    def __repr__(self):
        return (
            "<Cohort (id='%s', name='%s', is_initial='%s', previous_cohort='%s', entity_database='%s', entity_schema='%s', entity_table='%s', statement='%s')>"
            % (
                self.id,
                self.name,
                self.is_initial,
                self.previous_cohort,
                self.entity_database,
                self.entity_schema,
                self.entity_table,
                self.statement,
            )
        )


class CohortEntity(Base):
    __tablename__ = "cohort_entity"
    __table_args__ = {"schema": "cohort"}
    cohort_id = Column(Integer, ForeignKey("cohort.cohort.id"), nullable=False, primary_key=True)
    entity_id = Column(String, nullable=False, primary_key=True)

    def __repr__(self):
        return "<CohortEntity (cohort_id='%s', entity_id='%s')>" % (self.cohort_id, self.entity_id)
