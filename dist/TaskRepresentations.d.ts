import { IRectTaskRep } from './CohortInterfaces';
import { Task } from './Tasks';
export declare class RectTaskRep implements IRectTaskRep {
    private task;
    id: string;
    label: string;
    private _representation;
    private _repClone;
    private _height;
    private _width;
    image: string;
    private _removeButton;
    constructor(task: Task, height: number, width: number);
    getRepresentation(): HTMLDivElement;
    _create(height: number, width: number): HTMLDivElement;
    private _createClone;
    getClone(): HTMLDivElement;
    setInformation(label: string, image: string): void;
    setLabel(label: string): void;
    setImage(image: string): void;
    private getIconClass;
}
