import { Component, ComponentFactoryResolver, ViewContainerRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Position } from '../../../model/sml/Position';
import { SweCoordinate } from '../../../model/swe/SweCoordinate';
import { SweDataRecord } from '../../../model/swe/SweDataRecord';
import { SweField } from '../../../model/swe/SweField';
import { SweQuantity } from '../../../model/swe/SweQuantity';
import { SweVector } from '../../../model/swe/SweVector';
import { EditorComponent } from '../base/EditorComponent';
import { MapComponent } from '../basic/MapComponent';

@Component({
    selector: 'sml-position',
    templateUrl: './PositionComponent.html',
    styleUrls: ['../styles/editor-component.scss']
})
export class PositionEditorComponent extends EditorComponent<Position> {
    public get latitude(): number {
        return this.getFieldValue('location', 'Lat');
    }

    public set latitude(value: number) {
        this.setFieldValue('location', 'Lat', value);
    }

    public get longitude(): number {
        return this.getFieldValue('location', 'Lon');
    }

    public set longitude(value: number) {
        this.setFieldValue('location', 'Lon', value);
    }

    private get altitude(): number {
        return this.getFieldValue('location', 'Alt');
    }

    private set altitude(value: number) {
        this.setFieldValue('location', 'Alt', value);
    }

    public get trueHeading(): number {
        return this.getFieldValue('orientation', 'TrueHeading');
    }

    public set trueHeading(value: number) {
        this.setFieldValue('orientation', 'TrueHeading', value);
    }

    public get pitch(): number {
        return this.getFieldValue('orientation', 'Pitch');
    }

    public set pitch(value: number) {
        this.setFieldValue('orientation', 'Pitch', value);
    }

    constructor(
        private modalService: NgbModal,
        componentFactoryResolver: ComponentFactoryResolver,
        viewContainerRef: ViewContainerRef
    ) {
        super(componentFactoryResolver, viewContainerRef);
    }

    protected openMap() {
        const ref = this.modalService.open(MapComponent);
        (ref.componentInstance as MapComponent).location = {
            lat: this.latitude,
            lng: this.longitude
        };
        ref.result.then((location: L.LatLngLiteral) => {
            this.longitude = location.lat;
            this.latitude = location.lng;
        });
    }

    protected createModel(): Position {
        return undefined;
    }

    private setFieldValue(vectorName: string, fieldName: string, value: number) {
        const quantity = this.getQuantity(vectorName, fieldName);
        if (quantity) {
            quantity.value = value;
        }
    }

    private getQuantity(vectorName: string, fieldName: string): SweQuantity {
        let vector: SweVector;
        let coordinate: SweCoordinate;

        if (!this.model) {
            return undefined;
        }

        if (vectorName === 'location' && this.model instanceof SweVector) {
            vector = this.model;
        } else if (this.model instanceof SweDataRecord) {
            vector = ((this.model as SweDataRecord).fields.find((field) => {
                return field.name === vectorName;
            }) || {} as SweField).component as SweVector;
        }

        if (!vector) {
            return undefined;
        }

        coordinate = vector.coordinates.find((coord) => {
            return coord.name === fieldName;
        });

        if (!coordinate) {
            return undefined;
        }

        return coordinate.coordinate as SweQuantity;
    }

    private getFieldValue(vectorName: string, fieldName: string): number {
        const quantity = this.getQuantity(vectorName, fieldName);
        return quantity ? quantity.value : undefined;
    }
}
