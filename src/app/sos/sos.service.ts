import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { AbstractProcess } from '../model/sml';
import { SensorMLXmlService } from '../services/SensorMLXmlService';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

@Injectable()
export class SosService {

  private sosUrl: string = 'http://localhost:8081/52n-sos-webapp/service';

  constructor(
    private http: Http
  ) { }

  public fetchDescriptionIDs(sosUrl?: string): Observable<Array<string>> {
    let body = JSON.stringify({
      'request': 'GetCapabilities',
      'service': 'SOS',
      'sections': [
        'OperationsMetadata'
      ]
    });
    return this.http.post(this.useSosUrl(sosUrl), body, { headers: this.createJsonHeader() })
      .map(this.extractDescriptionIDs)
      .catch(this.handleError);
  }

  public fetchDescription(descId: string, sosUrl?: string): Observable<string> {
    let body = JSON.stringify({
      'request': 'DescribeSensor',
      'service': 'SOS',
      'version': '2.0.0',
      'procedure': descId,
      'procedureDescriptionFormat': 'http://www.opengis.net/sensorml/2.0'
    });
    return this.http.post(this.useSosUrl(sosUrl), body, { headers: this.createJsonHeader() })
      .map((res) => {
        let json = res.json();
        return json.procedureDescription.description || json.procedureDescription;
      });
  }

  public hasSosDescription(descID: string, sosUrl?: string): Observable<boolean> {
    return new Observable<boolean>((observer: Observer<boolean>) => {
      this.fetchDescriptionIDs(this.useSosUrl(sosUrl)).subscribe((res) => {
        res.forEach((entry) => {
          if (entry === descID) {
            observer.next(true);
            observer.complete();
          }
        });
        observer.next(false);
        observer.complete();
      }, (error) => {
        observer.error(error);
        observer.complete();
      });
    });
  }

  public addDescription(description: AbstractProcess, sosUrl?: string): Observable<boolean> {
    let body = JSON.stringify({
      'request': 'InsertSensor',
      'service': 'SOS',
      'version': '2.0.0',
      'procedureDescriptionFormat': 'http://www.opengis.net/sensorml/2.0',
      'procedureDescription': new SensorMLXmlService().serialize(description),
      // featureOfInterest auswählbar machen
      'featureOfInterestType': 'http://www.opengis.net/def/samplingFeatureType/OGC-OM/2.0/SF_SamplingPoint',
      // observationType auswählbar machen ???
      'observationType': [
        'http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement'
      ],
      // observableProperty auswählbar machen ???
      'observableProperty': [
        'http://www.52north.org/test/observableProperty/9_1']
    });
    return this.http.post(this.useSosUrl(sosUrl), body, { headers: this.createJsonHeader() })
      .map(this.handleAddDescription)
      .catch(this.handleAddDescriptionError);
  }

  public updateDescription(descID: string, description: AbstractProcess, sosUrl?: string): Observable<boolean> {
    let body = JSON.stringify({
      'request': 'UpdateSensorDescription',
      'service': 'SOS',
      'version': '2.0.0',
      'procedure': descID,
      'procedureDescriptionFormat': 'http://www.opengis.net/sensorml/2.0',
      'procedureDescription': new SensorMLXmlService().serialize(description)
    });
    return this.http.post(this.useSosUrl(sosUrl), body, { headers: this.createJsonHeader() })
      .map(this.handleAddDescription)
      .catch(this.handleAddDescriptionError);
  }

  private createJsonHeader(): Headers {
    return new Headers({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  private extractDescriptionIDs(res: Response): Array<string> {
    let json = res.json();
    return json.operationMetadata.operations.DescribeSensor.parameters.procedure.allowedValues;
  }

  private handleAddDescription(res: Response): boolean {
    return true;
  }

  private handleAddDescriptionError(error: Response) {
    let json = error.json();
    if (json.exceptions && json.exceptions.length >= -1) {
      let errors: Array<string> = [];
      (json.exceptions as Array<any>).forEach(entry => {
        errors.push(entry.locator);
      });
      return Observable.throw(errors);
    }
    return Observable.throw([this.handleError(error)]);
  }

  private handleError(res: Response) {
    if (res.status === 0) return Observable.throw('Could not reach the service!');
  }

  private useSosUrl(sosUrl: string) {
    return sosUrl || this.sosUrl;
  }

}