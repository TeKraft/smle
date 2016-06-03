import {Component, Input, Output, EventEmitter, HostBinding} from '@angular/core';

@Component({
    selector: 'card-header',
    template: require('./CardHeaderComponent.html'),
    styles: [require('./styles/card-header-component.scss')]
})
export class CardHeaderComponent {
    @Input()
    public title: string;

    @HostBinding('class.vertical')
    @Input()
    public verticalMode: boolean;

    @Output()
    public reset: EventEmitter<any> = new EventEmitter();

    @Output()
    public close: EventEmitter<any> = new EventEmitter();

    @Output()
    public closeChild: EventEmitter<any> = new EventEmitter();

    public onReset(): void {
        this.reset.emit(null);
    }

    public onClose(): void {
        this.close.emit(null);
    }

    public onCloseChild(): void {
        this.closeChild.emit(null);
    }
}
