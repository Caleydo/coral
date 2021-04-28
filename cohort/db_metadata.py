tables = [
  'cohort',
  # 'cohort_entity'
]

columns = {}

columns['cohort'] = [
  ['id', 'number'],
  ['name', 'text'],
  ['is_initial', 'number'],
  ['previous_cohort', 'number'],
  ['entity_database', 'text'],
  ['entity_schema', 'text'],
  ['entity_table', 'text'],
  ['statement', 'text'],
]

# columns['cohort_entity'] = [
#   ['cohort_id', 'number'],
#   ['entity_id', 'number'],
# ]
