import { Component, Directive, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'list',
    styleUrls: ['../styles/basic-component.scss'],
    templateUrl: './ListComponent.html'
})
export class ListComponent {

    @Input()
    public list: any[];

    @Input()
    public itemLabelFunc: () => void;

    @Input()
    public itemValueFunc: () => void;

    @Input()
    public fixLength: boolean;

    @Input()
    public noSelect = false;

    @Input()
    public shouldItemVisible: (value: any) => boolean;

    @Output()
    public select: EventEmitter<any> = new EventEmitter<any>();

    @Output()
    public add: EventEmitter<any> = new EventEmitter<any>();

    @Output()
    public remove: EventEmitter<number> = new EventEmitter<number>();

    protected isVisible(item: any) {
        return this.shouldItemVisible ? this.shouldItemVisible(item) : true;
    }

    protected onClick(item: any, index: number) {
        this.select.emit(item);
    }

    protected onRemove(item: any, index: number) {
        if (!this.fixLength) {
            this.remove.emit(index);
        }
    }

    protected onAdd() {
        if (!this.fixLength) {
            this.add.emit(null);
        }
    }
}
@Directive({ selector: 'list-add-section' })
export class ListAddSectionDirective {
    // No behavior - The only purpose is to "declare" the tag in Angular2
}
