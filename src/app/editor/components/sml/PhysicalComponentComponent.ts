import { Component, ComponentFactoryResolver, ViewContainerRef } from '@angular/core';
import { AbstractPhysicalProcessComponent } from './AbstractPhysicalProcessComponent';
import { PhysicalComponent } from '../../../model/sml/PhysicalComponent';
import { CardComponent } from '../basic/CardComponent';
import { EditorComponent } from '../base/EditorComponent';

@Component({
    selector: 'sml-physical-component',
    template: require('./PhysicalComponentComponent.html'),
    styles: [require('../styles/editor-component.scss')]
})
export class PhysicalComponentComponent extends EditorComponent<PhysicalComponent> {
    constructor(componentFactoryResolver: ComponentFactoryResolver, viewContainerRef: ViewContainerRef) {
        super(componentFactoryResolver, viewContainerRef);
    }

    protected createModel(): PhysicalComponent {
        return new PhysicalComponent();
    }
}
