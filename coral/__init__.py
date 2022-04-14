###############################################################################
# Caleydo - Visualization for Molecular Biology - http://caleydo.org
# Copyright (c) The Caleydo Team. All rights reserved.
# Licensed under the new BSD license, available at http://caleydo.org/license
###############################################################################
from os import path

PROJ_NAME = 'coral'
DB_KEY = 'cohortdb'


def phovea(registry):
  """
  register extension points
  :param registry:
  """
  # generator-phovea:begin
  registry.append('tdp-sql-database-definition', DB_KEY, f'{PROJ_NAME}.db', {
     'configKey': f'{PROJ_NAME}'
    })

  registry.append('namespace', 'db_connector', f'{PROJ_NAME}.sql', {
       'namespace': '/api/cohortdb/db'
    })
  # generator-phovea:end

  registry.append('tdp-sql-database-migration', DB_KEY, '', {
    'scriptLocation': path.join(path.abspath(path.dirname(__file__)), 'migration'),
    'configKey': f'{PROJ_NAME}.migration',
    'dbKey': DB_KEY
  })

  pass


def phovea_config():
  """
  :return: file pointer to config file
  """
  from os import path
  here = path.abspath(path.dirname(__file__))
  config_file = path.join(here, 'config.json')
  return config_file if path.exists(config_file) else None
