from tdp_core.dbview import DBViewBuilder, DBConnector, add_common_queries, inject_where
from .db_metadata import tables, columns

from logging import getLogger
import logging.config
import phovea_server.config

config = phovea_server.config.view('coral')  # Read the config
logging.config.dictConfig(config.logging)  # Configure logger based on settings in config file
_log = getLogger(__name__)  # Logger name is file name

_log.info('Setting up the db view.')

# main dictionary containing all views registered for this plugin
views = dict()
schema = 'cohort'

# create a view + idtype for each available table
for table in tables:

  id_type = table
  schema_table = schema + '.' + table
  # note: use table name as idtype!
  db_builder = DBViewBuilder().idtype(id_type).table(schema_table) \
                              .query("""SELECT * FROM """ + schema_table) \
                              .derive_columns()

  for col in columns[table]:
      db_builder.column(col[0], type=col[1])

  # assign_ids ... the tdp server should automatically manage and assign unique integer ids based on the 'id' column
  # call(inject_where) ... utility to inject a where clause that is used for dynamic filtering
  views[table] = db_builder.assign_ids() \
                           .call(inject_where) \
                           .build()

  add_common_queries(views, schema_table, id_type, 'id', columns[table])


# notes:
# by convention the 'id' column contains the identifier column of a row --> we have an id column in the db
# derive_columns ... try to automatically derive column and column types
# column(column, attrs) ... would explicitly set a column type
# assign_ids ... the tdp server should automatically manage and assign unique integer ids based on the 'id' column
# filter (get the filter with key 'month' / year and add a where clause like giessdatum_monat='1')
# .call(inject_where) ... utility to inject a where clause that is used for dynamic filtering ---> otherwise the filter callc above do not work and all the data is retrieved


def create():
  """
  factory method to build this extension
  :return:
  """
  _log.info('Creating a DBConnector for the cohort database.')
  connector = DBConnector(views)
  connector.description = 'sample connector to the cohort database'
  return connector
