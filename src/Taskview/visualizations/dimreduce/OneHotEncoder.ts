import * as logger from 'loglevel';
logger.setDefaultLevel(logger.levels.INFO);



// 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥
export class OneHotEncoder {

  /**
   *
   * @param data the data to encode
   * @param dataKeys optional subset of the attributes present in the data to not encode labels
   */
  encode(data: Array<any>, attributes: Array<IAttribute>) {

    const hotData = [];

    if (data?.length ?? 0 > 0) {
      // gather categories of the categorical attributes
      for (const attr of attributes) {
        for (const item of data) {
          if (attr.type === 'categorical') {
            this.getNumberForAttributeCategory(attr.dataKey, item[attr.dataKey]);
          }
        }
      }

      // loop over ...
      for (const item of data) { // ...all items and ...
        let hotItem = [];

        for (const attr of attributes) { // ... all attributes
          if (attr.type === 'categorical') {
            //there is work to do...
            hotItem = hotItem.concat(this.oneHotArray(this.getNumberOfAttributeCategories(attr.dataKey), this.getNumberForAttributeCategory(attr.dataKey, item[attr.dataKey])));
          } else if (attr.type === 'number') {
            hotItem.push(item[attr.dataKey]); //just copy the numeric value
          } else {
            logger.warn(`skipping ${attr.type} value of ${attr.dataKey}`);
          }
        }

        hotData.push(hotItem);
      }
    }

    return hotData;
  }

  categoryIndices: {
    [attribute: string]: {
      [category: string]: number
    }
  } = {};

  /**
   *
   * @param attribute numbers start at 0 for every attribute
   * @param category first encountered category will have index 0, second category 1 and so on.
   */
  getNumberForAttributeCategory(attribute: string, category: string): number {
    if (!this.categoryIndices[attribute]) {
      this.categoryIndices[attribute] = {[category]: 0}; // init attribute directly with the given category
    }

    if ((this.categoryIndices[attribute][category] ?? -1) < 0) {
      this.categoryIndices[attribute][category] = Object.keys(this.categoryIndices[attribute]).length; //will be zero if there are non, 1 if there is alrady an entry and so on
    }

    return this.categoryIndices[attribute][category];
  }

  getNumberOfAttributeCategories(attribute: string): number {
    return Object.keys(this.categoryIndices[attribute] ?? {}).length;
  }

  oneHotArray(length: number, hotIndex: number) {
    const hotArray = new Array(length).fill(0);
    if (hotIndex >= 0 && hotIndex < length) {
      hotArray[hotIndex] = 1;
    }
    return hotArray;
  }
}

/**
 * copy of Attribute.ts (an import would break the worker)
 */
interface IAttribute {
  dataKey: string;
  type: AttributeType;
}
type AttributeType = 'categorical' | 'number' | 'string';
