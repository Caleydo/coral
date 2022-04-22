import logging
import os
import sys
from .settings import get_settings

from tdp_core import manager
from flask import jsonify
from sqlalchemy import create_engine, exc, inspect, text
from sqlalchemy.exc import NoInspectionAvailable
from sqlalchemy.orm import sessionmaker

from .sql_tables import Cohort

_log = logging.getLogger(__name__)
logging.getLogger('sqlalchemy').setLevel(logging.INFO)

file_dir = os.path.dirname(__file__)
sys.path.append(file_dir)

config = get_settings()
config_ordino = manager.settings.get_nested('tdp_publicdb', {})
config_student = manager.settings.get_nested('tdp_student', {})
config_covid19 = manager.settings.get_nested('tdp_covid19', {})

COLUMN_LABEL_SCORE = 'score'
COLUMN_LABEL_ID = 'id'
VALUE_LIST_DELIMITER = '&#x2e31;'


# create engine also creates QueuePool for connections
# pool_pre_ping tests if the connection is still working: https://docs.sqlalchemy.org/en/13/core/pooling.html#disconnect-handling-pessimistic
_log.info('statement_timeout: %s', config.statement_timeout)
_log.info('connection_pool_overflow: %s', config.connection_pool_overflow)
_log.info('connection_pool_size: %s', config.connection_pool_size)


def create_engines(dburl):
  primary_connection_config = {'options': '-c statement_timeout={}'.format(config.statement_timeout)}
  secondary_connection_config = {'options': '-c statement_timeout={}'.format(config.supp_statement_timeout)}
  return {
    'primary': create_engine(dburl, pool_pre_ping=True, connect_args=primary_connection_config, pool_timeout=int(config.statement_timeout)/1000.0, max_overflow=config.connection_pool_overflow, pool_size=config.connection_pool_size, echo=True, echo_pool=True),
    'secondary': create_engine(dburl, pool_pre_ping=True, connect_args=secondary_connection_config, pool_timeout=int(config.supp_statement_timeout)/1000.0, max_overflow=config.connection_pool_overflow, pool_size=config.connection_pool_size)
  }


engine = create_engines(config.dburl)['primary']
if config_ordino.get('dburl') is not None:
  engine_ordino = create_engines(config_ordino.get('dburl'))
if config_student.get('dburl') is not None:
  engine_student = create_engines(config_student.get('dburl'))
if config_covid19.get('dburl') is not None:
  engine_covid19 = create_engines(config_covid19.get('dburl'))


