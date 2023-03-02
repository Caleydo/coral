import { log } from 'vega';
import { ISpecialOption } from '../Taskview/interfaces';
import { SpecialAttribute, ServerColumnAttribute, GeneScoreAttribute, PanelScoreAttribute } from './Attribute';
import { IOption, IAttribute, IServerColumnOption, IScoreOption } from './IAttributue';

export function toAttribute(option: IOption, currentDB, currentView): IAttribute {
  if (option.optionType === 'dbc') {
    if (option.optionData && (option as ISpecialOption).optionData.spAttribute) {
      // Create Special Attribtues
      // if (option.optionData.spA === 'treatment') {
      log.debug('create special Attribute: ', option.optionId);
      log.debug('special Attribute object: ', option.optionData.spAttribute);
      return new SpecialAttribute(
        option.optionId,
        currentView,
        currentDB,
        (option as ISpecialOption).optionData.spAttribute,
        (option as ISpecialOption).optionData.attrOption,
      );
    }
    // Create Attribute
    return new ServerColumnAttribute(option.optionId, currentView, currentDB, (option as IServerColumnOption).optionData.serverColumn);
  }
  // Create ScoreAttribute
  if (option.optionType === 'gene') {
    return new GeneScoreAttribute(
      option.optionId,
      option.optionText,
      currentView,
      currentDB,
      (option as IScoreOption).optionData.type,
      (option as IScoreOption).optionData.subType,
    );
  }
  if (option.optionType === 'panel') {
    return new PanelScoreAttribute(option.optionId, currentView, currentDB, 'categorical');
  }
}
