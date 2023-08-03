import logging

_log = logging.getLogger(__name__)
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
  # print("debug")
  # print(manager.settings)
  # print("debugend")
  # problem when debugging: manager.settings is null


  # _log.debug("manager.settings.coral %s", manager.settings.coral)
  # create new CoralSettings object with standard values
  # settings = CoralSettings()
  # settings.dburl = dburl='postgresql://user:pw@postgres01.cg.jku.at:5002/coral' # this is the only difference to the acutal manager.settings.coral
  # _log.debug("hardcoded settings %s", settings)

  # settings hardcoded for debug:
  # settings = "dburl='postgresql://user:pw@postgres01.cg.jku.at:5002/coral' connection_pool_size=8 connection_pool_overflow=8 statement_timeout='300000' supp_statement_timeout='40000' statement_timeout_query='set statement_timeout to {}' logging={'version': 1, 'disable_existing_loggers': False, 'loggers': {'coral': {'level': 'DEBUG'}}}"
  # return settings
  return manager.settings.coral

