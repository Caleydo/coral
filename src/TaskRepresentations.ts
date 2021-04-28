import {IRectTaskRep} from './CohortInterfaces';
import {Task} from './Tasks';

export class RectTaskRep implements IRectTaskRep {
  id: string;
  label: string;

  private _representation: HTMLDivElement;
  private _repClone: HTMLDivElement;
  private _height: number;
  private _width: number;
  image: string; //url to the image for the representation

  constructor(private task: Task, height: number, width: number) {
    this.id = task.id;
    this.label = task.label;
    this._height = height;
    this._width = width;
    this._representation = this._create(height, width);
    this._repClone = this._createClone(this._representation);
    this.setLabel(task.label);
  }

  public getRepresentation(): HTMLDivElement {
    return this._representation;
  }

  public _create(height: number, width: number): HTMLDivElement {
    const container: HTMLDivElement = document.createElement('div');
    container.className = 'rectTask';
    container.id = this.id;
    container.style.width = '' + width;

    const labelHeight = Math.round((height * 0.4) * 100) / 100;
    const imgHeight = height - labelHeight;
    const fontSize = labelHeight < 15 ? labelHeight - 1 : 14;

    // create image div
    const divImage: HTMLDivElement = document.createElement('div');
    divImage.className = 'rectTask-image';
    divImage.style.height = imgHeight + 'px';
    //create fontawesome icon
    const iIcon: HTMLElement = document.createElement('i');
    divImage.appendChild(iIcon);


    container.appendChild(divImage);

    // create label div
    const divLabel: HTMLDivElement = document.createElement('div');
    divLabel.className = 'rectTask-label';
    divLabel.style.height = labelHeight + 'px';
    divLabel.style.lineHeight = labelHeight + 'px';
    divLabel.style.fontSize = fontSize + 'px';
    container.appendChild(divLabel);

    return container;
  }

  private _createClone(original: HTMLDivElement): HTMLDivElement {
    const clone = original.cloneNode(true) as HTMLDivElement;
    clone.id = 'clone_' + this.id;
    clone.style.setProperty('grid-area', null);

    return clone;
  }

  public getClone(): HTMLDivElement {
    return this._repClone;
  }

  public setInformation(label: string, image: string) {
    this.setLabel(label);
    this.setImage(image);
  }

  public setLabel(label: string) {
    // original
    const divLabel: HTMLDivElement = this._representation.querySelector('div.rectTask-label');
    divLabel.innerHTML = label;
    divLabel.title = label;
    // clone
    const divLabelClone: HTMLDivElement = this._repClone.querySelector('div.rectTask-label');
    divLabelClone.innerHTML = label;
    divLabelClone.title = label;
  }

  public setImage(image: string) {
    this.image = image;
    // original
    const divImage = (this._representation.querySelector('div.rectTask-image') as HTMLDivElement);
    divImage.classList.add(image);
    (divImage.querySelector('i') as HTMLElement).classList.add(...this.getIconClass(image));
    // // clone
    const divImageClone = (this._repClone.querySelector('div.rectTask-image') as HTMLDivElement);
    divImageClone.classList.add(image);
    (divImageClone.querySelector('i') as HTMLElement).classList.add(...this.getIconClass(image));
  }

  private getIconClass(image: string): string[] {
    if (image === 'filter') {
      return ['fas', 'fa-filter'];
    } else if (image === 'split') {
      return ['fas', 'fa-share-alt'];
    } else {
      return [];
    }
  }
}