class QueryElements:
  def __init__(self):

    self.engine = engine
    self.session = self.init_session()

  def init_session(self):
    session = None
    try:
      session = sessionmaker(bind=self.engine)()

    except exc.SQLAlchemyError as e:
      _log.error('Session could not be created: %s', e)
      raise

    return session

  def to_dict(self, row):
    """
    convert the SQLAlchemy row to a dict and filter keys starting with '_' (e.g. '_sa_instance_state')
    :param row: Abgasdaten
    :return: dict
    """
    try:
      return {c.key: getattr(row, c.key) for c in inspect(row).mapper.column_attrs}
    except NoInspectionAvailable:  # this exception is raised when the result is not of a registered sqlalchemy type due to which the inspection fails
      result = dict()
      result[COLUMN_LABEL_SCORE] = row[0]
      result[COLUMN_LABEL_ID] = row[1]
      return result

  def add_cohort_to_db(self, cohort):
    result = []

    try:
      # define the sql statement
      self.session.add(cohort)
      self.session.commit()

      _log.info('Created cohort %s', cohort.id)
      result.append(cohort.id)

    except exc.DBAPIError as e:
      _log.error("DBAPIError! %s", e)
      # an exception is raised, Connection is invalidated.
      if e.connection_invalidated:
        _log.error("Connection was invalidated!")

      raise
    except exc.SQLAlchemyError as e:
      _log.error('SQLAlchemy Error:  %s', e)
      raise
    except Exception:
      _log.error('Something else is broken %s', sys.exc_info())
      raise
    finally:
      self.session.close()

    return jsonify(result)

  def get_cohorts_by_id_sql(self, args, error_msg):
    # print('in function "get_cohorts_by_id_sql"')
    str_values = ""  # for the equal values
    values = args.get('cohortIds')
    if values is None:
      raise RuntimeError(error_msg)
    values_split = values.split(VALUE_LIST_DELIMITER)

    cnt = 0
    for val in values_split:
      curr_val = "{val}".format(val=val)
      # check for if value is interger
      if curr_val.isdigit():
        str_values = str_values + ("{val}, ".format(val=curr_val))
        cnt += 1

    if cnt > 0:
      str_values = str_values[:-2]  # remove the last ', ' from the value list
    else:
      str_values = "-1"  # returns no cohorts -> ids are only positiv

    sql_text = 'SELECT id, name, is_initial, previous_cohort, entity_database, entity_schema, entity_table FROM cohort.cohort c WHERE c.id IN ({str_values})'.format(str_values=str_values)
    # print('sql_text', sql_text)
    return sql_text

  def update_cohort_name_sql(self, args, error_msg):
    # print('in function "update_cohort_name_sql"')
    result = []
    cohort_id = args.get('cohortId')
    if cohort_id is None:
      raise RuntimeError(error_msg)

    name = args.get('name')
    if name is None:
      raise RuntimeError(error_msg)

    try:
      # create session for the data
      session_data = sessionmaker(bind=engine)()

      session_data.query(Cohort).filter(Cohort.id == cohort_id).update({Cohort.name: name}, synchronize_session=False)
      # synchronize_session
      # False - don’t synchronize the session. This option is the most efficient and is reliable once the session is expired,
      # which typically occurs after a commit(), or explicitly using expire_all(). Before the expiration,
      # updated objects may still remain in the session with stale values on their attributes, which can lead to confusing results.

      # commit update
      session_data.commit()

      # get updated cohort
      sql_text = 'SELECT id, name, is_initial, previous_cohort, entity_database, entity_schema, entity_table FROM cohort.cohort c WHERE c.id = {cohortId}'.format(cohortId=cohort_id)
      result = self.execute_sql_query_as_dict(sql_text, 'cohort')

    except exc.SQLAlchemyError as e:
      _log.error('SQLAlchemy Error: %s', e)
      raise
    finally:
      self.session.close()
      session_data.close()

    return jsonify(result)

  def get_cohort_from_db(self, args, error_msg):
    result = None
    cohort_id = args.get('cohortId')
    if cohort_id is None:
      raise RuntimeError(error_msg)

    try:
      # get cohort
      cohort = self.session.query(Cohort).filter(text("id=:id_no")).\
          params(id_no=cohort_id).one()

      result = cohort
    except exc.SQLAlchemyError as e:
      _log.error('SQLAlchemy Error: ', e)
      raise
    finally:
      self.session.close()
    return result

  def execute_sql_query_as_dict(self, sql_text, db_connector, supplemental_data=False, custom_statement_timeout=None):
    """ Return query result as dict
    sql_text : string
      the sql query
    db_connector
      which db to use
    custom_statement_timeout : Integer in millis
      pass a custom timeout (if None, the statement_timeout from config is used)
    """
    result = []

    # define the right engine to use for the data
    engine_data = None
    session_data = None
    engine_type = 'primary' if not supplemental_data else 'secondary'

    if db_connector == 'tdp_publicdb':
      engine_data = engine_ordino[engine_type]
    elif db_connector == 'tdp_student':
      engine_data = engine_student[engine_type]
    elif db_connector == 'tdp_covid19':
      engine_data = engine_covid19[engine_type]
    elif db_connector == 'cohort':
      engine_data = engine
    else:
      _log.error('Unknown db connector: %s', db_connector)
      raise Exception('Unknown db connector')

    try:
      # create session for the data
      session_data = sessionmaker(bind=engine_data)()

      # create sql query from text
      statement = text(sql_text)

      # set statement timeout if given
      if custom_statement_timeout is not None:
        _log.info('set statement_timeout to {}'.format(custom_statement_timeout))
        session_data.execute(config.statement_timeout_query.format(custom_statement_timeout))

      # execute statement
      rows = session_data.execute(statement).fetchall()

      # transform row into a dictionary
      for row in rows:
        result.append(dict(row))

    except exc.SQLAlchemyError as e:
      _log.error('SQLAlchemy Error: %s', e)
      raise
    finally:
      self.session.close()
      session_data.close()

    return result

  def execute_sql_query(self, sql_text, database, supplemental_data=False, custom_statement_timeout=None):
    result = self.execute_sql_query_as_dict(sql_text, database, supplemental_data, custom_statement_timeout)
    return jsonify(result)

  def create_cohort(self, args, error_msg):
    # check all parameters
    name = args.get('name')
    if name is None:
      raise RuntimeError(error_msg)

    is_initial = args.get('isInitial')
    if is_initial is None:
      raise RuntimeError(error_msg)

    previous_cohort = args.get('previous')
    if previous_cohort is None:
      raise RuntimeError(error_msg)

    entity_database = args.get('database')
    if entity_database is None:
      raise RuntimeError(error_msg)

    entity_schema = args.get('schema')
    if entity_schema is None:
      raise RuntimeError(error_msg)

    entity_table = args.get('table')
    if entity_table is None:
      raise RuntimeError(error_msg)

    # define the sql statement
    statement = 'SELECT * FROM {schema}.{table}'.format(schema=entity_schema, table=entity_table)
    # define new cohort
    new_cohort = Cohort(name=name, previous_cohort=previous_cohort, is_initial=is_initial, entity_database=entity_database, entity_schema=entity_schema, entity_table=entity_table, statement=statement)

    return new_cohort

  def equals_filter_statement(self, prefix, attribute, values, numeric):
    values_split = values.split(VALUE_LIST_DELIMITER)
    str_values = ""  # for the equal values
    str_not_values = ""  # for the NOT equals values
    add_equals_null = False  # attribute IS NULL
    add_eqauls_not_null = False  # attribtue IS NOT NULL
    add_equals_value = False  # attribute IN (x,y,z)
    add_equals_not_value = False  # attribute NOT IN (x,y,z) --> also removes the NULL values: e.g. race NOT IN('white') OR race IS NULL
    for val in values_split:
      curr_val = ''
      if val in ['null']:  # check if the value is null
        add_equals_null = True
      elif val in ['!null']:
        add_eqauls_not_null = True
      else:
        # check if value start with '!' for NOT equals
        if val.startswith('!'):
          add_equals_not_value = True
          val = val[1:]
          if numeric in ['true']:  # determine if the values are strings or numbers
            curr_val = "{val}".format(val=val)
          else:
            curr_val = "'{val}'".format(val=val)

          str_not_values = str_not_values + ("{val}, ".format(val=curr_val))

        else:
          add_equals_value = True
          if numeric in ['true']:  # determine if the values are strings or numbers
            curr_val = "{val}".format(val=val)
          else:
            curr_val = "'{val}'".format(val=val)

          str_values = str_values + ("{val}, ".format(val=curr_val))

    str_values = str_values[:-2]  # remove the last ', ' from the value list
    str_not_values = str_not_values[:-2]  # remove the last ', ' from the value list
    str_values_query = ''

    if add_equals_value and add_equals_not_value:  # both equals and not equals values are defined
      str_values_query = '({prefix}.{attribute} IN ({str_values}) AND {prefix}.{attribute} NOT IN ({str_not_values}))'.format(prefix=prefix, attribute=attribute, str_values=str_values, str_not_values=str_not_values)
      if add_equals_null:
        str_values_query = '({prefix}.{attribute} IN ({str_values}) AND {prefix}.{attribute} NOT IN ({str_not_values})) '  \
          'OR {prefix}.{attribute} IS NULL'.format(prefix=prefix, attribute=attribute, str_values=str_values, str_not_values=str_not_values)
    else:
      # add VALUES
      if add_equals_value or add_equals_not_value:  # check if one of them has values for the attribute
        str_not_values_prefix = ''
        values = str_values
        # check if the values are not equals
        if add_equals_not_value:
          str_not_values_prefix = 'NOT '
          values = str_not_values

        str_values_query = '{prefix}.{attribute} {str_not_values_prefix}IN ({values})'.format(prefix=prefix, attribute=attribute, str_not_values_prefix=str_not_values_prefix, values=values)

      # add NULL
      if add_equals_null or add_eqauls_not_null:  # add the IS NULL clause to the statement
        str_concat = ''  # if there are no values add the '' command for the concat string of the statement
        str_not_null = ''   # string that add the NOT to IS NOT NULL, if needed
        if add_equals_null:  # if EQUALS use the OR concat
          str_concat = ' OR '
        elif add_eqauls_not_null:  # if NOT EQUALS use the AND concat
          str_concat = ' AND '
          str_not_null = 'NOT '

        if not add_equals_value and not add_equals_not_value:
          str_concat = ''  # if there is no WHERE for values than set concat string to ''

        str_null_value = '{str_concat}{prefix}.{attribute} IS {str_not_null}NULL'.format(str_concat=str_concat, prefix=prefix, attribute=attribute, str_not_null=str_not_null)
        str_values_query = str_values_query + str_null_value

    return str_values_query

  def create_cohort_equals_filtered(self, args, cohort, error_msg):
    name = args.get('name')
    if name is None:
      raise RuntimeError(error_msg)

    attribute = args.get('attribute')
    if attribute is None:
      raise RuntimeError(error_msg)

    numeric = args.get('numeric')
    if numeric is None:
      raise RuntimeError(error_msg)

    values = args.get('values')
    if values is None:
      raise RuntimeError(error_msg)

    str_values = self.equals_filter_statement('p', attribute, values, numeric)  # get formated sql query for equals filter
    # define statement
    sql_text = 'SELECT p.* FROM ({entities}) p WHERE {str_values}'.format(entities=cohort.statement, attribute=attribute, str_values=str_values)  # noqa: F522

    new_cohort = Cohort(name=name, previous_cohort=cohort.id, is_initial=0, entity_database=cohort.entity_database, entity_schema=cohort.entity_schema, entity_table=cohort.entity_table, statement=sql_text)
    return new_cohort

  def create_cohort_treatment_filtered(self, args, cohort, error_msg):
    name = args.get('name')
    if name is None:
      raise RuntimeError(error_msg)

    agent = args.get('agent')
    regimen = args.get('regimen')
    if agent is None and regimen is None:  # if both are not present
      raise RuntimeError(error_msg)

    base_agent = args.get('baseAgent')
    if base_agent is None:
      raise RuntimeError(error_msg)

    array_operation = '='
    if base_agent in ['true']:  # determine if the values are strings or numbers
      array_operation = '@>'
    else:
      array_operation = '='

    entity_id_col = ''
    if cohort.entity_table == 'tdp_tissue':
      entity_id_col = 'tissuename'
    elif cohort.entity_table == 'tdp_tissue_2':
      entity_id_col = 'tissuename'
    elif cohort.entity_table == 'tdp_cellline':
      entity_id_col = 'celllinename'
    else:
      raise RuntimeError(error_msg)

    # define statement
    agent_equals_null = False
    agent_eqauls_not_null = False
    agent_exists = False

    sql_where = "( "

    # agent is defined
    if agent is not None:
      values_split = agent.split(VALUE_LIST_DELIMITER)  # split into values
      for val in values_split:  # go through values

        if val in ['null']:
          agent_equals_null = True  # agent is null
        elif val in ['!null']:
          agent_eqauls_not_null = True  # agent is not null
        else:
          agent_exists = True   # agent exists
          agent_split = val.split(', ')  # split into agents

          agents_string = ''
          agents_sql = ''
          for ag in agent_split:  # go through all agents of one value
            agents_string = agents_string + ("'{val}', ".format(val=ag))

          agents_string = agents_string[:-2]  # remove the last ', ' from the value list
          # agents_sql = ("tmp.ag = ARRAY[{val}]::text[] ").format(val=agents_string)
          agents_sql = ("array(SELECT UNNEST(tmp.ag) AS val ORDER BY val) {array_operation} array(SELECT UNNEST(ARRAY[{val}]::text[]) AS val ORDER BY val) ").format(array_operation=array_operation, val=agents_string)
          sql_where = sql_where + ("{agents_sql} OR ").format(agents_sql=agents_sql)

      sql_where = sql_where[:-4]
      sql_where = sql_where + ')'

    # regimen is defined
    if regimen is not None:
      reg_sql = ("tmp.rn::int = {val}").format(val=regimen)
      if agent is not None:
        sql_where = sql_where + ' AND ' + reg_sql
      else:
        sql_where = reg_sql

    # SQL with the combined filter (actual agent values, null values)
    sql_refiend = ''

    # SQL to filter for actual agent values
    if agent_exists:
      sql_agent = """(SELECT tmp.{entity_id_col} FROM (
                        SELECT {entity_id_col}, treatment, array_agg(elem->>'AGENT') as ag, elem->>'REGIMEN_NUMBER' AS rn FROM {base_schema}.{base_table},
                        jsonb_array_elements(treatment:: jsonb) elem
                        GROUP BY {entity_id_col}, treatment, elem->>'REGIMEN_NUMBER') tmp
                      WHERE {sql_where}
                      GROUP BY tmp.{entity_id_col})""".format(entity_id_col=entity_id_col, base_schema=cohort.entity_schema, base_table=cohort.entity_table, sql_where=sql_where)
      sql_refiend = sql_refiend + sql_agent

    # SQL to filter for (NOT) NULL
    if agent_equals_null or agent_eqauls_not_null:
      regimen_number = 1  # default value if not regimen number was specified
      if regimen is not None:
        regimen_number = regimen  # use the speficied regimen number

      null_check = 'NOT NULL'  # deafult NOT NULL -> if both 'null' and 'not null' exist, 'null' is the stronger one
      if agent_equals_null:
        null_check = 'NULL'

      sql_null = """(SELECT base.{entity_id_col} FROM {base_schema}.{base_table} base
                    LEFT OUTER JOIN
                    (SELECT tmp.{entity_id_col} FROM (
                      SELECT {entity_id_col}, treatment, array_agg(elem->>'AGENT') as ag, elem->>'REGIMEN_NUMBER' AS rn FROM {base_schema}.{base_table},
                      jsonb_array_elements(treatment:: jsonb) elem
                      GROUP BY {entity_id_col}, treatment, elem->>'REGIMEN_NUMBER') tmp
                    WHERE tmp.rn::int = {regimen_number}
                    GROUP BY tmp.{entity_id_col}) nnt
                    ON base.{entity_id_col} = nnt.{entity_id_col}
                    WHERE nnt.{entity_id_col} IS {null_check})""".format(entity_id_col=entity_id_col, null_check=null_check, regimen_number=regimen_number, base_schema=cohort.entity_schema, base_table=cohort.entity_table)

      if agent_exists:
        sql_refiend = sql_refiend + ' UNION ' + sql_null
      else:
        sql_refiend = sql_refiend + sql_null

    # complete SQL statement that filters the data based on the given cohort
    new_sql_text = """SELECT cohort.* FROM ({entities}) cohort
                      JOIN
                      ({sql_refiend}) refined
                      ON cohort.{entity_id_col} = refined.{entity_id_col}""".format(entities=cohort.statement, sql_refiend=sql_refiend, entity_id_col=entity_id_col)

    # print('combiened_sql_statement: ', new_sql_text)
    new_cohort = Cohort(name=name, previous_cohort=cohort.id, is_initial=0, entity_database=cohort.entity_database, entity_schema=cohort.entity_schema, entity_table=cohort.entity_table, statement=new_sql_text)
    return new_cohort

  def operator_resolution(self, operator, error_msg):
    opt_res = None
    if operator.lower() in ['lt']:
      opt_res = '<'
    elif operator.lower() in ['lte']:
      opt_res = '<='
    elif operator.lower() in ['gt']:
      opt_res = '>'
    elif operator.lower() in ['gte']:
      opt_res = '>='
    else:
      raise RuntimeError(error_msg)

    return opt_res

  def num_filter_statement(self, ranges, prefix, attribute, error_msg):
    ranges_split = ranges.split(';')  # split into ranges: gt_2%lte_5 ; gte_10

    add_equals_null = False
    str_ranges = []
    for rg in ranges_split:
      curr_split = rg.split('%')  # split range into limits: gt_2 % lte_5
      add_equals_null = False
      limits = ''  # limits for one range
      for vp in curr_split:
        vp_split = vp.split('_')  # split limit into operator and value: gt _ 2

        limit = ''
        if len(vp_split) == 2:
          if vp_split[1] in ['null']:  # check if the value is null
            add_equals_null = True
          else:
            operator = self.operator_resolution(vp_split[0], error_msg)
            limit = '{prefix}.{attribute} {operator} {value} AND '.format(prefix=prefix, attribute=attribute, operator=operator, value=vp_split[1])
            limits = limits + limit
        else:
          raise RuntimeError(error_msg)

      if add_equals_null:  # check if a null value was used in the current range, and set SQL statement accordingly
        limits = '{prefix}.{attribute} IS NULL'.format(prefix=prefix, attribute=attribute)
        str_ranges.append(limits)
      else:
        limits = limits[:-5]  # sql satement for one range, remove the last ' AND '
        str_ranges.append(limits)

    sql_ranges = ''
    for strg in str_ranges:
      sql_ranges = sql_ranges + "( {range} ) OR ".format(range=strg)

    sql_ranges = sql_ranges[:-4]  # sql satement for all range, remove the last ' OR '
    return sql_ranges

  def create_cohort_num_filtered(self, args, cohort, error_msg):
    name = args.get('name')
    if name is None:
      raise RuntimeError(error_msg)

    attribute = args.get('attribute')
    if attribute is None:
      raise RuntimeError(error_msg)

    ranges = args.get('ranges')
    if ranges is None:
      raise RuntimeError(error_msg)

    sql_ranges = self.num_filter_statement(ranges, 'p', attribute, error_msg)
    sql_text = 'SELECT p.* FROM ({entities}) p WHERE {ranges}'.format(entities=cohort.statement, ranges=sql_ranges)

    new_cohort = Cohort(name=name, previous_cohort=cohort.id, is_initial=0, entity_database=cohort.entity_database, entity_schema=cohort.entity_schema, entity_table=cohort.entity_table, statement=sql_text)
    return new_cohort

  def create_cohort_gene_num_filtered(self, args, cohort, error_msg):
    name = args.get('name')
    if name is None:
      raise RuntimeError(error_msg)

    attribute = args.get('attribute')
    if attribute is None:
      raise RuntimeError(error_msg)

    ranges = args.get('ranges')
    if ranges is None:
      raise RuntimeError(error_msg)

    table = args.get('table')
    if table is None:
      raise RuntimeError(error_msg)

    ensg_raw = args.get('ensg')
    ensg = "'{name}'".format(name=ensg_raw)
    if ensg_raw is None:
      raise RuntimeError(error_msg)

    entity_id_col = ''
    if cohort.entity_table == 'tdp_tissue':
      entity_id_col = 'tissuename'
    elif cohort.entity_table == 'tdp_tissue_2':
      entity_id_col = 'tissuename'
    elif cohort.entity_table == 'tdp_cellline':
      entity_id_col = 'celllinename'
    else:
      raise RuntimeError(error_msg)

    sql_ranges = self.num_filter_statement(ranges, 'cohort_score', 'score', error_msg)

    sql_text = 'SELECT cohort.* FROM ({entities}) cohort LEFT OUTER JOIN ' \
               '(SELECT attr.{entity_id_col}, attr.{attribute} AS score FROM {schema}.tdp_{table} attr ' \
               'INNER JOIN public.tdp_gene gene ON attr.ensg = gene.ensg ' \
               'WHERE gene.species = {species} AND attr.ensg = {ensg}) cohort_score ON cohort.{entity_id_col} = cohort_score.{entity_id_col} '\
               'WHERE {ranges}'\
        .format(attribute=attribute, table=table, entity_id_col=entity_id_col, schema=cohort.entity_schema, entities=cohort.statement, species="'human'", ensg=ensg, ranges=sql_ranges)

    new_cohort = Cohort(name=name, previous_cohort=cohort.id, is_initial=0, entity_database=cohort.entity_database, entity_schema=cohort.entity_schema, entity_table=cohort.entity_table, statement=sql_text)
    return new_cohort

  def create_cohort_gene_equals_filtered(self, args, cohort, error_msg):
    name = args.get('name')
    if name is None:
      raise RuntimeError(error_msg)

    attribute = args.get('attribute')
    if attribute is None:
      raise RuntimeError(error_msg)

    table = args.get('table')
    if table is None:
      raise RuntimeError(error_msg)

    ensg_raw = args.get('ensg')
    ensg = "'{name}'".format(name=ensg_raw)
    if ensg_raw is None:
      raise RuntimeError(error_msg)

    numeric = args.get('numeric')
    if numeric is None:
      raise RuntimeError(error_msg)

    values = args.get('values')
    if values is None:
      raise RuntimeError(error_msg)

    entity_id_col = ''
    if cohort.entity_table == 'tdp_tissue':
      entity_id_col = 'tissuename'
    elif cohort.entity_table == 'tdp_tissue_2':
      entity_id_col = 'tissuename'
    elif cohort.entity_table == 'tdp_cellline':
      entity_id_col = 'celllinename'
    else:
      raise RuntimeError(error_msg)

    str_values = self.equals_filter_statement('cohort_score', 'score', values, numeric)  # get formated sql query for equals filter

    sql_text = 'SELECT cohort.* FROM ({entities}) cohort LEFT OUTER JOIN ' \
               '(SELECT attr.{entity_id_col}, attr.{attribute} AS score FROM {schema}.tdp_{table} attr ' \
               'INNER JOIN public.tdp_gene gene ON attr.ensg = gene.ensg ' \
               'WHERE gene.species = {species} AND attr.ensg = {ensg}) cohort_score ON cohort.{entity_id_col} = cohort_score.{entity_id_col} '\
               'WHERE {str_values}'\
        .format(attribute=attribute, table=table, entity_id_col=entity_id_col, schema=cohort.entity_schema, entities=cohort.statement, species="'human'", ensg=ensg, str_values=str_values)

    new_cohort = Cohort(name=name, previous_cohort=cohort.id, is_initial=0, entity_database=cohort.entity_database, entity_schema=cohort.entity_schema, entity_table=cohort.entity_table, statement=sql_text)
    return new_cohort

  def get_cohort_data_sql(self, args, cohort):
    attribute = args.get('attribute')

    entity_id_col = ''
    if cohort.entity_table == 'tdp_tissue':
      entity_id_col = 'tissuename'
    elif cohort.entity_table == 'tdp_tissue_2':
      entity_id_col = 'tissuename'
    elif cohort.entity_table == 'tdp_cellline':
      entity_id_col = 'celllinename'
    elif cohort.entity_table == 'student_view_anonym':
      entity_id_col = 'id'
    elif cohort.entity_table == 'korea':
      entity_id_col = 'id'

    # define statement
    sql_text = cohort.statement  # all attributes
    if attribute is not None:
      # only one attribute
      sql_text = 'SELECT p.{entity_id_col}, p.{attribute} FROM ({entities}) p'.format(entity_id_col=entity_id_col, attribute=attribute, entities=cohort.statement)

    return sql_text

  def get_cohort_size_sql(self, cohort):
    sql_text = 'SELECT COUNT(p.*) as size FROM ({entities}) p'.format(entities=cohort.statement)
    return sql_text

  def get_gene_score_sql(self, args, cohort, error_msg):
    table = args.get('table')
    if table is None:
      raise RuntimeError(error_msg)

    attribute = args.get('attribute')
    if attribute is None:
      raise RuntimeError(error_msg)

    ensg_raw = args.get('ensg')
    ensg = "'{name}'".format(name=ensg_raw)
    if ensg_raw is None:
      raise RuntimeError(error_msg)

    entity_id_col = ''
    if cohort.entity_table == 'tdp_tissue':
      entity_id_col = 'tissuename'
    elif cohort.entity_table == 'tdp_tissue_2':
      entity_id_col = 'tissuename'
    elif cohort.entity_table == 'tdp_cellline':
      entity_id_col = 'celllinename'
    else:
      raise RuntimeError(error_msg)

    sql_text = 'SELECT cohort.{entity_id_col}, cohort_score.score AS score FROM ({entities}) cohort LEFT OUTER JOIN ' \
               '(SELECT attr.{entity_id_col}, attr.{attribute} AS score FROM {schema}.tdp_{table} attr ' \
               'INNER JOIN public.tdp_gene gene ON attr.ensg = gene.ensg ' \
               'WHERE gene.species = {species} AND attr.ensg = {ensg}) cohort_score ON cohort.{entity_id_col} = cohort_score.{entity_id_col}'\
        .format(attribute=attribute, table=table, entity_id_col=entity_id_col, schema=cohort.entity_schema, entities=cohort.statement, species="'human'", ensg=ensg)
    return sql_text

  def get_gene_score_depletion_sql(self, args, cohort, error_msg):
    table = args.get('table')
    if table is None:
      raise RuntimeError(error_msg)

    attribute = args.get('attribute')
    if attribute is None:
      raise RuntimeError(error_msg)

    ensg_raw = args.get('ensg')
    ensg = "'{name}'".format(name=ensg_raw)
    if ensg_raw is None:
      raise RuntimeError(error_msg)

    depletion_raw = args.get('depletionscreen')
    depletionscreen = "'{name}'".format(name=depletion_raw)
    if depletion_raw is None:
      raise RuntimeError(error_msg)

    sql_text = 'SELECT cohort.celllinename, cohort_score.score AS score FROM ({entities}) cohort LEFT OUTER JOIN ' \
               '(SELECT attr.celllinename, attr.{attribute} AS score FROM cellline.tdp_{table} attr ' \
               'INNER JOIN public.tdp_gene gene ON attr.ensg = gene.ensg ' \
               'WHERE gene.species = {species} AND attr.ensg = {ensg} AND attr.depletionscreen = {screen}) cohort_score ON cohort.celllinename = cohort_score.celllinename'\
        .format(attribute=attribute, table=table, entities=cohort.statement, species="'human'", ensg=ensg, screen=depletionscreen)
    return sql_text

  def create_cohort_depletion_score_filtered(self, args, cohort, error_msg):
    name = args.get('name')
    if name is None:
      raise RuntimeError(error_msg)

    attribute = args.get('attribute')
    if attribute is None:
      raise RuntimeError(error_msg)

    ranges = args.get('ranges')
    if ranges is None:
      raise RuntimeError(error_msg)

    table = args.get('table')
    if table is None:
      raise RuntimeError(error_msg)

    ensg_raw = args.get('ensg')
    ensg = "'{name}'".format(name=ensg_raw)
    if ensg_raw is None:
      raise RuntimeError(error_msg)

    depletion_raw = args.get('depletionscreen')
    depletionscreen = "'{name}'".format(name=depletion_raw)
    if depletion_raw is None:
      raise RuntimeError(error_msg)

    sql_ranges = self.num_filter_statement(ranges, 'x', 'score', error_msg)

    sql_text = 'SELECT p.* FROM (SELECT * FROM {schema}.{base_table}) p ' \
               'INNER JOIN ' \
               '(SELECT cohort.celllinename, cohort_score.score AS score FROM ({entities}) cohort LEFT OUTER JOIN ' \
               '(SELECT attr.celllinename, attr.{attribute} AS score FROM cellline.tdp_{table} attr ' \
               'INNER JOIN public.tdp_gene gene ON attr.ensg = gene.ensg ' \
               'WHERE gene.species = {species} AND attr.ensg = {ensg} AND attr.depletionscreen = {screen}) cohort_score ON cohort.celllinename = cohort_score.celllinename) x ' \
               'ON p.celllinename = x.celllinename WHERE {ranges}'\
        .format(attribute=attribute, table=table, entities=cohort.statement, schema=cohort.entity_schema, base_table=cohort.entity_table, species="'human'", ensg=ensg, screen=depletionscreen, ranges=sql_ranges)

    new_cohort = Cohort(name=name, previous_cohort=cohort.id, is_initial=0, entity_database=cohort.entity_database, entity_schema=cohort.entity_schema, entity_table=cohort.entity_table, statement=sql_text)
    return new_cohort

  def get_panel_annotation_sql(self, args, cohort, error_msg):
    panel_raw = args.get('panel')
    panel = "'{name}'".format(name=panel_raw)
    if panel_raw is None:
      raise RuntimeError(error_msg)

    entity_id_col = ''
    panel_table = ''
    if cohort.entity_table == 'tdp_tissue':
      entity_id_col = 'tissuename'
      panel_table = 'tdp_panelassignment'
    elif cohort.entity_table == 'tdp_tissue_2':
      entity_id_col = 'tissuename'
      panel_table = 'tdp_panelassignment'
    elif cohort.entity_table == 'tdp_cellline':
      entity_id_col = 'celllinename'
      panel_table = 'tdp_panelassignment'
    elif cohort.entity_table == 'tdp_gene':
      entity_id_col = 'ensg'
      panel_table = 'tdp_geneassignment'
    else:
      raise RuntimeError(error_msg)

    sql_text = 'SELECT a.{entity_id_col}, COALESCE(d.score, FALSE) AS score ' \
               'FROM ({entities}) a ' \
               'LEFT OUTER JOIN ' \
               '(SELECT a.{entity_id_col}, TRUE as score FROM {schema}.{panel_table} a WHERE panel = {panel}) d ' \
               'ON a.{entity_id_col} = d.{entity_id_col}' \
        .format(entity_id_col=entity_id_col, entities=cohort.statement, schema=cohort.entity_schema, panel_table=panel_table, panel=panel)
    return sql_text

  def create_cohort_panel_annotation_filtered(self, args, cohort, error_msg):
    name = args.get('name')
    if name is None:
      raise RuntimeError(error_msg)

    panel_raw = args.get('panel')
    panel = "'{name}'".format(name=panel_raw)
    if panel_raw is None:
      raise RuntimeError(error_msg)

    values = args.get('values')
    if values is None:
      raise RuntimeError(error_msg)

    entity_id_col = ''
    panel_table = ''
    if cohort.entity_table == 'tdp_tissue':
      entity_id_col = 'tissuename'
      panel_table = 'tdp_panelassignment'
    elif cohort.entity_table == 'tdp_tissue_2':
      entity_id_col = 'tissuename'
      panel_table = 'tdp_panelassignment'
    elif cohort.entity_table == 'tdp_cellline':
      entity_id_col = 'celllinename'
      panel_table = 'tdp_panelassignment'
    elif cohort.entity_table == 'tdp_gene':
      entity_id_col = 'ensg'
      panel_table = 'tdp_geneassignment'
    else:
      raise RuntimeError(error_msg)

    str_values = self.equals_filter_statement('x', 'score', values, 'true')  # get formated sql query for equals filter

    # define statement
    sql_text = 'SELECT p.* FROM (SELECT * FROM {schema}.{base_table}) p ' \
               'INNER JOIN ' \
               '(SELECT a.{entity_id_col}, COALESCE(d.score, FALSE) AS score ' \
               'FROM ({entities}) a ' \
               'LEFT OUTER JOIN ' \
               '(SELECT a.{entity_id_col}, TRUE as score FROM {schema}.{panel_table} a WHERE panel = {panel}) d ' \
               'ON a.{entity_id_col} = d.{entity_id_col}) x ' \
               'ON p.{entity_id_col} = x.{entity_id_col} WHERE {str_values}' \
        .format(entity_id_col=entity_id_col, entities=cohort.statement, schema=cohort.entity_schema, base_table=cohort.entity_table, panel_table=panel_table, panel=panel, str_values=str_values)

    new_cohort = Cohort(name=name, previous_cohort=cohort.id, is_initial=0, entity_database=cohort.entity_database, entity_schema=cohort.entity_schema, entity_table=cohort.entity_table, statement=sql_text)
    return new_cohort

  def get_hist_cat_sql(self, args, cohort, error_msg):
    attribute = args.get('attribute')
    if attribute is None:
      raise RuntimeError(error_msg)

    # define statement
    sql_text = 'WITH categories AS (' \
               'SELECT DISTINCT COALESCE(p.{attribute}::varchar,{null_value}) AS cat ' \
               'FROM (SELECT * FROM {schema}.{table}) p' \
               ')' \
               'SELECT categories.cat AS bin, COALESCE(c.count,0) AS count FROM categories ' \
               'LEFT OUTER JOIN ' \
               '(SELECT COALESCE(p.{attribute}::varchar,{null_value}) AS attr, COUNT(*) AS count ' \
               'FROM ({entities}) p ' \
               'GROUP BY p.{attribute}) c ' \
               'ON categories.cat = c.attr'.format(attribute=attribute, null_value="'null'", schema=cohort.entity_schema, table=cohort.entity_table, entities=cohort.statement)

    return sql_text

  def format_number(self, n):
    # function to check if n has decimal place of zero if not convert to integer
    # removes the X.0 decimal place
    if n % 1 == 0:
      return int(n)
    else:
      return n

  def format_num_hist(self, hist_dict, num_bins):
    # print('----- current Hist from DB:  ', hist_dict)
    max_list = []
    min_list = []
    # last_bin is the num_bins+1 because the underling sql statement
    # does not include the max value in the num_bins-th bin, but
    # creates an additional one that includes the max values.
    last_bin = None
    null_bin = None
    # get min and max value
    for b in hist_dict:
      if b.get('max') is not None:
        max_list.append(b.get('max'))
      if b.get('min') is not None:
        min_list.append(b.get('min'))
      if b.get('bin') == (num_bins+1):
        last_bin = b
      if b.get('bin') is None:
        null_bin = b
      del b['min']  # remove min property from dict
      del b['max']  # remove max property from dict

    max_val = None
    min_val = None

    if len(max_list) > 0:
      max_val = max(max_list)
    if len(min_list) > 0:
      min_val = min(min_list)

    # p_str = 'min: {min_val} | max: {max_val} | last_bin: {last_bin} | null_bin: {null_bin}'.format(max_val=max_val, min_val=min_val, last_bin=last_bin, null_bin=null_bin)
    # print('----- ' + p_str)

    # define the bin width
    bin_width = 0
    if max_val is not None and min_val is not None:
      bin_width = (max_val - min_val) / num_bins

    # bins existing in the response
    bin_exist = [sub['bin'] for sub in hist_dict]
    # print('----- bins in the respose:  ', bin_exist)

    bin_numbers = range(1, num_bins+1)
    # print('----- myBins in the respose:  ', bin_numbers)

    # format all existing bins
    for b in hist_dict:
      if b.get('bin') is not None:
        b_idx = b.get('bin')
        lb = self.format_number(min_val + (b_idx - 1) * bin_width)
        ub = self.format_number(min_val + b_idx * bin_width)
        if b_idx == num_bins:
          b['bin'] = '[{lb}, {ub}]'.format(lb=lb, ub=ub)
        else:
          b['bin'] = '[{lb}, {ub})'.format(lb=lb, ub=ub)
        b['index'] = b_idx
      else:
        b['bin'] = None
        b['index'] = None

    if max_val is not None and min_val is not None:
      # create new bins that do not exist
      for bin_n in bin_numbers:
        if bin_n not in bin_exist:
          new_bin = {}
          lb = self.format_number(min_val + (bin_n - 1) * bin_width)
          ub = self.format_number(min_val + bin_n * bin_width)
          new_bin['index'] = bin_n
          new_bin['bin'] = '[{lb}, {ub})'.format(lb=lb, ub=ub)
          new_bin['count'] = 0
          hist_dict.append(new_bin)

      # merge the last bin and the bin with the highest number
      if last_bin is not None:
        for b in hist_dict:
          if b.get('index') == num_bins:
            lb = self.format_number(min_val + (num_bins - 1) * bin_width)
            ub = self.format_number(max_val)
            b['bin'] = '[{lb}, {ub}]'.format(lb=lb, ub=ub)
            b['count'] = b.get('count') + last_bin.get('count')
        hist_dict.remove(last_bin)  # remove the last bin

      # add null bin if it does not exist
      if null_bin is None:
        new_bin = {}
        new_bin['bin'] = None
        new_bin['index'] = None
        new_bin['count'] = 0
        hist_dict.append(new_bin)

    # print('----- formated Hist from DB:  ')
    # print(*hist_dict, sep='\n')

    return jsonify(hist_dict)

  def get_hist_num_sql(self, args, cohort, num_bins, error_msg):
    attribute = args.get('attribute')
    if attribute is None:
      raise RuntimeError(error_msg)

    # define statement
    sql_text = 'WITH c_stats AS (' \
               'SELECT MIN(c.{attribute}) as min, '\
               'MAX(c.{attribute}) as max '\
               'FROM {schema}.{table} c '\
               ')'\
               'SELECT width_bucket(p.{attribute}, c_stats.min, c_stats.max, {num_bins}) AS bin, '\
               'MIN(c_stats.min), MAX(c_stats.max), '\
               'COUNT(*) '\
               'FROM ({entities}) p, c_stats '\
               'GROUP BY bin '\
               'ORDER BY bin'.format(attribute=attribute, schema=cohort.entity_schema, table=cohort.entity_table, entities=cohort.statement, num_bins=num_bins)

    return sql_text

  def get_hist_gene_cat_sql(self, args, cohort, error_msg):
    table = args.get('table')
    if table is None:
      raise RuntimeError(error_msg)

    attribute = args.get('attribute')
    if attribute is None:
      raise RuntimeError(error_msg)

    ensg_raw = args.get('ensg')
    ensg = "'{name}'".format(name=ensg_raw)
    if ensg_raw is None:
      raise RuntimeError(error_msg)

    entity_id_col = ''
    if cohort.entity_table == 'tdp_tissue':
      entity_id_col = 'tissuename'
    elif cohort.entity_table == 'tdp_tissue_2':
      entity_id_col = 'tissuename'
    elif cohort.entity_table == 'tdp_cellline':
      entity_id_col = 'celllinename'
    else:
      raise RuntimeError(error_msg)

    # define statement
    sql_text = 'WITH categories AS (' \
               'SELECT DISTINCT  COALESCE(cohort_score.score::varchar,{null_value}) AS cat FROM ' \
               '(SELECT * FROM {schema}.{base_table}) cohort LEFT OUTER JOIN ' \
               '(SELECT attr.{entity_id_col}, attr.{attribute} AS score FROM {schema}.tdp_{table} attr ' \
               'INNER JOIN public.tdp_gene gene ON attr.ensg = gene.ensg ' \
               'WHERE gene.species = {species} AND attr.ensg = {ensg}) cohort_score ' \
               'ON cohort.{entity_id_col} = cohort_score.{entity_id_col}' \
               ') ' \
               'SELECT categories.cat AS bin, COALESCE(c.count,0) AS count FROM categories ' \
               'LEFT OUTER JOIN ' \
               '(SELECT p.score AS attr, COUNT(*) AS count FROM (SELECT cohort.{entity_id_col}, COALESCE(cohort_score.score::varchar,{null_value}) AS score FROM ({entities}) cohort LEFT OUTER JOIN ' \
               '(SELECT attr.{entity_id_col}, COALESCE(attr.{attribute}::varchar,{null_value}) AS score FROM {schema}.tdp_{table} attr ' \
               'INNER JOIN public.tdp_gene gene ON attr.ensg = gene.ensg ' \
               'WHERE gene.species = {species} AND attr.ensg = {ensg}) cohort_score ON cohort.{entity_id_col} = cohort_score.{entity_id_col}) p '\
               'GROUP BY p.score) c ' \
               'ON categories.cat = c.attr'.format(attribute=attribute, table=table, null_value="'null'", entity_id_col=entity_id_col, schema=cohort.entity_schema, base_table=cohort.entity_table, entities=cohort.statement, species="'human'", ensg=ensg)

    return sql_text

  def get_hist_gene_num_sql(self, args, cohort, num_bins, error_msg):
    table = args.get('table')
    if table is None:
      raise RuntimeError(error_msg)

    attribute = args.get('attribute')
    if attribute is None:
      raise RuntimeError(error_msg)

    ensg_raw = args.get('ensg')
    ensg = "'{name}'".format(name=ensg_raw)
    if ensg_raw is None:
      raise RuntimeError(error_msg)

    entity_id_col = ''
    if cohort.entity_table == 'tdp_tissue':
      entity_id_col = 'tissuename'
    elif cohort.entity_table == 'tdp_tissue_2':
      entity_id_col = 'tissuename'
    elif cohort.entity_table == 'tdp_cellline':
      entity_id_col = 'celllinename'
    else:
      raise RuntimeError(error_msg)

    # define statement
    sql_text = 'WITH c_stats AS (' \
               'SELECT MIN(c.score) as min, '\
               'MAX(c.score) as max '\
               'FROM (SELECT attr.{entity_id_col}, attr.{attribute} AS score FROM {schema}.tdp_{table} attr ' \
               'INNER JOIN public.tdp_gene gene ON attr.ensg = gene.ensg ' \
               'WHERE gene.species = {species} AND attr.ensg = {ensg}) c '\
               ')'\
               'SELECT width_bucket(p.score, c_stats.min, c_stats.max, {num_bins}) AS bin, '\
               'MIN(c_stats.min), MAX(c_stats.max), '\
               'COUNT(*) '\
               'FROM (SELECT cohort.{entity_id_col}, cohort_score.score AS score FROM ' \
               '({entities}) cohort ' \
               'LEFT OUTER JOIN ' \
               '(SELECT attr.{entity_id_col}, attr.{attribute} AS score FROM {schema}.tdp_{table} attr ' \
               'INNER JOIN public.tdp_gene gene ON attr.ensg = gene.ensg ' \
               'WHERE gene.species = {species} AND attr.ensg = {ensg}) cohort_score ON cohort.{entity_id_col} = cohort_score.{entity_id_col}) p, c_stats '\
               'GROUP BY bin '\
               'ORDER BY bin'.format(attribute=attribute, schema=cohort.entity_schema, table=table, entity_id_col=entity_id_col, entities=cohort.statement, species="'human'", ensg=ensg, num_bins=num_bins)

    return sql_text

  def get_hist_depletion_sql(self, args, cohort, num_bins, error_msg):
    table = args.get('table')
    if table is None:
      raise RuntimeError(error_msg)

    attribute = args.get('attribute')
    if attribute is None:
      raise RuntimeError(error_msg)

    ensg_raw = args.get('ensg')
    ensg = "'{name}'".format(name=ensg_raw)
    if ensg_raw is None:
      raise RuntimeError(error_msg)

    depletion_raw = args.get('depletionscreen')
    depletionscreen = "'{name}'".format(name=depletion_raw)
    if depletion_raw is None:
      raise RuntimeError(error_msg)

    # define statement
    sql_text = 'WITH c_stats AS (' \
               'SELECT MIN(c.score) as min, '\
               'MAX(c.score) as max '\
               'FROM (SELECT attr.celllinename, attr.{attribute} AS score FROM cellline.tdp_{table} attr ' \
               'INNER JOIN public.tdp_gene gene ON attr.ensg = gene.ensg ' \
               'WHERE gene.species = {species} AND attr.ensg = {ensg} AND attr.depletionscreen = {screen}) c '\
               ')'\
               'SELECT width_bucket(p.score, c_stats.min, c_stats.max, {num_bins}) AS bin, '\
               'MIN(c_stats.min), MAX(c_stats.max), '\
               'COUNT(*) '\
               'FROM (SELECT cohort.celllinename, cohort_score.score AS score FROM ({entities}) cohort LEFT OUTER JOIN ' \
               '(SELECT attr.celllinename, attr.{attribute} AS score FROM cellline.tdp_{table} attr ' \
               'INNER JOIN public.tdp_gene gene ON attr.ensg = gene.ensg ' \
               'WHERE gene.species = {species} AND attr.ensg = {ensg} AND attr.depletionscreen = {screen}) cohort_score ON cohort.celllinename = cohort_score.celllinename) p, c_stats '\
               'GROUP BY bin '\
               'ORDER BY bin'.format(attribute=attribute, table=table, entities=cohort.statement, species="'human'", ensg=ensg, screen=depletionscreen, num_bins=num_bins)

    return sql_text

  def get_hist_panel_sql(self, args, cohort, error_msg):
    panel_raw = args.get('panel')
    panel = "'{name}'".format(name=panel_raw)
    if panel_raw is None:
      raise RuntimeError(error_msg)

    entity_id_col = ''
    panel_table = ''
    if cohort.entity_table == 'tdp_tissue':
      entity_id_col = 'tissuename'
      panel_table = 'tdp_panelassignment'
    elif cohort.entity_table == 'tdp_tissue_2':
      entity_id_col = 'tissuename'
      panel_table = 'tdp_panelassignment'
    elif cohort.entity_table == 'tdp_cellline':
      entity_id_col = 'celllinename'
      panel_table = 'tdp_panelassignment'
    elif cohort.entity_table == 'tdp_gene':
      entity_id_col = 'ensg'
      panel_table = 'tdp_geneassignment'
    else:
      raise RuntimeError(error_msg)

    # define statement
    sql_text = 'WITH categories AS (' \
               'SELECT DISTINCT p.score AS cat ' \
               'FROM (SELECT a.{entity_id_col}, COALESCE(d.score, FALSE) AS score ' \
               'FROM (SELECT * FROM {schema}.{base_table}) a ' \
               'LEFT OUTER JOIN ' \
               '(SELECT a.{entity_id_col}, TRUE as score FROM {schema}.{panel_table} a WHERE panel = {panel}) d ' \
               'ON a.{entity_id_col} = d.{entity_id_col}) p' \
               ')' \
               'SELECT categories.cat AS bin, COALESCE(c.count,0) AS count FROM categories ' \
               'LEFT OUTER JOIN ' \
               '(SELECT p.score AS attr, COUNT(*) AS count ' \
               'FROM (SELECT a.{entity_id_col}, COALESCE(d.score, FALSE) AS score ' \
               'FROM ({entities}) a ' \
               'LEFT OUTER JOIN ' \
               '(SELECT a.{entity_id_col}, TRUE as score FROM {schema}.{panel_table} a WHERE panel = {panel}) d ' \
               'ON a.{entity_id_col} = d.{entity_id_col}) p ' \
               'GROUP BY p.score) c ' \
               'ON categories.cat = c.attr'.format(entity_id_col=entity_id_col, panel_table=panel_table, panel=panel, schema=cohort.entity_schema, base_table=cohort.entity_table, table=cohort.entity_table, entities=cohort.statement)  # noqa: F522

    return sql_text
