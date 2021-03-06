import { Component } from '@angular/core';

import { Position } from '../../../model/sml/Position';
import { SweCoordinate } from '../../../model/swe/SweCoordinate';
import { SweDataRecord } from '../../../model/swe/SweDataRecord';
import { SweField } from '../../../model/swe/SweField';
import { SweQuantity } from '../../../model/swe/SweQuantity';
import { SweVector } from '../../../model/swe/SweVector';
import { UnitOfMeasure } from '../../../model/swe/UnitOfMeasure';
import { TrueDescriptionConfig } from '../../../services/config/TrueDescriptionConfig';
import { ChildMetadata } from '../base/ChildMetadata';
import { TypedModelComponent } from '../base/TypedModelComponent';
import { PositionEditorComponent } from '../sml/PositionComponent';

@Component({
    selector: 'position-list',
    templateUrl: './PositionListComponent.html'
})
export class PositionListComponent extends TypedModelComponent<Array<Position>> {

    protected createModel(): Position[] {
        return [];
    }

    public removeItem(index: number) {
        this.model.splice(index, 1);
    }

    public openChild(item: Position) {
        this.openNewChild(new ChildMetadata(PositionEditorComponent, item, new TrueDescriptionConfig()));
        // this.openNewChild(new ChildMetadata(
        //     PositionEditorComponent,
        //     item,
        //     this.config.getConfigFor('swe:DataRecord').getConfigFor('swe:field')
        //         .getConfigFor('swe:Vector').getConfigFor('swe:coordinate').getConfigFor('swe:Quantity')
        // ));
    }

    public getPositionLabel(positionItem: Position): string {
        if (positionItem instanceof SweVector) {
            return 'Vector';
        } else if (positionItem instanceof SweDataRecord) {
            return 'Data Record';
        } else {
            return '';
        }
    }

    public getPositionValue(positionItem: Position): string {
        if (positionItem instanceof SweVector) {
            const value = [];
            positionItem.coordinates.forEach((entry) => {
                value.push(entry.name + ': ' + entry.coordinate.value);
            });
            return value.join(', ');
        } else if (positionItem instanceof SweDataRecord) {
            return '';
        } else {
            return '';
        }
    }

    public addVector() {
        const newItem = this.createPositionLocation();

        this.addModelIfNotExist();
        this.model.push(newItem);
    }

    public addDataRecord() {
        const newItem = this.createPositionDataRecord();

        this.addModelIfNotExist();
        this.model.push(newItem);
    }

    private addModelIfNotExist() {
        if (!this.model) {
            this.model = [];
            this.modelChange.emit(this.model);
        }
    }

    private createPositionLocation(withAlt: boolean = false): SweVector {
        const location = new SweVector();

        location.coordinates.push(this.createCoordinate('Lat', 0, 'deg'));
        location.coordinates.push(this.createCoordinate('Lon', 0, 'deg'));
        if (withAlt) {
            location.coordinates.push(this.createCoordinate('Alt', 0, 'm'));
        }

        return location;
    }

    private createCoordinate(name: string, value: number, uom: string): SweCoordinate {
        const coordinate = new SweCoordinate();
        const quantity = new SweQuantity();
        const unitOfMeasure = new UnitOfMeasure();

        unitOfMeasure.code = uom;

        quantity.value = value;
        quantity.uom = unitOfMeasure;

        coordinate.name = name;
        coordinate.coordinate = quantity;

        return coordinate;
    }

    private createPositionDataRecord(): SweDataRecord {
        const dataRecord = new SweDataRecord();
        const locationField = new SweField();
        const orientationField = new SweField();

        locationField.name = 'location';
        locationField.component = this.createPositionLocation(true);
        dataRecord.fields.push(locationField);

        orientationField.name = 'orientation';
        orientationField.component = this.createPositionOrientation();
        dataRecord.fields.push(orientationField);

        return dataRecord;
    }

    private createPositionOrientation(): SweVector {
        const orientation = new SweVector();

        orientation.coordinates.push(this.createCoordinate('TrueHeading', 0, 'deg'));
        orientation.coordinates.push(this.createCoordinate('Pitch', 0, 'deg'));

        return orientation;
    }

}
