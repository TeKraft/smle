import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AbstractProcess, PhysicalSystem, PhysicalComponent, SimpleProcess, Term } from '../model/sml';
import { DescriptionRepository } from '../services/DescriptionRepository';
import { PublishDescriptionService } from '../sos/publish/publish.service';
import { SosService } from '../sos/sos.service';
import { XmlService } from '../services/XmlService';
import { Observable, Observer } from 'rxjs';
import { DescriptionConfigService } from './DescriptionConfigService';
import { DescriptionConfig } from './config/DescriptionConfig';
import { EditorMode } from './EditorMode';
import { DynamicGUIService, ReturnObject } from './DynamicGUIService';

export enum DescriptionType {
    PhysicalSystem = 1,
    PhysicalComponent = 2,
    SimpleProcess = 3,
    DynamicGUI = 4
}

@Injectable()
export class EditorService {

    private description: AbstractProcess;
    private procedureId: string;
    private sosUrl: string;
    private editorMode: EditorMode;

    constructor(
        private service: DescriptionRepository,
        private router: Router,
        private xmlService: XmlService<AbstractProcess>,
        private configService: DescriptionConfigService,
        private dynamicGUIService: DynamicGUIService,
        private publish: PublishDescriptionService,
        private sosService: SosService
    ) { }

    openEditorWithDescription(desc: AbstractProcess) {
        this.description = desc;
        this.router.navigate(['/editor']);
    }

    getDescriptionForId(id: string): Observable<AbstractProcess> {
        this.sosUrl = null;
        this.procedureId = null;
        this.editorMode = EditorMode.Default;
        return new Observable<AbstractProcess>((observer: Observer<AbstractProcess>) => {
            if (id) {
                this.service.getDescription(id).then(desc => {
                    this.description = desc;
                    observer.next(this.description);
                    observer.complete();
                }).catch(error => {
                    observer.error(error);
                    observer.complete();
                });
            } else {
                if (!this.description) this.description = null;
                observer.next(this.description);
                observer.complete();
            }
        });
    }

    useDiscoveryProfiles(): Observable<ReturnObject> {
        return new Observable<ReturnObject>((observer: Observer<ReturnObject>) => {
            this.dynamicGUIService.getModelAndConfiguration().subscribe((returnObject: ReturnObject) => {
                this.editorMode = EditorMode.Dynamic;
                this.description = returnObject.model;
                observer.next(returnObject);
                observer.complete();
            });
        });
    }

    createOrUpdateVersion(description: AbstractProcess) {
        if (description.identification
            && description.identification.length > 0) {
            let identifers = description.identification[0].identifiers;
            let versionElem = identifers.find(entry => {
                return entry.label === 'version' ? true : false;
            });
            if (versionElem) {
                versionElem.value = parseInt(versionElem.value, 10) + 1 + '';
            } else {
                let term = new Term();
                term.label = 'version';
                term.value = '1';
                identifers.push(term);
            }
        }
    }

    provideDownload(description: AbstractProcess) {
        let data = this.xmlService.serialize(description);
        let blob = new Blob([data], { type: 'text/xml' });
        let url = window.URL.createObjectURL(blob);
        window.open(url);
    }

    getDescriptionType() {
        if (this.description instanceof PhysicalSystem) {
            return DescriptionType.PhysicalSystem;
        } else if (this.description instanceof PhysicalComponent) {
            return DescriptionType.PhysicalComponent;
        } else if (this.description instanceof SimpleProcess) {
            return DescriptionType.SimpleProcess;
        } else {
            return DescriptionType.DynamicGUI;
        }
    }

    getConfiguration(): Observable<DescriptionConfig> {
        return this.configService.getConfiguration(this.editorMode);
    }

    setSosUrl(sosUrl: string) {
        this.sosUrl = sosUrl;
    }

    getEditorMode(): EditorMode {
        return this.editorMode;
    }

    getDescription(): AbstractProcess {
        return this.description;
    }

    setDescription(desc: AbstractProcess) {
        this.description = desc;
    }

    loadDescriptionByIdAndUrl(id: string, url: string): Observable<AbstractProcess> {
        return new Observable<AbstractProcess>((observer: Observer<AbstractProcess>) => {
            this.sosService.fetchDescription(id, url).subscribe(res => {
                let description = this.xmlService.deserialize(res);
                this.createOrUpdateVersion(description);
                this.sosUrl = url;
                observer.next(description);
                observer.complete();
            }, error => {
                observer.error(error);
                observer.complete();
            });
        });
    }

    // -------

    startPublishingDescription(description: AbstractProcess) {
        this.publish.setDescription(description);
        this.publish.setSosUrl(this.sosUrl);
        this.router.navigate(['/publish']);
    }

}
