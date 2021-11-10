import { TaskRemoveEvent } from './utilCustomEvents';
export class RectTaskRep {
    constructor(task, height, width) {
        this.task = task;
        this.id = task.id;
        this.label = task.label;
        this._height = height;
        this._width = width;
        this._representation = this._create(height, width);
        this._repClone = this._createClone(this._representation);
        this.setLabel(task.label);
    }
    getRepresentation() {
        return this._representation;
    }
    _create(height, width) {
        const container = document.createElement('div');
        container.className = 'rectTask';
        container.id = this.id;
        container.style.width = '' + width;
        const labelHeight = Math.round((height * 0.4) * 100) / 100;
        const imgHeight = height - labelHeight;
        const fontSize = labelHeight < 15 ? labelHeight - 1 : 14;
        // remove button
        this._removeButton = document.createElement('a');
        this._removeButton.classList.add('remove-task');
        this._removeButton.toggleAttribute('hidden', true);
        this._removeButton.innerHTML = '<i class="fas fa-trash" aria-hidden="true"></i>';
        container.appendChild(this._removeButton);
        // create image div
        const divImage = document.createElement('div');
        divImage.className = 'rectTask-image';
        divImage.style.height = imgHeight + 'px';
        //create fontawesome icon
        const iIcon = document.createElement('i');
        divImage.appendChild(iIcon);
        container.appendChild(divImage);
        // create label div
        const divLabel = document.createElement('div');
        divLabel.className = 'rectTask-label';
        divLabel.style.height = labelHeight + 'px';
        divLabel.style.lineHeight = labelHeight + 'px';
        divLabel.style.fontSize = fontSize + 'px';
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
                $('#deleteModal').modal('show');
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
                        delConfirm.addEventListener('click', (event) => {
                            // dispatch event to remove task and its children
                            container.dispatchEvent(new TaskRemoveEvent(this.task));
                            event.stopPropagation();
                            // hide modal
                            $('#deleteModal').modal('hide');
                        });
                    }
                }
                event.stopPropagation();
            }
        });
        return container;
    }
    _createClone(original) {
        const clone = original.cloneNode(true);
        clone.id = 'clone_' + this.id;
        clone.style.setProperty('grid-area', null);
        return clone;
    }
    getClone() {
        return this._repClone;
    }
    setInformation(label, image) {
        this.setLabel(label);
        this.setImage(image);
    }
    setLabel(label) {
        // original
        const divLabel = this._representation.querySelector('div.rectTask-label');
        divLabel.innerHTML = label;
        divLabel.title = label;
        // clone
        const divLabelClone = this._repClone.querySelector('div.rectTask-label');
        divLabelClone.innerHTML = label;
        divLabelClone.title = label;
    }
    setImage(image) {
        this.image = image;
        // original
        const divImage = this._representation.querySelector('div.rectTask-image');
        divImage.classList.add(image);
        divImage.querySelector('i').classList.add(...this.getIconClass(image));
        // // clone
        const divImageClone = this._repClone.querySelector('div.rectTask-image');
        divImageClone.classList.add(image);
        divImageClone.querySelector('i').classList.add(...this.getIconClass(image));
    }
    getIconClass(image) {
        if (image === 'filter') {
            return ['fas', 'fa-filter'];
        }
        else if (image === 'split') {
            return ['fas', 'fa-share-alt'];
        }
        else {
            return [];
        }
    }
}
//# sourceMappingURL=TaskRepresentations.js.map