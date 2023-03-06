from pydantic import BaseModel
from visyn_core import manager


class CoralSettings(BaseModel):
    dburl: str = "postgresql://publicdb:publicdb@publicdb:5432/publicdb"
    connection_pool_size: int = 8
    connection_pool_overflow: int = 8
    statement_timeout: str = "300000"
    supp_statement_timeout: str = "40000"
    statement_timeout_query: str = "set statement_timeout to {}"
    logging: dict = {"version": 1, "disable_existing_loggers": False, "loggers": {"coral": {"level": "DEBUG"}}}


def get_settings() -> CoralSettings:
    return manager.settings.coral
