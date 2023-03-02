import { IServerColumn } from 'visyn_core';
import { IServerColumnOption } from '../data/IAttributue';
import { ISpecialAttribute } from '../data/ISpecialAttribute';

export interface ISpecialOption extends IServerColumnOption {
  optionData: {
    serverColumn: IServerColumn;
    sAttrId: string;
    attrOption: string;
    spAttribute: ISpecialAttribute;
  };
}
