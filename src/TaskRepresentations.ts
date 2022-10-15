import { IRectTaskRep } from './app/interfaces';
import { Task } from './Tasks';
import { TaskRemoveEvent } from './base/events';

export class RectTaskRep implements IRectTaskRep {
  id: string;

  label: string;

  private _representation: HTMLDivElement;

  private _repClone: HTMLDivElement;

  private _height: number;

  private _width: number;

  image: string; // url to the image for the representation

  private _removeButton: HTMLAnchorElement;

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
    container.style.width = `${width}`;

    const labelHeight = Math.round(height * 0.4 * 100) / 100;
    const imgHeight = height - labelHeight;
    const fontSize = labelHeight < 15 ? labelHeight - 1 : 14;

    // remove button
    this._removeButton = document.createElement('a');
    this._removeButton.classList.add('remove-task');
    this._removeButton.toggleAttribute('hidden', true);
    this._removeButton.innerHTML = '<i class="fas fa-trash" aria-hidden="true"></i>';
    container.appendChild(this._removeButton);

    // create image div
    const divImage: HTMLDivElement = document.createElement('div');
    divImage.className = 'rectTask-image';
    divImage.style.height = `${imgHeight}px`;
    // create fontawesome icon
    const iIcon: HTMLElement = document.createElement('i');
    divImage.appendChild(iIcon);

    container.appendChild(divImage);

    // create label div
    const divLabel: HTMLDivElement = document.createElement('div');
    divLabel.className = 'rectTask-label';
    divLabel.style.height = `${labelHeight}px`;
    divLabel.style.lineHeight = `${labelHeight}px`;
    divLabel.style.fontSize = `${fontSize}px`;
    container.appendChild(divLabel);

    // show remove icon on hover
    container.addEventListener('mouseenter', (event) => {
      event.stopPropagation();
      // show remove icon (=trash can)
      this._removeButton.removeAttribute('hidden');
    });
    container.addEventListener('mouseleave', (event) => {
      event.stopPropagation();
      // hide remove icon (=trash can)
      this._removeButton.toggleAttribute('hidden', true);
    });
    container.addEventListener('click', (event) => {
      if (event.target === this._removeButton.childNodes[0]) {
        // open modal
        ($('#deleteModal') as any).modal('show');
        // get modal
        const modal = document.getElementById('deleteModal');
        if (modal) {
          // set type text of element
          const text = modal.querySelector('.element-name');
          text.innerHTML = 'operation';

          // get delete button in modal
          let delConfirm = modal.querySelector('.confirm-delete');
          if (delConfirm) {
            // replace element with copy of it to remove the eventlisteners
            delConfirm.replaceWith(delConfirm.cloneNode(true));
            delConfirm = modal.querySelector('.confirm-delete');

            // add click event to delete button
            delConfirm.addEventListener('click', (event2) => {
              // dispatch event to remove task and its children
              container.dispatchEvent(new TaskRemoveEvent(this.task));
              event2.stopPropagation();
              // hide modal
              ($('#deleteModal') as any).modal('hide');
            });
          }
        }
        event.stopPropagation();
      }
    });

    return container;
  }

  private _createClone(original: HTMLDivElement): HTMLDivElement {
    const clone = original.cloneNode(true) as HTMLDivElement;
    clone.id = `clone_${this.id}`;
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
    const divImage = this._representation.querySelector('div.rectTask-image') as HTMLDivElement;
    divImage.classList.add(image);
    (divImage.querySelector('i') as HTMLElement).classList.add(...this.getIconClass(image));
    // // clone
    const divImageClone = this._repClone.querySelector('div.rectTask-image') as HTMLDivElement;
    divImageClone.classList.add(image);
    (divImageClone.querySelector('i') as HTMLElement).classList.add(...this.getIconClass(image));
  }

  private getIconClass(image: string): string[] {
    if (image === 'filter') {
      return ['fas', 'fa-filter'];
    }
    if (image === 'split') {
      return ['fas', 'fa-share-alt'];
    }
    return [];
  }
}
