import { cellline, tissue } from 'tdp_publicdb';
import { ICohort } from '../app/interfaces';

export interface IEntitySourceConfig {
  idType: string;
  name: string;
  dbConnectorName: string;
  dbConnector: string;
  schema: string;
  viewName: string;
  tableName: string;
  entityName: string;
  base: string;
}

// tissue
export const idTissue: IEntitySourceConfig = {
  idType: tissue.idType,
  name: tissue.name,
  dbConnectorName: 'publicdb',
  dbConnector: 'tdp_publicdb',
  schema: tissue.schema,
  viewName: tissue.tableName,
  tableName: 'tdp_tissue',
  entityName: tissue.entityName,
  base: tissue.base,
};

// cellline
export const idCellline: IEntitySourceConfig = {
  idType: cellline.idType,
  name: cellline.name,
  dbConnectorName: 'publicdb',
  dbConnector: 'tdp_publicdb',
  schema: cellline.schema,
  viewName: cellline.tableName,
  tableName: 'tdp_cellline',
  entityName: cellline.entityName,
  base: cellline.base,
};

// student
export const idStudent: IEntitySourceConfig = {
  idType: 'Student',
  name: 'Student',
  dbConnectorName: 'studentdb',
  dbConnector: 'tdp_student',
  schema: 'public',
  viewName: 'studentdb_view',
  tableName: 'student_view_anonym',
  entityName: 'id',
  base: 'student',
};

// corona / covid19
export const idCovid19: IEntitySourceConfig = {
  idType: 'covid19',
  name: 'covid19',
  dbConnectorName: 'covid19db',
  dbConnector: 'tdp_covid19',
  schema: 'public',
  viewName: 'korea_view',
  tableName: 'korea',
  entityName: 'id',
  base: 'covid19',
};

export function getIdTypeFromCohort(cht: ICohort): IEntitySourceConfig {
  const entitiyTable = cht.table;
  if (entitiyTable === 'tdp_tissue') {
    return idTissue;
  }
  if (entitiyTable === 'tdp_tissue_2') {
    return idTissue;
  }
  if (entitiyTable === 'tdp_cellline') {
    return idCellline;
  }
  if (entitiyTable === 'student_view_anonym') {
    return idStudent;
  }
  if (entitiyTable === 'korea') {
    return idCovid19;
  }

  return null;
}
